
-- ==========================================================
-- Phase 3.5 batch 2: Global search RPC + notification privacy
-- ==========================================================

-- 1) Ensure phone lookup is fast (trigram + normalized)
CREATE INDEX IF NOT EXISTS patients_phone_trgm_idx ON public.patients USING gin (phone_e164 gin_trgm_ops);
CREATE INDEX IF NOT EXISTS appt_req_phone_trgm_idx ON public.appointment_requests USING gin (phone_e164 gin_trgm_ops);
CREATE INDEX IF NOT EXISTS appt_req_name_trgm_idx ON public.appointment_requests USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS follow_up_title_trgm_idx ON public.follow_up_tasks USING gin (title gin_trgm_ops);

-- 2) Permission-scoped global search
CREATE OR REPLACE FUNCTION public.admin_global_search(
  p_query text,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  result_type text,
  id uuid,
  title text,
  subtitle text,
  route text,
  status text,
  occurred_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q text := lower(btrim(coalesce(p_query,'')));
  qlike text;
  qdigits text;
  uid uuid := auth.uid();
  is_mkt boolean := public.is_marketing(uid);
  can_all boolean := public.is_admin(uid) OR public.is_reception(uid);
  lmt integer := least(greatest(coalesce(p_limit, 20), 1), 50);
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF is_mkt AND NOT can_all THEN RETURN; END IF; -- marketing has no clinical access
  IF length(q) < 2 THEN RETURN; END IF;
  qlike := '%' || q || '%';
  qdigits := regexp_replace(coalesce(p_query,''), '[^0-9]', '', 'g');

  -- Patients (scoped)
  RETURN QUERY
  SELECT 'patient'::text, p.id, p.full_name,
         COALESCE(p.phone_e164, '') AS subtitle,
         ('/admin/patients/' || p.id::text) AS route,
         p.lifecycle_status AS status,
         COALESCE(p.updated_at, p.created_at) AS occurred_at
  FROM public.patients p
  WHERE (
      lower(p.full_name) LIKE qlike
      OR (qdigits <> '' AND regexp_replace(coalesce(p.phone_e164,''),'[^0-9]','','g') LIKE '%'||qdigits||'%')
    )
    AND (can_all OR public.can_access_patient(p.id, uid))
  ORDER BY COALESCE(p.updated_at, p.created_at) DESC
  LIMIT lmt;

  -- Appointment requests (leads) — reception/admin only
  IF can_all THEN
    RETURN QUERY
    SELECT 'request'::text, r.id, r.name,
           COALESCE(r.phone_e164,'') AS subtitle,
           ('/admin/demandes/' || r.id::text) AS route,
           r.status,
           r.created_at AS occurred_at
    FROM public.appointment_requests r
    WHERE (
        lower(coalesce(r.name,'')) LIKE qlike
        OR (qdigits <> '' AND regexp_replace(coalesce(r.phone_e164,''),'[^0-9]','','g') LIKE '%'||qdigits||'%')
        OR lower(coalesce(r.treatment,'')) LIKE qlike
      )
    ORDER BY r.created_at DESC
    LIMIT lmt;
  END IF;

  -- Appointments (scoped via can_access_appointment)
  RETURN QUERY
  SELECT 'appointment'::text, a.id,
         COALESCE(a.treatment, 'Rendez-vous') AS title,
         to_char(a.starts_at AT TIME ZONE 'Africa/Algiers', 'DD Mon YYYY HH24:MI') AS subtitle,
         '/admin/agenda' AS route,
         a.status,
         a.starts_at AS occurred_at
  FROM public.appointments a
  LEFT JOIN public.patients p ON p.id = a.patient_id
  WHERE (
      lower(coalesce(a.treatment,'')) LIKE qlike
      OR lower(coalesce(p.full_name,'')) LIKE qlike
    )
    AND (can_all OR public.can_access_appointment(a.id, uid))
  ORDER BY a.starts_at DESC
  LIMIT lmt;

  -- Follow-up tasks — visible if assigned to me OR reception/admin
  RETURN QUERY
  SELECT 'followup'::text, f.id, f.title,
         COALESCE(to_char(f.due_at AT TIME ZONE 'Africa/Algiers', 'DD Mon HH24:MI'), '') AS subtitle,
         '/admin/suivis' AS route,
         f.status,
         COALESCE(f.due_at, f.created_at) AS occurred_at
  FROM public.follow_up_tasks f
  WHERE (
      lower(coalesce(f.title,'')) LIKE qlike
      OR lower(coalesce(f.description,'')) LIKE qlike
    )
    AND (can_all OR f.assigned_to = uid OR (f.patient_id IS NOT NULL AND public.can_access_patient(f.patient_id, uid)))
  ORDER BY COALESCE(f.due_at, f.created_at) DESC
  LIMIT lmt;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_global_search(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_global_search(text, integer) TO authenticated;

-- 3) Notification privacy: rewrite new-request trigger to use GENERIC copy.
-- Marketing already excluded by SELECT policy; but broadcast title must not
-- expose the lead's name to unrelated recipients.
CREATE OR REPLACE FUNCTION public.on_new_appointment_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, body, priority, link, meta)
  VALUES (
    'new_request',
    'Nouvelle demande de rendez-vous',
    'Une nouvelle demande vient d''arriver — ouvrez la fiche pour les détails.',
    'high',
    '/admin/demandes/' || NEW.id::text,
    jsonb_build_object('request_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

-- 4) Notification list helper: server-filtered, redacted for non-authorized
CREATE OR REPLACE FUNCTION public.list_my_notifications(p_limit integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  type text,
  title text,
  body text,
  priority text,
  link text,
  read_at timestamptz,
  created_at timestamptz,
  read_for_me boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  is_mkt boolean;
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF NOT public.is_staff(uid) THEN RETURN; END IF;
  is_mkt := public.is_marketing(uid) AND NOT (public.is_admin(uid) OR public.is_reception(uid));

  RETURN QUERY
  SELECT
    n.id, n.user_id, n.type,
    -- Redact title/body if the recipient cannot access the linked entity
    CASE
      WHEN is_mkt AND (n.meta ? 'patient_id' OR n.meta ? 'request_id' OR n.meta ? 'appointment_id')
        THEN 'Notification clinique'
      WHEN n.meta ? 'patient_id'
           AND NOT public.can_access_patient((n.meta->>'patient_id')::uuid, uid)
        THEN 'Notification (accès restreint)'
      WHEN n.meta ? 'appointment_id'
           AND NOT public.can_access_appointment((n.meta->>'appointment_id')::uuid, uid)
        THEN 'Notification (accès restreint)'
      ELSE n.title
    END AS title,
    CASE
      WHEN is_mkt AND (n.meta ? 'patient_id' OR n.meta ? 'request_id' OR n.meta ? 'appointment_id')
        THEN NULL
      WHEN n.meta ? 'patient_id'
           AND NOT public.can_access_patient((n.meta->>'patient_id')::uuid, uid)
        THEN NULL
      WHEN n.meta ? 'appointment_id'
           AND NOT public.can_access_appointment((n.meta->>'appointment_id')::uuid, uid)
        THEN NULL
      ELSE n.body
    END AS body,
    n.priority,
    -- Hide link if recipient cannot access the linked entity
    CASE
      WHEN is_mkt AND (n.meta ? 'patient_id' OR n.meta ? 'appointment_id')
        THEN NULL
      WHEN n.meta ? 'patient_id'
           AND NOT public.can_access_patient((n.meta->>'patient_id')::uuid, uid)
        THEN NULL
      WHEN n.meta ? 'appointment_id'
           AND NOT public.can_access_appointment((n.meta->>'appointment_id')::uuid, uid)
        THEN NULL
      ELSE n.link
    END AS link,
    n.read_at,
    n.created_at,
    (CASE WHEN n.user_id = uid THEN n.read_at IS NOT NULL
          ELSE EXISTS (SELECT 1 FROM public.notification_reads r
                       WHERE r.notification_id = n.id AND r.user_id = uid)
     END) AS read_for_me
  FROM public.notifications n
  WHERE (n.user_id = uid OR (n.user_id IS NULL AND NOT is_mkt))
  ORDER BY n.created_at DESC
  LIMIT LEAST(GREATEST(coalesce(p_limit,100),1), 200);
END;
$$;

REVOKE ALL ON FUNCTION public.list_my_notifications(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_my_notifications(integer) TO authenticated;
