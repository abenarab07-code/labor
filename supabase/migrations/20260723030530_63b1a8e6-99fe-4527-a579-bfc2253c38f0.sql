
-- Roles: add new values only (used in next migration/text comparisons)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reception';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'practitioner';

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Cast to text to avoid unsafe-enum-use in same migration
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin','reception','practitioner','moderator')
  );
$$;

CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL,
  full_name text NOT NULL,
  job_title text,
  phone text,
  email text,
  color text DEFAULT '#00A99D',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_profiles TO authenticated;
GRANT ALL ON public.staff_profiles TO service_role;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff view staff_profiles" ON public.staff_profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin manage staff_profiles" ON public.staff_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER staff_profiles_updated BEFORE UPDATE ON public.staff_profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone_e164 text NOT NULL,
  phone_raw text,
  whatsapp_available boolean DEFAULT true,
  email text,
  date_of_birth date,
  gender text,
  preferred_contact text DEFAULT 'whatsapp',
  source text,
  campaign text,
  treatment_interest text,
  lifecycle_status text NOT NULL DEFAULT 'lead',
  temperature text DEFAULT 'tiede',
  assigned_to uuid,
  tags text[] DEFAULT '{}',
  estimated_value numeric(12,2) DEFAULT 0,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  next_appointment_at timestamptz,
  appointment_count int NOT NULL DEFAULT 0,
  no_show_count int NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  notes_summary text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patients_phone_idx ON public.patients(phone_e164);
CREATE INDEX IF NOT EXISTS patients_status_idx ON public.patients(lifecycle_status);
CREATE INDEX IF NOT EXISTS patients_assigned_idx ON public.patients(assigned_to);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff view patients" ON public.patients FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update patients" ON public.patients FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "admin delete patients" ON public.patients FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.appointment_requests
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS converted_patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS temperature text DEFAULT 'tiede',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS appt_req_status_idx ON public.appointment_requests(status);
CREATE INDEX IF NOT EXISTS appt_req_created_idx ON public.appointment_requests(created_at DESC);
DROP TRIGGER IF EXISTS appt_req_updated ON public.appointment_requests;
CREATE TRIGGER appt_req_updated BEFORE UPDATE ON public.appointment_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.appointment_requests(id) ON DELETE SET NULL,
  practitioner_id uuid,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'a_confirmer',
  treatment text,
  room text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_start_idx ON public.appointments(starts_at);
CREATE INDEX IF NOT EXISTS appointments_patient_idx ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage appointments" ON public.appointments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.patient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  author_id uuid,
  body text NOT NULL,
  category text DEFAULT 'general',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_notes TO authenticated;
GRANT ALL ON public.patient_notes TO service_role;
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage patient_notes" ON public.patient_notes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER patient_notes_updated BEFORE UPDATE ON public.patient_notes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.patient_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.appointment_requests(id) ON DELETE SET NULL,
  actor_id uuid,
  type text NOT NULL,
  summary text NOT NULL,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patient_activities_patient_idx ON public.patient_activities(patient_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_activities TO authenticated;
GRANT ALL ON public.patient_activities TO service_role;
ALTER TABLE public.patient_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff view activities" ON public.patient_activities FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert activities" ON public.patient_activities FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.appointment_requests(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  assigned_to uuid,
  type text NOT NULL DEFAULT 'call',
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'normal',
  due_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'open',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS follow_up_due_idx ON public.follow_up_tasks(due_at);
CREATE INDEX IF NOT EXISTS follow_up_assigned_idx ON public.follow_up_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS follow_up_status_idx ON public.follow_up_tasks(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_tasks TO authenticated;
GRANT ALL ON public.follow_up_tasks TO service_role;
ALTER TABLE public.follow_up_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage follow_up_tasks" ON public.follow_up_tasks FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER follow_up_updated BEFORE UPDATE ON public.follow_up_tasks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  default_duration_min int DEFAULT 60,
  price_min numeric(12,2),
  price_max numeric(12,2),
  color text DEFAULT '#00A99D',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatments TO authenticated;
GRANT ALL ON public.treatments TO service_role;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff view treatments" ON public.treatments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin manage treatments" ON public.treatments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER treatments_updated BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.patient_treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_id uuid REFERENCES public.treatments(id) ON DELETE SET NULL,
  practitioner_id uuid,
  stage text NOT NULL DEFAULT 'interet',
  expected_value numeric(12,2),
  agreed_value numeric(12,2),
  start_date date,
  expected_end_date date,
  progress int DEFAULT 0,
  next_step text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_treatments TO authenticated;
GRANT ALL ON public.patient_treatments TO service_role;
ALTER TABLE public.patient_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage patient_treatments" ON public.patient_treatments FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER patient_treatments_updated BEFORE UPDATE ON public.patient_treatments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_treatment_id uuid REFERENCES public.patient_treatments(id) ON DELETE SET NULL,
  reference text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  final_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'brouillon',
  sent_at timestamptz,
  accepted_at timestamptz,
  expires_at date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage quotes" ON public.quotes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER quotes_updated BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  label text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage quote_items" ON public.quote_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_treatment_id uuid REFERENCES public.patient_treatments(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  method text NOT NULL DEFAULT 'cash',
  paid_at timestamptz NOT NULL DEFAULT now(),
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage payments" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.website_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  page text,
  meta jsonb,
  session_id text,
  utm jsonb,
  device text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS website_events_type_idx ON public.website_events(event_type, created_at DESC);
GRANT SELECT ON public.website_events TO authenticated;
GRANT INSERT ON public.website_events TO anon, authenticated;
GRANT ALL ON public.website_events TO service_role;
ALTER TABLE public.website_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone insert website_events" ON public.website_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "staff read website_events" ON public.website_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  priority text DEFAULT 'normal',
  link text,
  read_at timestamptz,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff view notifications" ON public.notifications FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "staff update notifications" ON public.notifications FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  summary text,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin view audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clinic_settings TO authenticated;
GRANT ALL ON public.clinic_settings TO service_role;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff view clinic_settings" ON public.clinic_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin manage clinic_settings" ON public.clinic_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.saved_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope text NOT NULL,
  name text NOT NULL,
  config jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_filters TO authenticated;
GRANT ALL ON public.saved_filters TO service_role;
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own saved_filters" ON public.saved_filters FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin manage user_roles" ON public.user_roles;
CREATE POLICY "admin manage user_roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Realtime
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointment_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.patients; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_up_tasks; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_activities; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Trigger: new appointment_request → notification
CREATE OR REPLACE FUNCTION public.on_new_appointment_request() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (type, title, body, priority, link, meta)
  VALUES ('new_request','Nouvelle demande de RDV', NEW.name || ' — ' || COALESCE(NEW.treatment,'demande'), 'high', '/admin/demandes/' || NEW.id::text, jsonb_build_object('request_id', NEW.id));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_new_appointment_request ON public.appointment_requests;
CREATE TRIGGER trg_new_appointment_request AFTER INSERT ON public.appointment_requests FOR EACH ROW EXECUTE FUNCTION public.on_new_appointment_request();

-- Seed first admin
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'admin@beausourire.dz' LIMIT 1;
  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'admin@beausourire.dz', crypt('BeauSourire2026!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Administrateur"}'::jsonb, false,
      '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid, jsonb_build_object('sub', v_uid::text, 'email','admin@beausourire.dz'), 'email', v_uid::text, now(), now(), now());
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  SELECT v_uid, 'admin'::public.app_role
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_uid AND role = 'admin'::public.app_role);

  INSERT INTO public.staff_profiles (user_id, full_name, job_title, email, is_active)
  VALUES (v_uid, 'Administrateur', 'Admin', 'admin@beausourire.dz', true)
  ON CONFLICT (user_id) DO NOTHING;
END $$;

INSERT INTO public.treatments (name, category, default_duration_min, price_min, price_max, color)
SELECT * FROM (VALUES
  ('Consultation'::text, 'diagnostic'::text, 30, 2000::numeric, 3000::numeric, '#00A99D'::text),
  ('Détartrage', 'hygiene', 45, 3000, 5000, '#DDF7F2'),
  ('Facettes E.max', 'esthetique', 90, 40000, 60000, '#C9AD72'),
  ('Aligneurs invisibles', 'orthodontie', 60, 150000, 300000, '#063E45'),
  ('Implant dentaire', 'chirurgie', 90, 80000, 140000, '#142126'),
  ('Blanchiment', 'esthetique', 60, 15000, 25000, '#C9AD72')
) AS t(name, category, default_duration_min, price_min, price_max, color)
WHERE NOT EXISTS (SELECT 1 FROM public.treatments WHERE name = t.name);
