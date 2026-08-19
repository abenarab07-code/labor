
-- ========== 1. Quote number sequence & generator ==========
CREATE SEQUENCE IF NOT EXISTS public.quote_number_seq START 1;
GRANT USAGE ON SEQUENCE public.quote_number_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n bigint;
BEGIN
  n := nextval('public.quote_number_seq');
  RETURN 'DEV-' || to_char(now() AT TIME ZONE 'Africa/Algiers', 'YYYY') || '-' || lpad(n::text, 4, '0');
END; $$;

-- ========== 2. Extend quotes ==========
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS patient_note text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refused_at timestamptz,
  ADD COLUMN IF NOT EXISTS refusal_reason text,
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'DZD';

-- migrate default status wording to English enum values (table is empty, safe)
ALTER TABLE public.quotes ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_status_chk;
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_chk CHECK (status IN ('draft','sent','viewed','negotiating','accepted','refused','expired'));

-- auto-fill quote_number on insert when null
CREATE OR REPLACE FUNCTION public.tg_set_quote_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := public.generate_quote_number();
  END IF;
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := NEW.quote_number;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS quotes_set_number ON public.quotes;
CREATE TRIGGER quotes_set_number BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_quote_number();

CREATE INDEX IF NOT EXISTS quotes_patient_idx ON public.quotes(patient_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON public.quotes(status);
CREATE INDEX IF NOT EXISTS quotes_assigned_idx ON public.quotes(assigned_to);
CREATE INDEX IF NOT EXISTS quotes_created_idx ON public.quotes(created_at DESC);

-- ========== 3. Extend quote_items ==========
ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS treatment_id uuid REFERENCES public.treatments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS quote_items_updated ON public.quote_items;
CREATE TRIGGER quote_items_updated BEFORE UPDATE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS quote_items_quote_idx ON public.quote_items(quote_id, sort_order);

-- ========== 4. Extend payments ==========
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'DZD',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS correction_of uuid REFERENCES public.payments(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_amount_chk;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_amount_chk CHECK (amount <> 0);

CREATE INDEX IF NOT EXISTS payments_patient_idx ON public.payments(patient_id);
CREATE INDEX IF NOT EXISTS payments_quote_idx ON public.payments(quote_id);
CREATE INDEX IF NOT EXISTS payments_treatment_idx ON public.payments(patient_treatment_id);
CREATE INDEX IF NOT EXISTS payments_paid_at_idx ON public.payments(paid_at DESC);

-- ========== 5. RLS: allow practitioners to read their quotes/items ==========
DROP POLICY IF EXISTS "quotes manage" ON public.quotes;
CREATE POLICY "quotes read" ON public.quotes FOR SELECT TO authenticated USING (
  public.is_admin() OR public.is_reception()
  OR (public.is_practitioner() AND (
    assigned_to = auth.uid()
    OR (patient_treatment_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.patient_treatments pt WHERE pt.id = patient_treatment_id AND pt.practitioner_id = auth.uid()
    ))
  ))
);
CREATE POLICY "quotes write" ON public.quotes FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_reception())
  WITH CHECK (public.is_admin() OR public.is_reception());

DROP POLICY IF EXISTS "quote_items manage" ON public.quote_items;
CREATE POLICY "quote_items read" ON public.quote_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND (
    public.is_admin() OR public.is_reception()
    OR (public.is_practitioner() AND (
      q.assigned_to = auth.uid()
      OR (q.patient_treatment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.patient_treatments pt WHERE pt.id = q.patient_treatment_id AND pt.practitioner_id = auth.uid()
      ))
    ))
  ))
);
CREATE POLICY "quote_items write" ON public.quote_items FOR ALL TO authenticated
  USING (public.is_admin() OR public.is_reception())
  WITH CHECK (public.is_admin() OR public.is_reception());

-- ========== 6. Atomic quote acceptance ==========
CREATE OR REPLACE FUNCTION public.accept_quote(_quote_id uuid, _expected_updated_at timestamptz DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.quotes%ROWTYPE;
  target_pt uuid;
  actor uuid := auth.uid();
BEGIN
  IF NOT (public.is_admin(actor) OR public.is_reception(actor)) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO q FROM public.quotes WHERE id = _quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Devis introuvable'; END IF;

  IF _expected_updated_at IS NOT NULL AND q.updated_at <> _expected_updated_at THEN
    RAISE EXCEPTION 'Cette fiche a été modifiée par un autre membre de l''équipe. Actualisez les données avant de réessayer.';
  END IF;

  IF q.status = 'accepted' THEN
    RETURN q.patient_treatment_id;
  END IF;

  IF q.status IN ('refused','expired') THEN
    RAISE EXCEPTION 'Impossible d''accepter un devis % (statut actuel: %)', q.quote_number, q.status;
  END IF;

  -- link or create a patient_treatment
  target_pt := q.patient_treatment_id;
  IF target_pt IS NULL THEN
    INSERT INTO public.patient_treatments (patient_id, practitioner_id, stage, status, agreed_value)
    VALUES (q.patient_id, q.assigned_to, 'accepte', 'accepted', q.final_amount)
    RETURNING id INTO target_pt;
  ELSE
    UPDATE public.patient_treatments
       SET status = 'accepted',
           stage = 'accepte',
           agreed_value = COALESCE(agreed_value, q.final_amount),
           updated_at = now()
     WHERE id = target_pt;
  END IF;

  UPDATE public.quotes
     SET status = 'accepted',
         accepted_at = now(),
         patient_treatment_id = target_pt,
         updated_at = now()
   WHERE id = _quote_id;

  INSERT INTO public.patient_activities (patient_id, type, summary, actor_id)
  VALUES (q.patient_id, 'quote_accepted', format('Devis %s accepté', q.quote_number), actor);

  INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, after, actor_id)
  VALUES ('accept','quote', _quote_id, format('Devis %s accepté', q.quote_number),
          jsonb_build_object('patient_treatment_id', target_pt, 'total', q.final_amount), actor);

  RETURN target_pt;
END; $$;

-- ========== 7. Refuse quote ==========
CREATE OR REPLACE FUNCTION public.refuse_quote(_quote_id uuid, _reason text DEFAULT NULL, _expected_updated_at timestamptz DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q public.quotes%ROWTYPE;
  actor uuid := auth.uid();
BEGIN
  IF NOT (public.is_admin(actor) OR public.is_reception(actor)) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO q FROM public.quotes WHERE id = _quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Devis introuvable'; END IF;
  IF _expected_updated_at IS NOT NULL AND q.updated_at <> _expected_updated_at THEN
    RAISE EXCEPTION 'Cette fiche a été modifiée par un autre membre de l''équipe. Actualisez les données avant de réessayer.';
  END IF;
  IF q.status = 'accepted' THEN
    RAISE EXCEPTION 'Un devis accepté ne peut pas être refusé.';
  END IF;
  UPDATE public.quotes SET status='refused', refused_at=now(), refusal_reason=_reason, updated_at=now() WHERE id = _quote_id;
  INSERT INTO public.audit_logs (action, entity_type, entity_id, summary, after, actor_id)
  VALUES ('refuse','quote',_quote_id, format('Devis %s refusé', q.quote_number), jsonb_build_object('reason', _reason), actor);
END; $$;

-- ========== 8. Payment recording with overpayment guard ==========
CREATE OR REPLACE FUNCTION public.record_payment(
  _patient_id uuid,
  _amount numeric,
  _method text,
  _quote_id uuid DEFAULT NULL,
  _patient_treatment_id uuid DEFAULT NULL,
  _payment_reference text DEFAULT NULL,
  _note text DEFAULT NULL,
  _paid_at timestamptz DEFAULT now(),
  _allow_overpayment boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid := auth.uid();
  q public.quotes%ROWTYPE;
  already_paid numeric;
  remaining numeric;
  new_id uuid;
BEGIN
  IF NOT (public.is_admin(actor) OR public.is_reception(actor)) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Le montant doit être supérieur à zéro.';
  END IF;
  IF _method IS NULL OR _method = '' THEN
    RAISE EXCEPTION 'Méthode de paiement requise.';
  END IF;

  IF _quote_id IS NOT NULL THEN
    SELECT * INTO q FROM public.quotes WHERE id = _quote_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Devis introuvable'; END IF;
    IF q.patient_id <> _patient_id THEN
      RAISE EXCEPTION 'Ce devis n''appartient pas à ce patient.';
    END IF;
    SELECT COALESCE(SUM(amount),0) INTO already_paid FROM public.payments WHERE quote_id = _quote_id AND correction_of IS NULL;
    remaining := q.final_amount - already_paid;
    IF _amount > remaining AND NOT _allow_overpayment THEN
      RAISE EXCEPTION 'Le montant (% DA) dépasse le solde restant (% DA).', _amount, remaining;
    END IF;
  END IF;

  INSERT INTO public.payments (patient_id, quote_id, patient_treatment_id, amount, method, payment_reference, note, paid_at, created_by, received_by)
  VALUES (_patient_id, _quote_id, _patient_treatment_id, _amount, _method, _payment_reference, _note, COALESCE(_paid_at, now()), actor, actor)
  RETURNING id INTO new_id;

  INSERT INTO public.patient_activities (patient_id, type, summary, actor_id)
  VALUES (_patient_id, 'payment', format('Paiement enregistré: %s DA (%s)', _amount, _method), actor);
  RETURN new_id;
END; $$;

-- ========== 9. Quote balance helper (for the UI) ==========
CREATE OR REPLACE FUNCTION public.quote_balance(_quote_id uuid)
RETURNS TABLE(total numeric, paid numeric, remaining numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.final_amount,
         COALESCE((SELECT SUM(amount) FROM public.payments WHERE quote_id = q.id AND correction_of IS NULL),0),
         q.final_amount - COALESCE((SELECT SUM(amount) FROM public.payments WHERE quote_id = q.id AND correction_of IS NULL),0)
  FROM public.quotes q WHERE q.id = _quote_id;
$$;

-- ========== 10. Revenue KPIs aggregate ==========
CREATE OR REPLACE FUNCTION public.revenue_kpis(_from timestamptz DEFAULT NULL, _to timestamptz DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  from_ts timestamptz := COALESCE(_from, date_trunc('month', now() AT TIME ZONE 'Africa/Algiers'));
  to_ts   timestamptz := COALESCE(_to, now());
  today_start timestamptz := date_trunc('day', now() AT TIME ZONE 'Africa/Algiers');
  collected_period numeric := 0;
  collected_today numeric := 0;
  accepted_value numeric := 0;
  outstanding numeric := 0;
  by_method jsonb := '[]'::jsonb;
  acceptance_rate numeric := 0;
  sent_count int := 0;
  accepted_count int := 0;
BEGIN
  IF NOT (public.is_admin(uid) OR public.is_reception(uid)) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(SUM(amount),0) INTO collected_period FROM public.payments
    WHERE paid_at >= from_ts AND paid_at < to_ts AND correction_of IS NULL;
  SELECT COALESCE(SUM(amount),0) INTO collected_today FROM public.payments
    WHERE paid_at >= today_start AND correction_of IS NULL;
  SELECT COALESCE(SUM(final_amount),0) INTO accepted_value FROM public.quotes WHERE status='accepted';
  SELECT COALESCE(SUM(q.final_amount - COALESCE((SELECT SUM(amount) FROM public.payments p WHERE p.quote_id = q.id AND p.correction_of IS NULL),0)),0)
    INTO outstanding FROM public.quotes q WHERE q.status='accepted';

  SELECT jsonb_agg(jsonb_build_object('method', method, 'total', total)) INTO by_method FROM (
    SELECT method, SUM(amount) AS total FROM public.payments
    WHERE paid_at >= from_ts AND paid_at < to_ts AND correction_of IS NULL
    GROUP BY method ORDER BY total DESC
  ) s;

  SELECT COUNT(*) INTO sent_count FROM public.quotes WHERE status IN ('sent','viewed','negotiating','accepted','refused','expired');
  SELECT COUNT(*) INTO accepted_count FROM public.quotes WHERE status='accepted';
  IF sent_count > 0 THEN acceptance_rate := round((accepted_count::numeric / sent_count) * 100, 1); END IF;

  RETURN jsonb_build_object(
    'collected_period', collected_period,
    'collected_today', collected_today,
    'accepted_value', accepted_value,
    'outstanding', outstanding,
    'by_method', COALESCE(by_method,'[]'::jsonb),
    'acceptance_rate', acceptance_rate,
    'sent_count', sent_count,
    'accepted_count', accepted_count
  );
END; $$;

GRANT EXECUTE ON FUNCTION public.generate_quote_number() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_quote(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refuse_quote(uuid, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_payment(uuid, numeric, text, uuid, uuid, text, text, timestamptz, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quote_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revenue_kpis(timestamptz, timestamptz) TO authenticated;
