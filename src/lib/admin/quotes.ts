import { supabase } from "@/integrations/supabase/client";
import { throwStaleConflict } from "./mutation-utils";

export const QUOTE_STATUSES = [
  "draft", "sent", "viewed", "negotiating", "accepted", "refused", "expired",
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  viewed: "Vu",
  negotiating: "En discussion",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré",
};

export const QUOTE_STATUS_TONE: Record<string, string> = {
  draft: "bg-neutral-200 text-neutral-700 border-neutral-300",
  sent: "bg-blue-100 text-blue-700 border-blue-300",
  viewed: "bg-purple-100 text-purple-700 border-purple-300",
  negotiating: "bg-amber-100 text-amber-700 border-amber-300",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-300",
  refused: "bg-red-100 text-red-700 border-red-300",
  expired: "bg-neutral-300 text-neutral-700 border-neutral-400",
};

export type QuoteItemInput = {
  label: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  treatment_id?: string | null;
  sort_order?: number;
};

export function computeTotals(items: QuoteItemInput[], globalDiscount = 0) {
  const subtotal = items.reduce((s, it) => {
    const line = Math.max(0, (Number(it.quantity) || 0) * (Number(it.unit_price) || 0) - (Number(it.discount_amount) || 0));
    return s + line;
  }, 0);
  const total = Math.max(0, subtotal - (Number(globalDiscount) || 0));
  return { subtotal, total };
}

export async function createQuote(input: {
  patient_id: string;
  patient_treatment_id?: string | null;
  title?: string | null;
  items: QuoteItemInput[];
  discount?: number;
  valid_until?: string | null;
  patient_note?: string | null;
  internal_note?: string | null;
  assigned_to?: string | null;
}) {
  if (!input.items.length) throw new Error("Ajoutez au moins une ligne au devis.");
  const { subtotal, total } = computeTotals(input.items, input.discount ?? 0);
  const { data: u } = await supabase.auth.getUser();
  const { data: q, error } = await supabase
    .from("quotes")
    .insert({
      patient_id: input.patient_id,
      patient_treatment_id: input.patient_treatment_id ?? null,
      title: input.title ?? null,
      amount: subtotal,
      discount: input.discount ?? 0,
      final_amount: total,
      status: "draft",
      expires_at: input.valid_until ?? null,
      notes: input.internal_note ?? null,
      patient_note: input.patient_note ?? null,
      assigned_to: input.assigned_to ?? null,
      created_by: u.user?.id ?? null,
    } as any)
    .select("*")
    .single();
  if (error) throw error;
  const items = input.items.map((it, idx) => ({
    quote_id: q.id,
    label: it.label,
    description: it.description ?? null,
    quantity: it.quantity,
    unit_price: it.unit_price,
    discount_amount: it.discount_amount ?? 0,
    total: Math.max(0, it.quantity * it.unit_price - (it.discount_amount ?? 0)),
    treatment_id: it.treatment_id ?? null,
    sort_order: it.sort_order ?? idx,
  }));
  const { error: ie } = await supabase.from("quote_items").insert(items as any);
  if (ie) throw ie;
  return q;
}

export async function updateQuoteStatus(
  quote_id: string,
  status: QuoteStatus,
  expectedUpdatedAt: string,
) {
  const patch: any = { status, updated_at: new Date().toISOString() };
  if (status === "sent") patch.sent_at = new Date().toISOString();
  if (status === "viewed") patch.viewed_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("quotes")
    .update(patch)
    .eq("id", quote_id)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throwStaleConflict();
}

export async function acceptQuote(quote_id: string, expectedUpdatedAt?: string | null) {
  const { data, error } = await (supabase.rpc as any)("accept_quote", {
    _quote_id: quote_id,
    _expected_updated_at: expectedUpdatedAt ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function refuseQuote(quote_id: string, reason: string | null, expectedUpdatedAt?: string | null) {
  const { error } = await (supabase.rpc as any)("refuse_quote", {
    _quote_id: quote_id,
    _reason: reason,
    _expected_updated_at: expectedUpdatedAt ?? null,
  });
  if (error) throw error;
}

export async function duplicateQuote(quote_id: string) {
  const { data: src, error } = await supabase
    .from("quotes").select("*, quote_items(*)").eq("id", quote_id).maybeSingle();
  if (error || !src) throw error ?? new Error("Devis introuvable");
  const items = (src as any).quote_items ?? [];
  return createQuote({
    patient_id: src.patient_id,
    patient_treatment_id: (src as any).patient_treatment_id ?? null,
    title: (src as any).title ? `${(src as any).title} (copie)` : null,
    items: items.map((it: any) => ({
      label: it.label,
      description: it.description,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      discount_amount: Number(it.discount_amount ?? 0),
      treatment_id: it.treatment_id ?? null,
      sort_order: it.sort_order ?? 0,
    })),
    discount: Number(src.discount ?? 0),
    valid_until: (src as any).expires_at ?? null,
    patient_note: (src as any).patient_note ?? null,
    internal_note: (src as any).notes ?? null,
    assigned_to: (src as any).assigned_to ?? null,
  });
}

export async function fetchQuoteBalance(quote_id: string) {
  const { data, error } = await (supabase.rpc as any)("quote_balance", { _quote_id: quote_id });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total: Number(row?.total ?? 0),
    paid: Number(row?.paid ?? 0),
    remaining: Number(row?.remaining ?? 0),
  };
}
