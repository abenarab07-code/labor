import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminAuth } from "@/lib/admin/auth";
import {
  ArrowLeft,
  CalendarDays,
  Database,
  Inbox,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dr Tarfaya Lab OS — Administration" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const auth = useAdminAuth();

  if (auth.status === "loading") {
    return (
      <div className="min-h-screen bg-[#0b1618] flex items-center justify-center text-ivory">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
      </div>
    );
  }
  if (auth.status === "unconfigured") {
    return <AdminConnectionState />;
  }
  if (auth.status === "error") {
    return (
      <AdminConnectionState
        connectionError={auth.error}
        onRetry={auth.refresh}
      />
    );
  }
  if (auth.status === "unauthenticated")
    return <AdminLogin onSignedIn={auth.refresh} />;
  if (auth.status === "unauthorized") return <AdminLogin unauthorized />;

  return (
    <AdminShell auth={auth}>
      <Outlet />
      <Toaster position="top-right" richColors />
    </AdminShell>
  );
}

const previewModules = [
  { label: "Demandes", detail: "Nouveaux dossiers", icon: Inbox },
  { label: "Agenda", detail: "Rendez-vous", icon: CalendarDays },
  { label: "Patients", detail: "Suivi médical", icon: Users },
] as const;

function AdminConnectionState({
  connectionError,
  onRetry,
}: {
  connectionError?: string;
  onRetry?: () => Promise<void>;
}) {
  const isError = Boolean(connectionError);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#081416] px-5 py-8 text-ivory sm:px-8 lg:px-12 lg:py-12">
      <div
        aria-hidden="true"
        className="absolute -right-44 -top-44 h-[34rem] w-[34rem] rounded-full border border-teal/15"
      />
      <div
        aria-hidden="true"
        className="absolute right-12 top-12 h-2 w-2 rounded-full bg-teal shadow-[0_0_36px_10px_rgba(52,211,153,0.2)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/8 pb-6">
          <div>
            <div className="font-serif text-xl text-ivory sm:text-2xl">
              Dr Tarfaya Lab OS
            </div>
            <div className="mt-1 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-ivory/35">
              Administration sécurisée
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-champagne/20 bg-champagne/8 px-3 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-champagne">
            <span className="h-1.5 w-1.5 rounded-full bg-champagne" />
            Configuration requise
          </div>
        </header>

        <div className="grid gap-10 py-12 lg:grid-cols-12 lg:items-center lg:gap-14 lg:py-20">
          <section className="lg:col-span-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-teal/20 bg-teal/10 text-teal">
              {isError ? (
                <RefreshCw className="h-5 w-5" />
              ) : (
                <Database className="h-5 w-5" />
              )}
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.22em] text-teal">
              Dashboard opérationnel
            </p>
            <h1 className="mt-4 max-w-[11ch] font-serif text-5xl leading-[0.96] text-ivory sm:text-6xl">
              {isError
                ? "Connexion aux données interrompue."
                : "Le système est prêt. Il manque la connexion."}
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-ivory/55 sm:text-base">
              {connectionError ??
                "Le site public fonctionne normalement. Pour ouvrir les dossiers, l’agenda et les patients, reliez ce déploiement au projet Supabase du laboratoire."}
            </p>

            {!isError && (
              <div className="mt-7 max-w-xl border-l border-teal/35 pl-5">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ivory/40">
                  Variables publiques nécessaires
                </p>
                <code className="mt-3 block text-xs leading-6 text-teal sm:text-sm">
                  VITE_SUPABASE_URL
                  <br />
                  VITE_SUPABASE_PUBLISHABLE_KEY
                </code>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {isError && onRetry && (
                <button
                  type="button"
                  onClick={() => void onRetry()}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-petrol transition-colors hover:bg-teal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-[#081416]"
                >
                  <RefreshCw className="h-4 w-4" /> Réessayer
                </button>
              )}
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg border border-white/12 px-5 py-3 text-sm font-semibold text-ivory transition-colors hover:border-teal/45 hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <ArrowLeft className="h-4 w-4" /> Retour au site
              </Link>
            </div>
          </section>

          <section
            aria-label="Aperçu des modules du dashboard"
            className="relative lg:col-span-5 lg:col-start-8"
          >
            <div className="rounded-[1.6rem] border border-white/8 bg-[#102326] p-4 shadow-[0_38px_100px_-55px_rgba(0,0,0,0.9)] sm:p-5">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div>
                  <div className="text-sm font-semibold text-ivory">
                    Vue d'ensemble
                  </div>
                  <div className="mt-1 text-xs text-ivory/35">
                    Modules protégés
                  </div>
                </div>
                <ShieldCheck className="h-5 w-5 text-teal" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {previewModules.map(({ label, detail, icon: Icon }, index) => (
                  <div
                    key={label}
                    className="flex items-center gap-4 rounded-xl border border-white/7 bg-black/10 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-ivory/45">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ivory/75">
                        {label}
                      </div>
                      <div className="mt-0.5 text-xs text-ivory/30">
                        {detail}
                      </div>
                    </div>
                    <span className="font-mono text-[0.65rem] text-ivory/20">
                      0{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
