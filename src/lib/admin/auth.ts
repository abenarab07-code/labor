import { useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "./utils";

export type AdminAuthState = {
  status:
    | "loading"
    | "unconfigured"
    | "error"
    | "unauthenticated"
    | "unauthorized"
    | "authenticated";
  user: User | null;
  roles: AppRole[];
  isAdmin: boolean;
  isStaff: boolean;
  error?: string;
};

export function useAdminAuth(): AdminAuthState & {
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<AdminAuthState>({
    status: hasSupabaseConfig() ? "loading" : "unconfigured",
    user: null,
    roles: [],
    isAdmin: false,
    isStaff: false,
  });

  const load = async () => {
    if (!hasSupabaseConfig()) {
      setState({
        status: "unconfigured",
        user: null,
        roles: [],
        isAdmin: false,
        isStaff: false,
      });
      return;
    }
    try {
      const { data: userRes, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userRes.user;
      if (!user) {
        setState({
          status: "unauthenticated",
          user: null,
          roles: [],
          isAdmin: false,
          isStaff: false,
        });
        return;
      }
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (rolesError) throw rolesError;
      const roles = (rolesData ?? []).map((r) => r.role) as AppRole[];
      const isAdmin = roles.includes("admin");
      const isStaff = roles.some((r) =>
        ["admin", "reception", "practitioner", "moderator"].includes(r),
      );
      setState({
        status: isStaff ? "authenticated" : "unauthorized",
        user,
        roles,
        isAdmin,
        isStaff,
      });
    } catch {
      setState({
        status: "error",
        user: null,
        roles: [],
        isAdmin: false,
        isStaff: false,
        error: "La connexion sécurisée au dashboard a échoué.",
      });
    }
  };

  useEffect(() => {
    if (!hasSupabaseConfig()) return;
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED"
      ) {
        void load();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { ...state, refresh: load };
}
