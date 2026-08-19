
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmation_status text NOT NULL DEFAULT 'unconfirmed',
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_by text,
  ADD COLUMN IF NOT EXISTS previous_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS previous_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_show_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_to uuid;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_confirmation_status_check,
  ADD CONSTRAINT appointments_confirmation_status_check
    CHECK (confirmation_status IN ('unconfirmed','sent','confirmed','declined'));

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_cancelled_by_check,
  ADD CONSTRAINT appointments_cancelled_by_check
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('patient','clinic','other'));

CREATE INDEX IF NOT EXISTS appointments_practitioner_idx ON public.appointments(practitioner_id);
CREATE INDEX IF NOT EXISTS appointments_assigned_idx ON public.appointments(assigned_to);
CREATE INDEX IF NOT EXISTS appointments_confirmation_idx ON public.appointments(confirmation_status);

CREATE TABLE IF NOT EXISTS public.appointment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  payload jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.appointment_events TO authenticated;
GRANT ALL ON public.appointment_events TO service_role;

ALTER TABLE public.appointment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read appointment_events" ON public.appointment_events;
CREATE POLICY "staff read appointment_events" ON public.appointment_events
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff insert appointment_events" ON public.appointment_events;
CREATE POLICY "staff insert appointment_events" ON public.appointment_events
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS appointment_events_appt_idx
  ON public.appointment_events(appointment_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_appointment_status_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_events(appointment_id, event_type, to_status, actor_id, payload)
    VALUES (NEW.id, 'created', NEW.status, auth.uid(),
            jsonb_build_object('starts_at', NEW.starts_at, 'ends_at', NEW.ends_at));
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.appointment_events(appointment_id, event_type, from_status, to_status, actor_id)
    VALUES (NEW.id, 'status_change', OLD.status, NEW.status, auth.uid());
  END IF;
  IF NEW.starts_at IS DISTINCT FROM OLD.starts_at OR NEW.ends_at IS DISTINCT FROM OLD.ends_at THEN
    INSERT INTO public.appointment_events(appointment_id, event_type, actor_id, payload)
    VALUES (NEW.id, 'rescheduled', auth.uid(),
            jsonb_build_object(
              'from_starts_at', OLD.starts_at, 'from_ends_at', OLD.ends_at,
              'to_starts_at', NEW.starts_at, 'to_ends_at', NEW.ends_at));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_history ON public.appointments;
CREATE TRIGGER appointments_history
  AFTER INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.tg_appointment_status_history();

ALTER TABLE public.follow_up_tasks
  ADD COLUMN IF NOT EXISTS linked_entity_type text,
  ADD COLUMN IF NOT EXISTS linked_entity_id uuid,
  ADD COLUMN IF NOT EXISTS completion_note text,
  ADD COLUMN IF NOT EXISTS completed_by uuid,
  ADD COLUMN IF NOT EXISTS dedupe_key text;

ALTER TABLE public.follow_up_tasks
  DROP CONSTRAINT IF EXISTS follow_up_tasks_linked_entity_type_check,
  ADD CONSTRAINT follow_up_tasks_linked_entity_type_check
    CHECK (linked_entity_type IS NULL OR
           linked_entity_type IN ('request','patient','appointment','treatment','quote'));

CREATE UNIQUE INDEX IF NOT EXISTS follow_up_tasks_dedupe_key_uidx
  ON public.follow_up_tasks(dedupe_key) WHERE dedupe_key IS NOT NULL;

INSERT INTO public.clinic_settings(key, value) VALUES
  ('timezone', to_jsonb('Africa/Algiers'::text)),
  ('open_hours', '{"1":{"open":"08:30","close":"18:00"},"2":{"open":"08:30","close":"18:00"},"3":{"open":"08:30","close":"18:00"},"4":{"open":"08:30","close":"18:00"},"5":null,"6":{"open":"09:00","close":"15:00"},"0":null}'::jsonb),
  ('hot_lead_contact_delay_minutes', to_jsonb(120))
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS appointment_requests_status_idx ON public.appointment_requests(status);
CREATE INDEX IF NOT EXISTS appointment_requests_assigned_idx ON public.appointment_requests(assigned_to);
CREATE INDEX IF NOT EXISTS patients_full_name_trgm_idx ON public.patients USING gin (full_name gin_trgm_ops);
