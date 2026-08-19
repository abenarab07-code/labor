import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(["admin", "reception", "practitioner", "marketing"]),
  jobTitle: z.string().optional().nullable(),
});

const setActiveSchema = z.object({
  userId: z.string().uuid(),
  active: z.boolean(),
});

export const inviteTeamMemberFn = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d: unknown) => inviteSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Verify caller is admin via authenticated client (RLS-safe)
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Réservé aux administrateurs");
    }
    const { inviteTeamMember } = await import("./team.server");
    return inviteTeamMember(data);
  });

export const setTeamMemberActiveFn = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d: unknown) => setActiveSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Réservé aux administrateurs");
    }
    const { setTeamMemberActive } = await import("./team.server");
    await setTeamMemberActive(data.userId, data.active);
    return { ok: true };
  });
