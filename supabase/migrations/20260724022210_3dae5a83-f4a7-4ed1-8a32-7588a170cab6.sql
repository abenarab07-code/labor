
-- 1) Compact financial summary per patient (aggregate)
CREATE OR REPLACE FUNCTION public.patient_financial_summary(_patient_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'accepted_value', COALESCE((
      SELECT SUM(final_amount) FROM public.quotes
      WHERE patient_id = _patient_id AND status = 'accepted'
    ), 0),
    'quoted_total', COALESCE((
      SELECT SUM(final_amount) FROM public.quotes WHERE patient_id = _patient_id
    ), 0),
    'collected', COALESCE((
      SELECT SUM(amount) FROM public.payments
      WHERE patient_id = _patient_id AND correction_of IS NULL
    ), 0),
    'outstanding', GREATEST(0, COALESCE((
      SELECT SUM(q.final_amount - COALESCE((
        SELECT SUM(p.amount) FROM public.payments p
        WHERE p.quote_id = q.id AND p.correction_of IS NULL
      ), 0))
      FROM public.quotes q
      WHERE q.patient_id = _patient_id AND q.status = 'accepted'
    ), 0)),
    'active_quotes_count', COALESCE((
      SELECT COUNT(*) FROM public.quotes
      WHERE patient_id = _patient_id
        AND status IN ('draft','sent','viewed','negotiating')
    ), 0)
  );
$$;

-- 2) Idempotent quote follow-ups generator
--    Dedupe key format: 'quote:{quote_id}:{kind}'  (unique partial index already exists)
CREATE OR REPLACE FUNCTION public.generate_quote_followups()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  reminder_days int := 3;   -- quote sent without response
  expiry_days int := 5;     -- expiry warning
  plan_days int := 5;       -- accepted without appointment
  balance_days int := 7;    -- outstanding balance
  n int := 0;
  r record;
BEGIN
  IF NOT (public.is_admin(actor) OR public.is_reception(actor)) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  -- 2a) Quote sent, no response for N days
  FOR r IN
    SELECT q.id, q.patient_id, q.quote_number, q.assigned_to
    FROM public.quotes q
    WHERE q.status IN ('sent','viewed')
      AND q.sent_at IS NOT NULL
      AND q.sent_at < now() - (reminder_days || ' days')::interval
  LOOP
    INSERT INTO public.follow_up_tasks (
      title, description, type, priority, status, due_at,
      patient_id, assigned_to,
      linked_entity_type, linked_entity_id, dedupe_key, created_by
    ) VALUES (
      'Relancer devis ' || r.quote_number,
      'Devis envoyé sans réponse depuis ' || reminder_days || ' jours.',
      'quote_reminder', 'important', 'open', now() + interval '2 hours',
      r.patient_id, r.assigned_to,
      'quote', r.id, 'quote:' || r.id::text || ':reminder', actor
    )
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;

  -- 2b) Quote near expiry
  FOR r IN
    SELECT q.id, q.patient_id, q.quote_number, q.assigned_to, q.expires_at
    FROM public.quotes q
    WHERE q.status IN ('draft','sent','viewed','negotiating')
      AND q.expires_at IS NOT NULL
      AND q.expires_at <= (CURRENT_DATE + expiry_days)
      AND q.expires_at >= CURRENT_DATE
  LOOP
    INSERT INTO public.follow_up_tasks (
      title, description, type, priority, status, due_at,
      patient_id, assigned_to,
      linked_entity_type, linked_entity_id, dedupe_key, created_by
    ) VALUES (
      'Devis ' || r.quote_number || ' bientôt expiré',
      'Expire le ' || to_char(r.expires_at, 'DD/MM/YYYY') || '.',
      'quote_reminder', 'urgent', 'open', r.expires_at::timestamptz - interval '1 day',
      r.patient_id, r.assigned_to,
      'quote', r.id, 'quote:' || r.id::text || ':expiry', actor
    )
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;

  -- 2c) Accepted quote without a planned appointment
  FOR r IN
    SELECT q.id, q.patient_id, q.quote_number, q.assigned_to
    FROM public.quotes q
    WHERE q.status = 'accepted'
      AND q.accepted_at < now() - (plan_days || ' days')::interval
      AND NOT EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.patient_id = q.patient_id
          AND a.starts_at >= q.accepted_at
      )
  LOOP
    INSERT INTO public.follow_up_tasks (
      title, description, type, priority, status, due_at,
      patient_id, assigned_to,
      linked_entity_type, linked_entity_id, dedupe_key, created_by
    ) VALUES (
      'Planifier RDV — devis ' || r.quote_number,
      'Devis accepté sans rendez-vous planifié.',
      'quote_reminder', 'important', 'open', now() + interval '2 hours',
      r.patient_id, r.assigned_to,
      'quote', r.id, 'quote:' || r.id::text || ':plan', actor
    )
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;

  -- 2d) Remaining balance after configured delay
  FOR r IN
    SELECT q.id, q.patient_id, q.quote_number, q.assigned_to,
           q.final_amount - COALESCE((
             SELECT SUM(p.amount) FROM public.payments p
             WHERE p.quote_id = q.id AND p.correction_of IS NULL
           ), 0) AS remaining
    FROM public.quotes q
    WHERE q.status = 'accepted'
      AND q.accepted_at < now() - (balance_days || ' days')::interval
  LOOP
    CONTINUE WHEN r.remaining <= 0;
    INSERT INTO public.follow_up_tasks (
      title, description, type, priority, status, due_at,
      patient_id, assigned_to,
      linked_entity_type, linked_entity_id, dedupe_key, created_by
    ) VALUES (
      'Solde restant — devis ' || r.quote_number,
      'Solde à recouvrer : ' || r.remaining || ' DA.',
      'payment', 'important', 'open', now() + interval '1 day',
      r.patient_id, r.assigned_to,
      'quote', r.id, 'quote:' || r.id::text || ':balance', actor
    )
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;

  -- 2e) Refused quote — review reason
  FOR r IN
    SELECT q.id, q.patient_id, q.quote_number, q.assigned_to, q.refused_at
    FROM public.quotes q
    WHERE q.status = 'refused'
      AND q.refused_at > now() - interval '30 days'
      AND (q.refusal_reason IS NULL OR btrim(q.refusal_reason) = '')
  LOOP
    INSERT INTO public.follow_up_tasks (
      title, description, type, priority, status, due_at,
      patient_id, assigned_to,
      linked_entity_type, linked_entity_id, dedupe_key, created_by
    ) VALUES (
      'Analyser refus — devis ' || r.quote_number,
      'Devis refusé sans raison enregistrée.',
      'quote_reminder', 'normal', 'open', now() + interval '1 day',
      r.patient_id, r.assigned_to,
      'quote', r.id, 'quote:' || r.id::text || ':refusal_review', actor
    )
    ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING;
    IF FOUND THEN n := n + 1; END IF;
  END LOOP;

  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.patient_financial_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_quote_followups() TO authenticated;
