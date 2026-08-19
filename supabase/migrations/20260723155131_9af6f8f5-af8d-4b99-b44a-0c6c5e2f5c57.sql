-- Allow staff (not just admin) to manage payments; only admin can delete.
DROP POLICY IF EXISTS "admin manage payments" ON public.payments;

CREATE POLICY "staff read payments" ON public.payments
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "staff insert payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "admin delete payments" ON public.payments
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Financial rollup view per patient.
CREATE OR REPLACE VIEW public.patient_financials AS
SELECT
  p.id AS patient_id,
  COALESCE((SELECT SUM(COALESCE(pt.agreed_value, pt.expected_value, 0))
            FROM public.patient_treatments pt
            WHERE pt.patient_id = p.id), 0)::numeric(12,2) AS total_due,
  COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.patient_id = p.id), 0)::numeric(12,2) AS total_paid,
  (COALESCE((SELECT SUM(COALESCE(pt.agreed_value, pt.expected_value, 0))
             FROM public.patient_treatments pt WHERE pt.patient_id = p.id), 0)
   - COALESCE((SELECT SUM(pay.amount) FROM public.payments pay WHERE pay.patient_id = p.id), 0))::numeric(12,2) AS balance
FROM public.patients p;

GRANT SELECT ON public.patient_financials TO authenticated;

-- Financial rollup per patient_treatment line.
CREATE OR REPLACE VIEW public.patient_treatment_financials AS
SELECT
  pt.id AS patient_treatment_id,
  pt.patient_id,
  COALESCE(pt.agreed_value, pt.expected_value, 0)::numeric(12,2) AS due,
  COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.patient_treatment_id = pt.id), 0)::numeric(12,2) AS paid,
  (COALESCE(pt.agreed_value, pt.expected_value, 0)
    - COALESCE((SELECT SUM(p.amount) FROM public.payments p WHERE p.patient_treatment_id = pt.id), 0))::numeric(12,2) AS balance
FROM public.patient_treatments pt;

GRANT SELECT ON public.patient_treatment_financials TO authenticated;
