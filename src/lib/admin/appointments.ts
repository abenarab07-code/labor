import { supabase } from "@/integrations/supabase/client";
import { algeriaDow, algeriaHM } from "./tz";
import { logActivity, logAudit } from "./utils";

export type ApptStatus =
  | "tentative" | "confirmed" | "arrived" | "waiting"
  | "in_consultation" | "completed" | "rescheduled" | "cancelled" | "no_show";

export type ConfirmationStatus = "unconfirmed" | "sent" | "confirmed" | "declined";

export const CONFIRMATION_LABELS: Record<ConfirmationStatus, string> = {
  unconfirmed: "Non confirmé",
  sent: "Confirmation envoyée",
  confirmed: "Confirmé par patient",
  declined: "Refusé par patient",
};

export const CONFIRMATION_DOT: Record<ConfirmationStatus, string> = {
  unconfirmed: "bg-neutral-300",
  sent: "bg-amber-400",
  confirmed: "bg-emerald-500",
  declined: "bg-red-400",
};

type OpenHours = Record<string, { open: string; close: string } | null>;

async function loadOpenHours(): Promise<OpenHours> {
  const { data } = await supabase.from("clinic_settings").select("value").eq("key", "open_hours").maybeSingle();
  return ((data?.value as OpenHours) ?? {
    "1": { open: "08:30", close: "18:00" }, "2": { open: "08:30", close: "18:00" },
    "3": { open: "08:30", close: "18:00" }, "4": { open: "08:30", close: "18:00" },
    "5": null, "6": { open: "09:00", close: "15:00" }, "0": null,
  });
}

function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export async function isWithinWorkingHours(start: Date, end: Date): Promise<{ ok: boolean; reason?: string }> {
  const hours = await loadOpenHours();
  const dow = algeriaDow(start);
  const day = hours[String(dow)];
  if (!day) return { ok: false, reason: "Clinique fermée ce jour" };
  const s = algeriaHM(start);
  const e = algeriaHM(end);
  const startMin = s.h * 60 + s.m;
  const endMin = e.h * 60 + e.m;
  const open = parseHM(day.open);
  const close = parseHM(day.close);
  if (startMin < open || endMin > close) return { ok: false, reason: `Hors horaires (${day.open}–${day.close})` };
  return { ok: true };
}

export async function findConflicts(params: {
  starts_at: Date; ends_at: Date;
  practitioner_id?: string | null; patient_id?: string | null;
  ignoreId?: string | null;
}): Promise<{ practitioner: Array<{ id: string; starts_at: string }>; patient: Array<{ id: string; starts_at: string }> }> {
  const startISO = params.starts_at.toISOString();
  const endISO = params.ends_at.toISOString();
  const result = { practitioner: [] as any[], patient: [] as any[] };
  const activeStatuses = ["tentative", "confirmed", "arrived", "waiting", "in_consultation"];

  if (params.practitioner_id) {
    let q = supabase.from("appointments").select("id, starts_at, ends_at")
      .eq("practitioner_id", params.practitioner_id)
      .in("status", activeStatuses)
      .lt("starts_at", endISO).gt("ends_at", startISO);
    if (params.ignoreId) q = q.neq("id", params.ignoreId);
    const { data } = await q;
    result.practitioner = data ?? [];
  }
  if (params.patient_id) {
    let q = supabase.from("appointments").select("id, starts_at, ends_at")
      .eq("patient_id", params.patient_id)
      .in("status", activeStatuses)
      .lt("starts_at", endISO).gt("ends_at", startISO);
    if (params.ignoreId) q = q.neq("id", params.ignoreId);
    const { data } = await q;
    result.patient = data ?? [];
  }
  return result;
}

/**
 * Stale-write protected: if `expectedUpdatedAt` is provided, the update only
 * applies when the row hasn't been changed by another user in the meantime.
 * Throws a French-friendly error consumed by runMutation.
 */
export async function changeAppointmentStatus(
  id: string,
  next: ApptStatus,
  extra?: Record<string, any>,
  expectedUpdatedAt?: string | null,
) {
  const payload: Record<string, any> = { status: next, ...(extra ?? {}) };
  if (next === "no_show") payload.no_show_at = new Date().toISOString();
  let q = supabase.from("appointments").update(payload as any).eq("id", id);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { error, data } = await q.select("patient_id, updated_at").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.");
  await logAudit({ action: "status_change", entity_type: "appointment", entity_id: id, summary: `RDV → ${next}` });
  if (data?.patient_id) {
    await logActivity({ patient_id: data.patient_id, type: "appointment_status", summary: `Statut RDV → ${next}` });
  }
  return true;
}

/**
 * Reschedule preserves the previous slot in history via the DB trigger.
 * The active appointment keeps an operational status: we reset it to
 * `tentative` and clear the confirmation flag so it needs to be re-confirmed.
 * "Reporté" is an event in history, not a durable status.
 */
export async function rescheduleAppointment(
  id: string,
  newStart: Date,
  newEnd: Date,
  expectedUpdatedAt?: string | null,
) {
  const { data: prev } = await supabase.from("appointments").select("starts_at, ends_at, patient_id, status, updated_at").eq("id", id).maybeSingle();
  if (!prev) throw new Error("Rendez-vous introuvable");
  if (expectedUpdatedAt && prev.updated_at !== expectedUpdatedAt) {
    throw new Error("Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.");
  }
  let q = supabase.from("appointments").update({
    starts_at: newStart.toISOString(),
    ends_at: newEnd.toISOString(),
    previous_starts_at: prev.starts_at,
    previous_ends_at: prev.ends_at,
    status: "tentative",
    confirmation_status: "unconfirmed",
  } as any).eq("id", id);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { data: updated, error } = await q.select("id").maybeSingle();
  if (error) throw error;
  if (!updated) throw new Error("Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.");
  await logAudit({ action: "reschedule", entity_type: "appointment", entity_id: id, before: { starts_at: prev.starts_at }, after: { starts_at: newStart.toISOString() } });
  if (prev.patient_id) await logActivity({ patient_id: prev.patient_id, type: "reschedule", summary: "Rendez-vous reporté — à reconfirmer" });

  if (prev.patient_id) {
    await supabase.from("follow_up_tasks").upsert({
      patient_id: prev.patient_id,
      appointment_id: id,
      type: "confirm_appointment",
      title: "Confirmer le nouveau rendez-vous",
      due_at: new Date(Date.now() + 2 * 3600_000).toISOString(),
      priority: "important",
      status: "open",
      linked_entity_type: "appointment",
      linked_entity_id: id,
      dedupe_key: `confirm:${id}`,
    } as any, { onConflict: "dedupe_key" });
  }
}

export async function cancelAppointment(
  id: string,
  reason: string,
  cancelledBy: "patient" | "clinic" | "other",
  expectedUpdatedAt?: string | null,
) {
  const { data: prev } = await supabase.from("appointments").select("patient_id, updated_at").eq("id", id).maybeSingle();
  if (!prev) throw new Error("Rendez-vous introuvable");
  if (expectedUpdatedAt && prev.updated_at !== expectedUpdatedAt) {
    throw new Error("Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.");
  }
  let q = supabase.from("appointments").update({
    status: "cancelled", cancellation_reason: reason, cancelled_by: cancelledBy,
  } as any).eq("id", id);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { data: updated, error } = await q.select("id").maybeSingle();
  if (error) throw error;
  if (!updated) throw new Error("Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.");
  await logAudit({ action: "cancel", entity_type: "appointment", entity_id: id, summary: `Annulé (${cancelledBy}): ${reason}` });
  if (prev?.patient_id) await logActivity({ patient_id: prev.patient_id, type: "cancellation", summary: `RDV annulé — ${reason}` });
}

export async function setAppointmentConfirmation(
  id: string,
  next: ConfirmationStatus,
  expectedUpdatedAt?: string | null,
) {
  let q = supabase.from("appointments").update({ confirmation_status: next } as any).eq("id", id);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await q.select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.");
}

export async function setAppointmentPractitioner(
  id: string,
  userId: string | null,
  expectedUpdatedAt?: string | null,
) {
  let q = supabase.from("appointments").update({ practitioner_id: userId } as any).eq("id", id);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await q.select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.");
  await logAudit({ action: "assign", entity_type: "appointment", entity_id: id, after: { practitioner_id: userId } });
}

/**
 * Non-présentation. Idempotent: the callback task is upserted on `dedupe_key`
 * so repeated clicks / realtime events never create duplicates.
 */
export async function markNoShowWithCallback(id: string, expectedUpdatedAt?: string | null) {
  const { data: appt } = await supabase.from("appointments").select("patient_id, starts_at").eq("id", id).maybeSingle();
  await changeAppointmentStatus(id, "no_show", undefined, expectedUpdatedAt);
  if (!appt?.patient_id) return;
  const due = new Date(Date.now() + 60 * 60_000);
  const { error } = await supabase.from("follow_up_tasks").upsert({
    patient_id: appt.patient_id,
    appointment_id: id,
    type: "callback",
    title: "Rappel après non-présentation",
    due_at: due.toISOString(),
    priority: "important",
    status: "open",
    linked_entity_type: "appointment",
    linked_entity_id: id,
    dedupe_key: `noshow:${id}`,
  } as any, { onConflict: "dedupe_key" });
  if (error) throw error;
}
