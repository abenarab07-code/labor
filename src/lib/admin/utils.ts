import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

// ============================================================
// LEAD / REQUEST STATUSES — appointment_requests.status
// ============================================================
export const REQUEST_STATUSES = [
  "new",
  "to_contact",
  "contacted",
  "qualified",
  "waiting_reply",
  "appointment_proposed",
  "converted",
  "lost",
  "duplicate",
  "invalid",
] as const;

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  to_contact: "À contacter",
  contacted: "Contacté",
  qualified: "Qualifié",
  waiting_reply: "En attente de réponse",
  appointment_proposed: "RDV proposé",
  converted: "Converti",
  lost: "Perdu",
  duplicate: "Doublon",
  invalid: "Invalide",
};

export const REQUEST_STATUS_TONE: Record<string, string> = {
  new: "bg-teal/15 text-teal border-teal/30",
  to_contact: "bg-champagne/20 text-[#8a7a3f] border-champagne/40",
  contacted: "bg-mint text-petrol border-petrol/15",
  qualified: "bg-blue-100 text-blue-700 border-blue-300",
  waiting_reply: "bg-orange-100 text-orange-700 border-orange-300",
  appointment_proposed: "bg-purple-100 text-purple-700 border-purple-300",
  converted: "bg-emerald-100 text-emerald-700 border-emerald-300",
  lost: "bg-neutral-200 text-neutral-600 border-neutral-300",
  duplicate: "bg-amber-100 text-amber-700 border-amber-300",
  invalid: "bg-red-100 text-red-700 border-red-300",
};

// Kanban pipeline shows only actionable lead stages (Perdu inclus en fin).
export const PIPELINE_STAGES = [
  { key: "new", label: "Nouveau" },
  { key: "to_contact", label: "À contacter" },
  { key: "contacted", label: "Contacté" },
  { key: "qualified", label: "Qualifié" },
  { key: "waiting_reply", label: "En attente" },
  { key: "appointment_proposed", label: "RDV proposé" },
  { key: "converted", label: "Converti" },
  { key: "lost", label: "Perdu" },
] as const;

// ============================================================
// APPOINTMENT STATUSES — appointments.status (indépendant)
// ============================================================
export const APPT_STATUSES = [
  "tentative",
  "confirmed",
  "arrived",
  "waiting",
  "in_consultation",
  "completed",
  "rescheduled",
  "cancelled",
  "no_show",
] as const;

export const APPT_STATUS_LABELS: Record<string, string> = {
  tentative: "À confirmer",
  confirmed: "Confirmé",
  arrived: "Arrivé",
  waiting: "En attente",
  in_consultation: "En consultation",
  completed: "Terminé",
  rescheduled: "Reporté",
  cancelled: "Annulé",
  no_show: "Non présenté",
};

export const APPT_STATUS_TONE: Record<string, string> = {
  tentative: "bg-champagne/20 text-[#8a7a3f] border-champagne/40",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-300",
  arrived: "bg-teal/20 text-petrol border-teal/40",
  waiting: "bg-blue-100 text-blue-700 border-blue-300",
  in_consultation: "bg-purple-100 text-purple-700 border-purple-300",
  completed: "bg-petrol/10 text-petrol border-petrol/20",
  rescheduled: "bg-amber-100 text-amber-700 border-amber-300",
  cancelled: "bg-neutral-200 text-neutral-600 border-neutral-300",
  no_show: "bg-red-100 text-red-700 border-red-300",
};

// ============================================================
// TREATMENT STATUSES — patient_treatments.status (indépendant)
// ============================================================
export const TREATMENT_STATUSES = [
  "interest",
  "consultation",
  "diagnosis",
  "proposal",
  "quote_sent",
  "accepted",
  "scheduled",
  "in_progress",
  "follow_up",
  "completed",
  "abandoned",
] as const;

export const TREATMENT_STATUS_LABELS: Record<string, string> = {
  interest: "Intérêt",
  consultation: "Consultation",
  diagnosis: "Diagnostic",
  proposal: "Proposition",
  quote_sent: "Devis envoyé",
  accepted: "Accepté",
  scheduled: "Planifié",
  in_progress: "En cours",
  follow_up: "Suivi",
  completed: "Terminé",
  abandoned: "Abandonné",
};

export const TREATMENT_STATUS_TONE: Record<string, string> = {
  interest: "bg-teal/15 text-teal border-teal/30",
  consultation: "bg-blue-100 text-blue-700 border-blue-300",
  diagnosis: "bg-purple-100 text-purple-700 border-purple-300",
  proposal: "bg-champagne/20 text-[#8a7a3f] border-champagne/40",
  quote_sent: "bg-amber-100 text-amber-700 border-amber-300",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-300",
  scheduled: "bg-teal/20 text-petrol border-teal/40",
  in_progress: "bg-mint text-petrol border-petrol/15",
  follow_up: "bg-orange-100 text-orange-700 border-orange-300",
  completed: "bg-petrol/10 text-petrol border-petrol/20",
  abandoned: "bg-neutral-200 text-neutral-600 border-neutral-300",
};


export function formatDZD(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("fr-DZ", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(v);
}

export function formatDateTime(v: string | Date | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(v: string | Date | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function formatRelative(v: string | Date | null | undefined) {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatDate(d);
}

export async function logActivity(params: {
  patient_id?: string | null;
  request_id?: string | null;
  type: string;
  summary: string;
  meta?: Record<string, unknown>;
}) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("patient_activities").insert({
    patient_id: params.patient_id ?? null,
    request_id: params.request_id ?? null,
    type: params.type,
    summary: params.summary,
    meta: (params.meta ?? null) as any,
    actor_id: u.user?.id ?? null,
  });
}

export async function logAudit(params: {
  action: string;
  entity_type: string;
  entity_id?: string | null;
  summary?: string;
  before?: unknown;
  after?: unknown;
}) {
  const { data: u } = await supabase.auth.getUser();
  await supabase.from("audit_logs").insert({
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id ?? null,
    summary: params.summary ?? null,
    before: (params.before as any) ?? null,
    after: (params.after as any) ?? null,
    actor_id: u.user?.id ?? null,
  });
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}
