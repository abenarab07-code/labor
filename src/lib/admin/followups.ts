import { supabase } from "@/integrations/supabase/client";
import { logActivity, logAudit } from "./utils";
import { throwStaleConflict } from "./mutation-utils";

export const FOLLOWUP_TYPES = [
  "call", "whatsapp", "confirm_appointment", "recall_absence",
  "request_followup", "post_treatment_check", "reactivation",
  "quote_reminder", "payment", "custom",
] as const;

export const FOLLOWUP_TYPE_LABELS: Record<string, string> = {
  call: "Appel",
  whatsapp: "WhatsApp",
  confirm_appointment: "Confirmation de rendez-vous",
  recall_absence: "Relance après absence",
  request_followup: "Suivi de demande",
  post_treatment_check: "Contrôle post-traitement",
  reactivation: "Réactivation patient",
  quote_reminder: "Relance devis",
  payment: "Paiement",
  callback: "Rappel",
  custom: "Tâche personnalisée",
};

export const FOLLOWUP_PRIORITIES = ["normal", "important", "urgent"] as const;

export const FOLLOWUP_PRIORITY_LABELS: Record<string, string> = {
  normal: "Normale",
  important: "Importante",
  urgent: "Urgente",
  low: "Basse",
  high: "Importante",
};

export const FOLLOWUP_PRIORITY_TONE: Record<string, string> = {
  normal: "bg-neutral-100 text-neutral-700 border-neutral-300",
  important: "bg-champagne/20 text-[#8a7a3f] border-champagne/40",
  urgent: "bg-red-100 text-red-700 border-red-300",
  low: "bg-neutral-100 text-neutral-700 border-neutral-300",
  high: "bg-champagne/20 text-[#8a7a3f] border-champagne/40",
};

/** Run an UPDATE gated on `updated_at`; throw stale-conflict if the row moved. */
async function guardedUpdate(
  id: string,
  patch: Record<string, any>,
  expectedUpdatedAt: string | null | undefined,
): Promise<{ patient_id: string | null }> {
  let q = supabase.from("follow_up_tasks").update(patch as any).eq("id", id);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await q.select("id, patient_id, updated_at").maybeSingle();
  if (error) throw error;
  if (!data) throwStaleConflict();
  return { patient_id: (data as any).patient_id ?? null };
}

export async function completeTask(id: string, note?: string, expectedUpdatedAt?: string | null) {
  const { data: u } = await supabase.auth.getUser();
  const { patient_id } = await guardedUpdate(id, {
    status: "done",
    completed_at: new Date().toISOString(),
    completed_by: u.user?.id ?? null,
    completion_note: note ?? null,
  }, expectedUpdatedAt);
  await logAudit({ action: "complete", entity_type: "follow_up_task", entity_id: id, summary: note ?? "Tâche terminée" });
  if (patient_id) await logActivity({ patient_id, type: "task_complete", summary: note ?? "Tâche terminée" });
}

export async function reopenTask(id: string, expectedUpdatedAt?: string | null) {
  await guardedUpdate(id, { status: "open", completed_at: null, completed_by: null }, expectedUpdatedAt);
  await logAudit({ action: "reopen", entity_type: "follow_up_task", entity_id: id });
}

export async function postponeTask(id: string, due: Date, expectedUpdatedAt?: string | null) {
  await guardedUpdate(id, { due_at: due.toISOString() }, expectedUpdatedAt);
  await logAudit({ action: "postpone", entity_type: "follow_up_task", entity_id: id, summary: `Reporté au ${due.toLocaleString("fr-FR")}` });
}

export async function assignTask(id: string, staffUserId: string | null, expectedUpdatedAt?: string | null) {
  await guardedUpdate(id, { assigned_to: staffUserId }, expectedUpdatedAt);
  await logAudit({ action: "assign", entity_type: "follow_up_task", entity_id: id, after: { assigned_to: staffUserId } });
}

export async function setTaskPriority(id: string, priority: string, expectedUpdatedAt?: string | null) {
  await guardedUpdate(id, { priority }, expectedUpdatedAt);
  await logAudit({ action: "priority_change", entity_type: "follow_up_task", entity_id: id, after: { priority } });
}

export async function editTask(
  id: string,
  patch: { title?: string; description?: string | null; type?: string; priority?: string; due_at?: string | null },
  expectedUpdatedAt?: string | null,
) {
  await guardedUpdate(id, patch, expectedUpdatedAt);
  await logAudit({ action: "edit", entity_type: "follow_up_task", entity_id: id, after: patch });
}

/** Skip Friday (Algeria dow=5, weekly closure) when postponing to a specific day. */
function skipClosedDay(d: Date): Date {
  const out = new Date(d);
  while (out.getDay() === 5) out.setDate(out.getDate() + 1);
  return out;
}

export function postponeShortcuts(from = new Date()): Array<{ label: string; date: Date }> {
  const in1h = new Date(from.getTime() + 60 * 60_000);
  const pm = new Date(from); pm.setHours(15, 0, 0, 0);
  if (pm.getTime() < from.getTime()) pm.setDate(pm.getDate() + 1);
  const tomorrow = new Date(from); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0);
  const in2d = new Date(from); in2d.setDate(in2d.getDate() + 2); in2d.setHours(9, 0, 0, 0);
  return [
    { label: "Dans 1 heure", date: in1h },
    { label: "Cet après-midi", date: skipClosedDay(pm) },
    { label: "Demain matin", date: skipClosedDay(tomorrow) },
    { label: "Dans 2 jours", date: skipClosedDay(in2d) },
  ];
}
