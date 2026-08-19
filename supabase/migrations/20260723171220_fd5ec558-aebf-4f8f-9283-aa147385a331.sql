
-- ============================================================
-- PHASE 2 — Séparation propre des workflows Lead / RDV / Traitement
-- Migration idempotente et non destructive
-- ============================================================

-- ---------- 1) APPOINTMENT_REQUESTS : nouveaux statuts leads uniquement ----------
DO $$
DECLARE
  r RECORD;
  new_status text;
  mapping jsonb := '{
    "nouveau":"new","new":"new",
    "a_contacter":"to_contact","to_contact":"to_contact",
    "contacte":"contacted","contacted":"contacted",
    "en_discussion":"qualified","qualified":"qualified",
    "sans_reponse":"waiting_reply","en_attente":"waiting_reply","waiting_reply":"waiting_reply",
    "rdv_propose":"appointment_proposed","appointment_proposed":"appointment_proposed",
    "converti":"converted","converted":"converted",
    "annule":"lost","perdu":"lost","lost":"lost",
    "doublon":"duplicate","duplicate":"duplicate",
    "invalide":"invalid","invalid":"invalid"
  }'::jsonb;
BEGIN
  FOR r IN SELECT id, status, converted_patient_id FROM public.appointment_requests LOOP
    IF r.status IS NULL OR r.status = '' THEN
      new_status := 'new';
    ELSIF mapping ? r.status THEN
      new_status := mapping->>r.status;
    ELSIF r.status IN ('confirme','confirmed','venu','attended','traitement_accepte','treatment_accepted','termine','completed') THEN
      -- Valeurs héritées liées au cycle RDV/traitement : on préserve la sémantique lead
      new_status := CASE WHEN r.converted_patient_id IS NOT NULL THEN 'converted' ELSE 'appointment_proposed' END;
      INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, before, after)
      VALUES ('phase2_migrate','appointment_request', r.id,
              format('Statut hérité "%s" migré vers "%s"', r.status, new_status),
              jsonb_build_object('legacy_status', r.status),
              jsonb_build_object('status', new_status));
    ELSIF r.status IN ('non_presente','no_show') THEN
      new_status := 'lost';
      INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, before, after)
      VALUES ('phase2_migrate','appointment_request', r.id,
              format('Statut hérité "%s" migré vers "lost"', r.status),
              jsonb_build_object('legacy_status', r.status), jsonb_build_object('status','lost'));
    ELSE
      new_status := CASE WHEN r.converted_patient_id IS NOT NULL THEN 'qualified' ELSE 'new' END;
      INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, before, after)
      VALUES ('phase2_migrate_ambiguous','appointment_request', r.id,
              format('Statut ambigu "%s" mappé conservativement vers "%s"', r.status, new_status),
              jsonb_build_object('legacy_status', r.status), jsonb_build_object('status', new_status));
    END IF;

    IF new_status IS DISTINCT FROM r.status THEN
      UPDATE public.appointment_requests SET status = new_status, updated_at = now() WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.appointment_requests ALTER COLUMN status SET DEFAULT 'new';

-- ---------- 2) APPOINTMENTS : cycle de vie indépendant ----------
DO $$
DECLARE
  r RECORD;
  new_status text;
  mapping jsonb := '{
    "a_confirmer":"tentative","tentative":"tentative",
    "confirme":"confirmed","confirmed":"confirmed",
    "arrive":"arrived","arrived":"arrived",
    "en_attente":"waiting","waiting":"waiting",
    "en_consultation":"in_consultation","in_consultation":"in_consultation",
    "termine":"completed","completed":"completed","venu":"completed","attended":"completed",
    "reporte":"rescheduled","rescheduled":"rescheduled",
    "annule":"cancelled","cancelled":"cancelled",
    "non_presente":"no_show","no_show":"no_show"
  }'::jsonb;
BEGIN
  FOR r IN SELECT id, status FROM public.appointments LOOP
    IF r.status IS NULL OR r.status = '' THEN
      new_status := 'tentative';
    ELSIF mapping ? r.status THEN
      new_status := mapping->>r.status;
    ELSE
      new_status := 'tentative';
      INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, before, after)
      VALUES ('phase2_migrate_ambiguous','appointment', r.id,
              format('Statut RDV ambigu "%s" mappé vers "tentative"', r.status),
              jsonb_build_object('legacy_status', r.status), jsonb_build_object('status','tentative'));
    END IF;

    IF new_status IS DISTINCT FROM r.status THEN
      UPDATE public.appointments SET status = new_status, updated_at = now() WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.appointments ALTER COLUMN status SET DEFAULT 'tentative';

-- ---------- 3) PATIENT_TREATMENTS : renseigne la colonne "status" ----------
DO $$
DECLARE
  r RECORD;
  new_status text;
  stage_mapping jsonb := '{
    "interet":"interest","interest":"interest",
    "consultation":"consultation",
    "diagnostic":"diagnosis","diagnosis":"diagnosis",
    "propose":"proposal","proposal":"proposal",
    "devis_envoye":"quote_sent","quote_sent":"quote_sent",
    "accepte":"accepted","accepted":"accepted",
    "planifie":"scheduled","scheduled":"scheduled",
    "en_cours":"in_progress","in_progress":"in_progress",
    "suivi":"follow_up","follow_up":"follow_up",
    "termine":"completed","completed":"completed",
    "abandonne":"abandoned","abandoned":"abandoned"
  }'::jsonb;
  src text;
BEGIN
  FOR r IN SELECT id, stage, status FROM public.patient_treatments LOOP
    src := COALESCE(NULLIF(r.status,''), NULLIF(r.stage,''));
    IF src IS NULL THEN
      new_status := 'interest';
    ELSIF stage_mapping ? src THEN
      new_status := stage_mapping->>src;
    ELSE
      new_status := 'interest';
      INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, before, after)
      VALUES ('phase2_migrate_ambiguous','patient_treatment', r.id,
              format('Étape/statut traitement ambigu "%s" mappé vers "interest"', src),
              jsonb_build_object('legacy_stage', r.stage, 'legacy_status', r.status),
              jsonb_build_object('status','interest'));
    END IF;

    IF new_status IS DISTINCT FROM r.status THEN
      UPDATE public.patient_treatments SET status = new_status, updated_at = now() WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.patient_treatments ALTER COLUMN status SET DEFAULT 'interest';

-- ---------- 4) RPC : Conversion atomique demande → patient ----------
CREATE OR REPLACE FUNCTION public.convert_request_to_patient(
  _request_id uuid,
  _existing_patient_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.appointment_requests%ROWTYPE;
  target_patient uuid;
  actor uuid := auth.uid();
BEGIN
  IF NOT public.is_staff(actor) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO req FROM public.appointment_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demande introuvable';
  END IF;

  IF req.converted_patient_id IS NOT NULL THEN
    RETURN req.converted_patient_id;
  END IF;

  IF _existing_patient_id IS NOT NULL THEN
    SELECT id INTO target_patient FROM public.patients WHERE id = _existing_patient_id;
    IF target_patient IS NULL THEN
      RAISE EXCEPTION 'Patient sélectionné introuvable';
    END IF;
  ELSE
    -- Recherche automatique par téléphone normalisé
    SELECT id INTO target_patient
    FROM public.patients
    WHERE phone_e164 = req.phone_e164
    ORDER BY created_at ASC
    LIMIT 1;

    IF target_patient IS NULL THEN
      INSERT INTO public.patients (
        full_name, phone_e164, phone_raw, source,
        treatment_interest, preferred_contact, lifecycle_status
      ) VALUES (
        req.name, req.phone_e164, req.phone_raw,
        COALESCE(req.source_page, 'site'), req.treatment,
        req.contact_method, 'prospect'
      )
      RETURNING id INTO target_patient;

      INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, after, actor_id)
      VALUES ('create','patient', target_patient,
              format('Patient créé depuis la demande %s', req.id),
              jsonb_build_object('from_request', req.id), actor);
    END IF;
  END IF;

  UPDATE public.appointment_requests
     SET converted_patient_id = target_patient,
         status = 'converted',
         updated_at = now()
   WHERE id = req.id;

  INSERT INTO public.patient_activities (patient_id, request_id, type, summary, actor_id)
  VALUES (target_patient, req.id, 'conversion',
          CASE WHEN _existing_patient_id IS NOT NULL
               THEN 'Demande liée à un patient existant'
               ELSE 'Patient créé depuis la demande' END,
          actor);

  INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, after, actor_id)
  VALUES ('convert','appointment_request', req.id,
          'Conversion demande → patient',
          jsonb_build_object('patient_id', target_patient), actor);

  RETURN target_patient;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convert_request_to_patient(uuid, uuid) TO authenticated;

-- ---------- 5) RPC : Suggestions de patients potentiels (par téléphone) ----------
CREATE OR REPLACE FUNCTION public.suggest_patients_for_request(_request_id uuid)
RETURNS TABLE(id uuid, full_name text, phone_e164 text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone_e164, p.created_at
  FROM public.patients p
  JOIN public.appointment_requests r ON r.id = _request_id
  WHERE p.phone_e164 = r.phone_e164
     OR (r.name IS NOT NULL AND p.full_name ILIKE '%' || r.name || '%')
  ORDER BY (p.phone_e164 = r.phone_e164) DESC, p.created_at DESC
  LIMIT 5;
$$;

GRANT EXECUTE ON FUNCTION public.suggest_patients_for_request(uuid) TO authenticated;
