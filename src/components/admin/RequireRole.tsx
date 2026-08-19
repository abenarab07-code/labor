import { ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin/auth";
import type { AppRole } from "@/lib/admin/utils";

type Props = {
  roles: AppRole[];
  children: React.ReactNode;
};

/**
 * Client-side route guard for admin sub-pages.
 * Blocks rendering (and therefore data fetching in child components) until
 * session/role resolves. Database RLS remains the source of truth — this is
 * defense-in-depth so unauthorized users never see the surface.
 */
export function RequireRole({ roles, children }: Props) {
  const auth = useAdminAuth();

  if (auth.status === "loading") {
    return (
      <div className="p-10 text-sm text-ink/50">Vérification des autorisations…</div>
    );
  }

  const allowed = auth.roles.some((r) => (roles as string[]).includes(r));
  if (!allowed) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-2xl bg-white border border-black/5 p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="font-serif text-xl text-petrol mb-2">Accès refusé</h2>
        <p className="text-sm text-ink/60 mb-6">
          Cette section est réservée aux administrateurs du cabinet. Contactez un
          administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
        <Link
          to="/admin"
          className="inline-flex items-center px-4 py-2 rounded-full bg-petrol text-ivory text-sm"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export const RequireAdmin = ({ children }: { children: React.ReactNode }) => (
  <RequireRole roles={["admin"]}>{children}</RequireRole>
);
