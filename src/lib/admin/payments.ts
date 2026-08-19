import { supabase } from "@/integrations/supabase/client";

export const PAYMENT_METHODS = [
  { key: "cash", label: "Espèces" },
  { key: "carte", label: "Carte" },
  { key: "virement", label: "Virement bancaire" },
  { key: "cheque", label: "Chèque" },
  { key: "autre", label: "Autre" },
] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> =
  Object.fromEntries(PAYMENT_METHODS.map((m) => [m.key, m.label]));

export async function recordPayment(input: {
  patient_id: string;
  amount: number;
  method: string;
  quote_id?: string | null;
  patient_treatment_id?: string | null;
  payment_reference?: string | null;
  note?: string | null;
  paid_at?: string | null;
  allow_overpayment?: boolean;
}) {
  const { data, error } = await (supabase.rpc as any)("record_payment", {
    _patient_id: input.patient_id,
    _amount: input.amount,
    _method: input.method,
    _quote_id: input.quote_id ?? null,
    _patient_treatment_id: input.patient_treatment_id ?? null,
    _payment_reference: input.payment_reference ?? null,
    _note: input.note ?? null,
    _paid_at: input.paid_at ?? new Date().toISOString(),
    _allow_overpayment: input.allow_overpayment ?? false,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchRevenueKpis(from?: Date | null, to?: Date | null) {
  const { data, error } = await (supabase.rpc as any)("revenue_kpis", {
    _from: from ? from.toISOString() : null,
    _to: to ? to.toISOString() : null,
  });
  if (error) throw error;
  return data as {
    collected_period: number;
    collected_today: number;
    accepted_value: number;
    outstanding: number;
    by_method: { method: string; total: number }[];
    acceptance_rate: number;
    sent_count: number;
    accepted_count: number;
  };
}
