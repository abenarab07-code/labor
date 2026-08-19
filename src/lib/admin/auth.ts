import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "./utils";

export type AdminAuthState = {
  status: "loading" | "unauthenticated" | "unauthorized" | "authenticated";
  user: User | null;
  roles: AppRole[];
  isAdmin: boolean;
  isStaff: boolean;
};

export function useAdminAuth(): AdminAuthState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AdminAuthState>({
    status: "loading",
    user: null,
    roles: [],
    isAdmin: false,
    isStaff: false,
  });

  const load = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) {
      setState({ status: "unauthenticated", user: null, roles: [], isAdmin: false, isStaff: false });
      return;
    }
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (rolesData ?? []).map((r) => r.role) as AppRole[];
    const isAdmin = roles.includes("admin");
    const isStaff = roles.some((r) => ["admin", "reception", "practitioner", "moderator"].includes(r));
    setState({
      status: isStaff ? "authenticated" : "unauthorized",
      user,
      roles,
      isAdmin,
      isStaff,
    });
  };

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { ...state, refresh: load };
}
