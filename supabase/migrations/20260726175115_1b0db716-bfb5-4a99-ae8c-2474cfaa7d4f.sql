
-- 1. Admin DELETE policy for appointment_requests (PII purge)
CREATE POLICY "Admins can delete appointment requests"
ON public.appointment_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Revoke EXECUTE from anon on SECURITY DEFINER public functions.
--    These are called by signed-in staff (via RPC) or from RLS policy
--    expressions (which run with the invoker's role); anonymous callers
--    have no legitimate reason to invoke them directly.
REVOKE EXECUTE ON FUNCTION public.accept_quote(uuid, timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.refuse_quote(uuid, text, timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_payment(uuid, numeric, text, uuid, uuid, text, text, timestamptz, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_quote_followups() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_global_search(text, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.convert_request_to_patient(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.patient_financial_summary(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.revenue_kpis(timestamptz, timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_my_notifications(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.suggest_patients_for_request(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.quote_balance(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_access_appointment(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_access_patient(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_access_treatment(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_reception(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_practitioner(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_marketing(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.generate_quote_number() FROM anon, public;
