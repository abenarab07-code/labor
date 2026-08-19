import { supabase } from "@/integrations/supabase/client";
import { logActivity, logAudit } from "./utils";
import { throwStaleConflict } from "./mutation-utils";

/**
 * All patient-scope mutations centralize stale-write protection.
 * Every helper accepts an optional `expectedUpdatedAt`; when provided,
 * the UPDATE only lands when the row's `updated_at` still matches.
 */

async function guardedUpdate<TSelect extends string>(
  table: "patients" | "patient_treatments",
  id: string,
  patch: Record<string, any>,
  expectedUpdatedAt: string | null | undefined,
  select: TSelect = "id, updated_at" as TSelect,
): Promise<any> {
  let q = supabase.from(table).update(patch as any).eq("id", id);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await q.select(select as any).maybeSingle();
  if (error) throw error;
  if (!data) throwStaleConflict();
  return data;
}

// ------------------- Patient field updates -------------------

export async function updatePatientField(
  id: string,
  field: string,
  value: any,
  expectedUpdatedAt?: string | null,
) {
  await guardedUpdate("patients", id, { [field]: value }, expectedUpdatedAt);
  await logAudit({
    action: "edit",
    entity_type: "patient",
    entity_id: id,
    after: { [field]: value },
    summary: `Champ ${field} mis à jour`,
  });
}

export async function updatePatientFields(
  id: string,
  patch: Record<string, any>,
  expectedUpdatedAt?: string | null,
) {
  await guardedUpdate("patients", id, patch, expectedUpdatedAt);
  await logAudit({ action: "edit", entity_type: "patient", entity_id: id, after: patch });
}

// ------------------- Patient treatments -------------------

export async function updatePatientTreatment(
  id: string,
  patch: {
    stage?: string;
    status?: string;
    practitioner_id?: string | null;
    next_step?: string | null;
    expected_end_date?: string | null;
    progress?: number;
    agreed_value?: number | null;
    notes?: string | null;
  },
  expectedUpdatedAt?: string | null,
) {
  const data = await guardedUpdate("patient_treatments", id, patch, expectedUpdatedAt, "id, patient_id, updated_at");
  await logAudit({ action: "edit", entity_type: "patient_treatment", entity_id: id, after: patch });
  if (data?.patient_id) {
    await logActivity({
      patient_id: data.patient_id,
      type: "treatment",
      summary: patch.status ? `Statut traitement → ${patch.status}` : "Traitement mis à jour",
    });
  }
}

// ------------------- Patient notes -------------------

export async function addPatientNote(patientId: string, body: string) {
  const { data: u } = await supabase.auth.getUser();
  const { error } = await supabase.from("patient_notes").insert({
    patient_id: patientId,
    body,
    author_id: u.user?.id,
  });
  if (error) throw error;
  await logActivity({ patient_id: patientId, type: "note", summary: "Note ajoutée" });
}

export async function editPatientNote(
  noteId: string,
  body: string,
  expectedUpdatedAt?: string | null,
) {
  let q = supabase.from("patient_notes").update({ body } as any).eq("id", noteId);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await q.select("id, patient_id, updated_at").maybeSingle();
  if (error) throw error;
  if (!data) throwStaleConflict();
  await logAudit({ action: "edit", entity_type: "patient_note", entity_id: noteId });
}

// ------------------- Staff assignments -------------------

export async function assignPatientStaff(
  patientId: string,
  staffUserId: string,
  assignmentType: string = "practitioner",
) {
  const { data: u } = await supabase.auth.getUser();
  // Deactivate existing active assignments of the same type, then insert new
  const { error: deactErr } = await supabase
    .from("patient_staff_assignments")
    .update({ active: false, ended_at: new Date().toISOString() } as any)
    .eq("patient_id", patientId)
    .eq("assignment_type", assignmentType)
    .eq("active", true);
  if (deactErr) throw deactErr;
  const { error } = await supabase.from("patient_staff_assignments").insert({
    patient_id: patientId,
    staff_user_id: staffUserId,
    assignment_type: assignmentType,
    active: true,
    assigned_by: u.user?.id ?? null,
  } as any);
  if (error) throw error;
  await logAudit({
    action: "assign",
    entity_type: "patient_staff_assignment",
    entity_id: patientId,
    after: { staff_user_id: staffUserId, assignment_type: assignmentType },
  });
}

export async function deactivatePatientAssignment(assignmentId: string) {
  const { error } = await supabase
    .from("patient_staff_assignments")
    .update({ active: false, ended_at: new Date().toISOString() } as any)
    .eq("id", assignmentId)
    .eq("active", true);
  if (error) throw error;
  await logAudit({ action: "deactivate", entity_type: "patient_staff_assignment", entity_id: assignmentId });
}

// ------------------- Patient creation (shared) -------------------
import { normalizePhone, toE164 } from "./phone";

export type CreatePatientInput = {
  full_name: string;
  phone: string;
  email?: string | null;
  treatment_interest?: string | null;
  lifecycle_status?: string;
  source?: string;
};

export type CreatePatientResult =
  | { ok: true; id: string; existed: false }
  | { ok: false; existing: { id: string; full_name: string; phone_e164: string }; existed: true };

/**
 * Create a patient with duplicate detection based on normalized phone.
 * Returns `existed: true` (and does NOT insert) when a non-archived patient
 * already has the same normalized phone.
 */
export async function createPatient(input: CreatePatientInput): Promise<CreatePatientResult> {
  const full_name = input.full_name.trim();
  if (!full_name) throw new Error("Nom requis");
  const normalized = normalizePhone(input.phone);
  if (!normalized) throw new Error("Téléphone requis");
  const e164 = toE164(input.phone)!;

  // Duplicate check
  const { data: dup, error: dupErr } = await supabase
    .from("patients")
    .select("id, full_name, phone_e164")
    .eq("phone_normalized", normalized)
    .eq("archived", false)
    .maybeSingle();
  if (dupErr && dupErr.code !== "PGRST116") throw dupErr;
  if (dup) return { ok: false, existing: dup as any, existed: true };

  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      full_name,
      phone_e164: e164,
      phone_raw: input.phone,
      email: input.email || null,
      treatment_interest: input.treatment_interest || null,
      lifecycle_status: input.lifecycle_status ?? "lead",
      source: input.source ?? "manuel",
      created_by: u.user?.id ?? null,
    } as any)
    .select("id")
    .single();
  if (error) {
    if (/duplicate key|unique constraint/i.test(error.message)) {
      // Race: another session inserted same normalized phone
      const { data: race } = await supabase
        .from("patients")
        .select("id, full_name, phone_e164")
        .eq("phone_normalized", normalized)
        .eq("archived", false)
        .maybeSingle();
      if (race) return { ok: false, existing: race as any, existed: true };
      throw new Error("Un patient avec ce numéro existe déjà.");
    }
    throw error;
  }
  await logAudit({ action: "create", entity_type: "patient", entity_id: data.id, summary: "Patient créé" });
  return { ok: true, id: data.id as string, existed: false };
}
