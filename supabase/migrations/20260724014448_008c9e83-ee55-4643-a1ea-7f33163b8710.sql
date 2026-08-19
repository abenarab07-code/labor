
-- 1) Normalization helper
CREATE OR REPLACE FUNCTION public.normalize_phone(_raw text)
RETURNS text
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE d text; BEGIN
  IF _raw IS NULL THEN RETURN NULL; END IF;
  d := regexp_replace(_raw, '[^0-9]', '', 'g');
  IF d = '' THEN RETURN NULL; END IF;
  -- 00213xxxxxxxxx -> 213xxxxxxxxx
  IF d LIKE '00213%' THEN d := substr(d, 3); END IF;
  -- 0xxxxxxxxx (Algerian local, 10 digits) -> 213xxxxxxxxx
  IF length(d) = 10 AND left(d,1) = '0' THEN d := '213' || substr(d, 2); END IF;
  -- xxxxxxxxx (Algerian mobile w/o zero, 9 digits starting 5/6/7) -> 213xxxxxxxxx
  IF length(d) = 9 AND left(d,1) IN ('5','6','7') THEN d := '213' || d; END IF;
  RETURN d;
END; $$;

-- 2) Add columns
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone_normalized text;
ALTER TABLE public.appointment_requests ADD COLUMN IF NOT EXISTS phone_normalized text;

-- 3) Trigger to keep normalized value in sync
CREATE OR REPLACE FUNCTION public.tg_set_phone_normalized()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.phone_normalized := public.normalize_phone(COALESCE(NEW.phone_e164, NEW.phone_raw));
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tg_patients_phone_normalized ON public.patients;
CREATE TRIGGER tg_patients_phone_normalized
  BEFORE INSERT OR UPDATE OF phone_e164, phone_raw ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_phone_normalized();

DROP TRIGGER IF EXISTS tg_requests_phone_normalized ON public.appointment_requests;
CREATE TRIGGER tg_requests_phone_normalized
  BEFORE INSERT OR UPDATE OF phone_e164, phone_raw ON public.appointment_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_phone_normalized();

-- 4) Backfill
UPDATE public.patients SET phone_normalized = public.normalize_phone(COALESCE(phone_e164, phone_raw))
  WHERE phone_normalized IS NULL;
UPDATE public.appointment_requests SET phone_normalized = public.normalize_phone(COALESCE(phone_e164, phone_raw))
  WHERE phone_normalized IS NULL;

-- 5) Indexes
CREATE INDEX IF NOT EXISTS idx_patients_phone_normalized ON public.patients (phone_normalized);
CREATE INDEX IF NOT EXISTS idx_requests_phone_normalized ON public.appointment_requests (phone_normalized);

-- Duplicate protection (only for non-archived patients)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_patients_phone_normalized_active
  ON public.patients (phone_normalized)
  WHERE archived = false AND phone_normalized IS NOT NULL;

-- 6) Update lead conversion suggestion function
CREATE OR REPLACE FUNCTION public.suggest_patients_for_request(_request_id uuid)
RETURNS TABLE(id uuid, full_name text, phone_e164 text, created_at timestamp with time zone)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.phone_e164, p.created_at
  FROM public.patients p
  JOIN public.appointment_requests r ON r.id = _request_id
  WHERE (p.phone_normalized IS NOT NULL AND p.phone_normalized = r.phone_normalized)
     OR (r.name IS NOT NULL AND p.full_name ILIKE '%' || r.name || '%')
  ORDER BY (p.phone_normalized = r.phone_normalized) DESC, p.created_at DESC
  LIMIT 5;
$$;

-- 7) Update global search RPC to use normalized digits
CREATE OR REPLACE FUNCTION public.admin_global_search(p_query text, p_limit integer DEFAULT 20)
RETURNS TABLE(result_type text, id uuid, title text, subtitle text, route text, status text, occurred_at timestamp with time zone)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q text := lower(btrim(coalesce(p_query,'')));
  qlike text;
  qnorm text;
  uid uuid := auth.uid();
  is_mkt boolean := public.is_marketing(uid);
  can_all boolean := public.is_admin(uid) OR public.is_reception(uid);
  lmt integer := least(greatest(coalesce(p_limit, 20), 1), 50);
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF is_mkt AND NOT can_all THEN RETURN; END IF;
  IF length(q) < 2 THEN RETURN; END IF;
  qlike := '%' || q || '%';
  qnorm := public.normalize_phone(p_query);

  RETURN QUERY
  SELECT 'patient'::text, p.id, p.full_name,
         COALESCE(p.phone_e164, '') AS subtitle,
         ('/admin/patients/' || p.id::text) AS route,
         p.lifecycle_status AS status,
         COALESCE(p.updated_at, p.created_at) AS occurred_at
  FROM public.patients p
  WHERE (
      lower(p.full_name) LIKE qlike
      OR (qnorm IS NOT NULL AND p.phone_normalized = qnorm)
      OR (qnorm IS NOT NULL AND p.phone_normalized LIKE '%' || qnorm || '%')
    )
    AND (can_all OR public.can_access_patient(p.id, uid))
  ORDER BY COALESCE(p.updated_at, p.created_at) DESC
  LIMIT lmt;

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
        OR (qnorm IS NOT NULL AND r.phone_normalized = qnorm)
        OR (qnorm IS NOT NULL AND r.phone_normalized LIKE '%' || qnorm || '%')
        OR lower(coalesce(r.treatment,'')) LIKE qlike
      )
    ORDER BY r.created_at DESC
    LIMIT lmt;
  END IF;

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
