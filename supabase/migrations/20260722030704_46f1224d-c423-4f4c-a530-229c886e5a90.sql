
-- Role enum & user_roles table (standard pattern)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Appointment requests table
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  treatment TEXT,
  name TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  phone_raw TEXT NOT NULL,
  preferred_date DATE,
  preferred_time TEXT,
  message TEXT,
  contact_method TEXT NOT NULL DEFAULT 'whatsapp',
  source_page TEXT,
  utm JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  follow_up_status TEXT,
  idempotency_key TEXT UNIQUE
);

GRANT INSERT ON public.appointment_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.appointment_requests TO authenticated;
GRANT ALL ON public.appointment_requests TO service_role;

ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a new request (INSERT-only). Values are validated server-side.
DO $$ BEGIN
  CREATE POLICY "Anyone can submit an appointment request"
    ON public.appointment_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admins can read requests.
DO $$ BEGIN
  CREATE POLICY "Admins can view all appointment requests"
    ON public.appointment_requests
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Only admins can update requests (change status, follow-up).
DO $$ BEGIN
  CREATE POLICY "Admins can update appointment requests"
    ON public.appointment_requests
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_appointment_requests_created_at
  ON public.appointment_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointment_requests_status
  ON public.appointment_requests (status);
