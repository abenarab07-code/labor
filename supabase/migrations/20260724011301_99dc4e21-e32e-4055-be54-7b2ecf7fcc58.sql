
-- =====================================================================
-- Phase 3.5 — Practitioner-level RLS, admin guards, helper functions
-- =====================================================================

-- 1) patient_staff_assignments -----------------------------------------
CREATE TABLE IF NOT EXISTS public.patient_staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  staff_user_id uuid NOT NULL,
  assignment_type text NOT NULL DEFAULT 'practitioner',
  active boolean NOT NULL DEFAULT true,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS patient_staff_assignments_unique_active
  ON public.patient_staff_assignments (patient_id, staff_user_id, assignment_type)
  WHERE active;

CREATE INDEX IF NOT EXISTS patient_staff_assignments_patient_idx
  ON public.patient_staff_assignments (patient_id);
CREATE INDEX IF NOT EXISTS patient_staff_assignments_staff_idx
  ON public.patient_staff_assignments (staff_user_id) WHERE active;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_staff_assignments TO authenticated;
GRANT ALL ON public.patient_staff_assignments TO service_role;

ALTER TABLE public.patient_staff_assignments ENABLE ROW LEVEL SECURITY;

-- 2) Helper functions --------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_reception(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'reception');
$$;

CREATE OR REPLACE FUNCTION public.is_practitioner(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'practitioner');
$$;

CREATE OR REPLACE FUNCTION public.is_marketing(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'marketing');
$$;

-- Admin+reception have blanket operational access; practitioners only for their linked records.
CREATE OR REPLACE FUNCTION public.can_access_patient(_patient_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_admin(_user_id)
    OR public.is_reception(_user_id)
    OR (public.is_practitioner(_user_id) AND (
      EXISTS (SELECT 1 FROM public.appointments a
              WHERE a.patient_id = _patient_id
                AND (a.practitioner_id = _user_id OR a.assigned_to = _user_id))
      OR EXISTS (SELECT 1 FROM public.patient_treatments t
                 WHERE t.patient_id = _patient_id AND t.practitioner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.follow_up_tasks f
                 WHERE f.patient_id = _patient_id AND f.assigned_to = _user_id)
      OR EXISTS (SELECT 1 FROM public.patient_notes n
                 WHERE n.patient_id = _patient_id AND n.author_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.patient_staff_assignments s
                 WHERE s.patient_id = _patient_id AND s.staff_user_id = _user_id AND s.active)
    ));
$$;

CREATE OR REPLACE FUNCTION public.can_access_appointment(_appt_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_admin(_user_id)
    OR public.is_reception(_user_id)
    OR (public.is_practitioner(_user_id) AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = _appt_id
        AND (a.practitioner_id = _user_id OR a.assigned_to = _user_id)
    ));
$$;

CREATE OR REPLACE FUNCTION public.can_access_treatment(_pt_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_admin(_user_id)
    OR public.is_reception(_user_id)
    OR (public.is_practitioner(_user_id) AND EXISTS (
      SELECT 1 FROM public.patient_treatments t
      WHERE t.id = _pt_id AND t.practitioner_id = _user_id
    ));
$$;

-- 3) Policies for patient_staff_assignments ----------------------------
DROP POLICY IF EXISTS "admin manage patient_staff_assignments" ON public.patient_staff_assignments;
CREATE POLICY "admin manage patient_staff_assignments"
  ON public.patient_staff_assignments FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_reception())
  WITH CHECK (public.is_admin() OR public.is_reception());

DROP POLICY IF EXISTS "staff read own patient_staff_assignments" ON public.patient_staff_assignments;
CREATE POLICY "staff read own patient_staff_assignments"
  ON public.patient_staff_assignments FOR SELECT TO authenticated
  USING (staff_user_id = auth.uid() OR public.is_admin() OR public.is_reception());

-- 4) Appointments -----------------------------------------------------
DROP POLICY IF EXISTS "staff manage appointments" ON public.appointments;

CREATE POLICY "appointments read"
  ON public.appointments FOR SELECT TO authenticated
  USING (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner() AND (practitioner_id = auth.uid() OR assigned_to = auth.uid()))
  );

CREATE POLICY "appointments insert"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_reception());

CREATE POLICY "appointments update"
  ON public.appointments FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner() AND (practitioner_id = auth.uid() OR assigned_to = auth.uid()))
  )
  WITH CHECK (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner()
        AND (practitioner_id = auth.uid() OR assigned_to = auth.uid()))
  );

CREATE POLICY "appointments delete"
  ON public.appointments FOR DELETE TO authenticated
  USING (public.is_admin());

-- 5) Patients ---------------------------------------------------------
DROP POLICY IF EXISTS "staff view patients" ON public.patients;
DROP POLICY IF EXISTS "staff insert patients" ON public.patients;
DROP POLICY IF EXISTS "staff update patients" ON public.patients;
DROP POLICY IF EXISTS "admin delete patients" ON public.patients;

CREATE POLICY "patients read"
  ON public.patients FOR SELECT TO authenticated
  USING (public.can_access_patient(id));

CREATE POLICY "patients insert"
  ON public.patients FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_reception());

CREATE POLICY "patients update"
  ON public.patients FOR UPDATE TO authenticated
  USING (public.can_access_patient(id))
  WITH CHECK (public.can_access_patient(id));

CREATE POLICY "patients delete"
  ON public.patients FOR DELETE TO authenticated
  USING (public.is_admin());

-- 6) Patient notes ----------------------------------------------------
DROP POLICY IF EXISTS "staff manage patient_notes" ON public.patient_notes;

CREATE POLICY "notes read"
  ON public.patient_notes FOR SELECT TO authenticated
  USING (public.can_access_patient(patient_id));

CREATE POLICY "notes insert"
  ON public.patient_notes FOR INSERT TO authenticated
  WITH CHECK (public.can_access_patient(patient_id) AND (author_id IS NULL OR author_id = auth.uid()));

CREATE POLICY "notes update"
  ON public.patient_notes FOR UPDATE TO authenticated
  USING (public.is_admin() OR author_id = auth.uid())
  WITH CHECK (public.is_admin() OR author_id = auth.uid());

CREATE POLICY "notes delete"
  ON public.patient_notes FOR DELETE TO authenticated
  USING (public.is_admin());

-- 7) Patient treatments ----------------------------------------------
DROP POLICY IF EXISTS "staff manage patient_treatments" ON public.patient_treatments;

CREATE POLICY "treatments read"
  ON public.patient_treatments FOR SELECT TO authenticated
  USING (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner() AND practitioner_id = auth.uid())
  );

CREATE POLICY "treatments insert"
  ON public.patient_treatments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_reception());

CREATE POLICY "treatments update"
  ON public.patient_treatments FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner() AND practitioner_id = auth.uid())
  )
  WITH CHECK (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner() AND practitioner_id = auth.uid())
  );

CREATE POLICY "treatments delete"
  ON public.patient_treatments FOR DELETE TO authenticated
  USING (public.is_admin());

-- 8) Patient activities ---------------------------------------------
DROP POLICY IF EXISTS "staff view activities" ON public.patient_activities;
DROP POLICY IF EXISTS "staff insert activities" ON public.patient_activities;

CREATE POLICY "activities read"
  ON public.patient_activities FOR SELECT TO authenticated
  USING (patient_id IS NULL OR public.can_access_patient(patient_id));

CREATE POLICY "activities insert"
  ON public.patient_activities FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner() AND patient_id IS NOT NULL AND public.can_access_patient(patient_id))
  );

-- 9) Follow-up tasks -------------------------------------------------
DROP POLICY IF EXISTS "staff manage follow_up_tasks" ON public.follow_up_tasks;

CREATE POLICY "followups read"
  ON public.follow_up_tasks FOR SELECT TO authenticated
  USING (
    public.is_admin() OR public.is_reception()
    OR assigned_to = auth.uid()
    OR (public.is_practitioner() AND patient_id IS NOT NULL AND public.can_access_patient(patient_id))
  );

CREATE POLICY "followups insert"
  ON public.follow_up_tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner() AND (assigned_to = auth.uid() OR (patient_id IS NOT NULL AND public.can_access_patient(patient_id))))
  );

CREATE POLICY "followups update"
  ON public.follow_up_tasks FOR UPDATE TO authenticated
  USING (
    public.is_admin() OR public.is_reception()
    OR assigned_to = auth.uid()
  )
  WITH CHECK (
    public.is_admin() OR public.is_reception()
    OR assigned_to = auth.uid()
  );

CREATE POLICY "followups delete"
  ON public.follow_up_tasks FOR DELETE TO authenticated
  USING (public.is_admin() OR public.is_reception());

-- 10) Quotes / quote_items / payments  → admin + reception only -----
DROP POLICY IF EXISTS "staff manage quotes" ON public.quotes;
CREATE POLICY "quotes manage"
  ON public.quotes FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_reception())
  WITH CHECK (public.is_admin() OR public.is_reception());

DROP POLICY IF EXISTS "staff manage quote_items" ON public.quote_items;
CREATE POLICY "quote_items manage"
  ON public.quote_items FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_reception())
  WITH CHECK (public.is_admin() OR public.is_reception());

DROP POLICY IF EXISTS "staff insert payments" ON public.payments;
DROP POLICY IF EXISTS "staff read payments" ON public.payments;
DROP POLICY IF EXISTS "staff update payments" ON public.payments;
DROP POLICY IF EXISTS "admin delete payments" ON public.payments;

CREATE POLICY "payments read"
  ON public.payments FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_reception());
CREATE POLICY "payments insert"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.is_reception());
CREATE POLICY "payments update"
  ON public.payments FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.is_reception())
  WITH CHECK (public.is_admin() OR public.is_reception());
CREATE POLICY "payments delete"
  ON public.payments FOR DELETE TO authenticated
  USING (public.is_admin());

-- 11) Notifications -------------------------------------------------
DROP POLICY IF EXISTS "staff view notifications" ON public.notifications;
CREATE POLICY "staff view notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    AND (
      user_id = auth.uid()
      OR (user_id IS NULL AND NOT public.is_marketing())
    )
  );

-- 12) Appointment_events / audit_logs stay staff-scoped but hide
--     from marketing.
DROP POLICY IF EXISTS "staff read appointment_events" ON public.appointment_events;
CREATE POLICY "staff read appointment_events"
  ON public.appointment_events FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) AND NOT public.is_marketing());

-- website_events kept staff-only (already) but exclude marketing.
DROP POLICY IF EXISTS "staff read website_events" ON public.website_events;
CREATE POLICY "staff read website_events"
  ON public.website_events FOR SELECT TO authenticated
  USING ((public.is_admin() OR public.is_reception()));
