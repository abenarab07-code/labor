import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "./utils";
import { throwStaleConflict } from "./mutation-utils";
import { REQUEST_STATUS_LABELS } from "./utils";

/**
 * Update an appointment_request row's status with stale-write protection.
 * When `expectedUpdatedAt` is provided, the row must not have moved since.
 */
export async function updateRequestStatus(
  id: string,
  newStatus: string,
  expectedUpdatedAt?: string | null,
) {
  let q = supabase
    .from("appointment_requests")
    .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
    .eq("id", id);
  if (expectedUpdatedAt) q = q.eq("updated_at", expectedUpdatedAt);
  const { data, error } = await q.select("id").maybeSingle();
  if (error) throw error;
  if (!data) throwStaleConflict();
  await logActivity({
    request_id: id,
    type: "status_change",
    summary: `Statut lead → ${REQUEST_STATUS_LABELS[newStatus] ?? newStatus}`,
  });
}
