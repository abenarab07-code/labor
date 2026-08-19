/**
 * Server-only helpers for team provisioning.
 * Uses the service-role client to invite users; never imported from client code.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type InvitePayload = {
  email: string;
  fullName: string;
  role: "admin" | "reception" | "practitioner" | "marketing";
  jobTitle?: string | null;
};

export async function inviteTeamMember(p: InvitePayload) {
  const email = p.email.trim().toLowerCase();
  // Reuse existing auth user when possible
  const { data: existing, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  let userId = existing?.users?.find((u) => (u.email ?? "").toLowerCase() === email)?.id ?? null;

  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: p.fullName },
    });
    if (error) throw new Error(error.message);
    userId = data.user?.id ?? null;
  }
  if (!userId) throw new Error("Impossible de provisionner l'utilisateur.");

  // staff_profile (idempotent per user_id)
  const { error: profErr } = await supabaseAdmin
    .from("staff_profiles")
    .upsert(
      {
        user_id: userId,
        full_name: p.fullName,
        email,
        job_title: p.jobTitle ?? null,
        is_active: true,
      },
      { onConflict: "user_id" },
    );
  if (profErr) throw new Error(profErr.message);

  // role
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: p.role }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error(roleErr.message);

  return { userId };
}

export async function setTeamMemberActive(userId: string, active: boolean) {
  const { error } = await supabaseAdmin
    .from("staff_profiles")
    .update({ is_active: active })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}
