import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Inbox,
  Activity,
  KanbanSquare,
  Users,
  Calendar,
  ListChecks,
  Stethoscope,
  FileText,
  Wallet,
  LineChart,
  Megaphone,
  UserCog,
  Bell,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Phone,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AdminAuthState } from "@/lib/admin/auth";
import { initials } from "@/lib/admin/utils";
import { GlobalSearch, useGlobalSearchHotkey } from "./GlobalSearch";

type NavItem = { to: string; label: string; icon: any; admin?: boolean };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "PRINCIPAL",
    items: [
      { to: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
      { to: "/admin/activite", label: "Centre d'activité", icon: Activity },
      { to: "/admin/demandes", label: "Demandes", icon: Inbox },
      { to: "/admin/pipeline", label: "Pipeline", icon: KanbanSquare },
      { to: "/admin/patients", label: "Patients", icon: Users },
      { to: "/admin/agenda", label: "Agenda", icon: Calendar },
      { to: "/admin/suivis", label: "Suivis", icon: ListChecks },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { to: "/admin/traitements", label: "Traitements", icon: Stethoscope },
      { to: "/admin/devis", label: "Devis", icon: FileText },
      { to: "/admin/revenus", label: "Revenus", icon: Wallet, admin: true },
      { to: "/admin/analytics", label: "Analytics", icon: LineChart },
      { to: "/admin/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    title: "GESTION",
    items: [
      { to: "/admin/equipe", label: "Équipe", icon: UserCog, admin: true },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
      { to: "/admin/audit", label: "Journal d'audit", icon: ScrollText, admin: true },
      { to: "/admin/parametres", label: "Paramètres", icon: Settings, admin: true },
    ],
  },
];

const MOBILE_PRIMARY: NavItem[] = [
  { to: "/admin", label: "Accueil", icon: LayoutDashboard },
  { to: "/admin/agenda", label: "Agenda", icon: Calendar },
  { to: "/admin/demandes", label: "Demandes", icon: Inbox },
  { to: "/admin/suivis", label: "Suivis", icon: ListChecks },
  { to: "/admin/patients", label: "Patients", icon: Users },
];

export function AdminShell({ auth, children }: { auth: AdminAuthState; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  useGlobalSearchHotkey(() => setSearchOpen(true));

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.rpc("unread_notifications_count");
      if (!cancelled && !error) setUnread(Number(data ?? 0));
    }
    load();
    const ch = supabase
      .channel(`admin-notif-count-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () =>
        load(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_reads" }, () =>
        load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin", replace: true });
  }

  const isActive = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);

  const sidebar = (
    <div className="flex w-full flex-col h-full bg-[#0e1d20] text-ivory">
      <div className="h-[61px] shrink-0 px-5 flex items-center gap-3 border-b border-white/5">
        <div className="h-9 w-9 rounded-xl bg-teal text-petrol flex items-center justify-center font-serif text-lg">
          B
        </div>
        <div className="min-w-0">
          <div className="font-serif text-[15px] leading-tight truncate">Dr Tarfaya</div>
          <div className="text-[10px] uppercase tracking-wider text-ivory/50">Clinic OS</div>
        </div>
        <button
          className="ml-auto lg:hidden text-ivory/70"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <div className="px-3 mb-2 text-[10px] font-medium tracking-widest text-ivory/40">
              {g.title}
            </div>
            <div className="space-y-0.5">
              {g.items
                .filter((i) => !i.admin || auth.isAdmin)
                .map((i) => {
                  const Icon = i.icon;
                  const active = isActive(i.to);
                  return (
                    <Link
                      key={i.to}
                      to={i.to}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-teal/15 text-teal"
                          : "text-ivory/70 hover:bg-white/5 hover:text-ivory"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{i.label}</span>
                      {i.to === "/admin/notifications" && unread > 0 && (
                        <span className="ml-auto text-[10px] bg-teal text-petrol rounded-full px-1.5 py-0.5 font-medium">
                          {unread}
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-teal/20 text-teal flex items-center justify-center text-xs font-medium">
            {initials(auth.user?.user_metadata?.full_name || auth.user?.email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm truncate">{auth.user?.email}</div>
            <div className="text-[10px] text-ivory/50 uppercase tracking-wider">
              {auth.roles[0] ?? "membre"}
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-ivory/60 hover:text-ivory p-2"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3f1ea] text-ink flex">
      <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen bg-[#0e1d20]">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85vw]">{sidebar}</div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-[61px] shrink-0 bg-[#f3f1ea]/85 backdrop-blur border-b border-black/5 px-4 lg:px-8 flex items-center gap-3">
          <button
            className="lg:hidden p-2 -ml-2 text-ink/70"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex-1 relative max-w-md text-left"
            aria-label="Rechercher (Ctrl+K)"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
            <span className="w-full block pl-9 pr-14 py-2 rounded-full bg-white border border-black/5 text-sm text-ink/40 truncate">
              Rechercher patient, téléphone…
            </span>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-ink/40 border border-black/10 rounded px-1.5 py-0.5 bg-ivory">
              ⌘K
            </span>
          </button>

          <Link
            to="/admin/notifications"
            className="relative p-2 text-ink/70 hover:text-petrol"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal" />}
          </Link>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-6">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>

        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0e1d20] text-ivory border-t border-white/5 grid grid-cols-5 pb-safe">
          {MOBILE_PRIMARY.map((i) => {
            const Icon = i.icon;
            const active = isActive(i.to);
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex flex-col items-center justify-center py-2.5 text-[10px] gap-1 ${
                  active ? "text-teal" : "text-ivory/70"
                }`}
              >
                <Icon className="h-5 w-5" />
                {i.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export function CallLink({ phone, className }: { phone?: string | null; className?: string }) {
  if (!phone) return null;
  return (
    <a
      href={`tel:${phone}`}
      className={
        className ?? "inline-flex items-center gap-1.5 text-xs text-petrol hover:underline"
      }
    >
      <Phone className="h-3.5 w-3.5" /> Appeler
    </a>
  );
}

export function WhatsAppLink({
  phone,
  className,
  message,
}: {
  phone?: string | null;
  className?: string;
  message?: string;
}) {
  if (!phone) return null;
  const clean = phone.replace(/[^\d]/g, "");
  const url = `https://wa.me/${clean}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "inline-flex items-center gap-1.5 text-xs text-teal hover:underline"}
    >
      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
    </a>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="font-serif text-3xl text-petrol">{title}</h1>
        {subtitle && <p className="text-sm text-ink/60 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon?: any;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white/50 p-10 text-center">
      {Icon && (
        <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-mint text-petrol flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="font-medium text-petrol">{title}</div>
      {description && <div className="text-sm text-ink/60 mt-1">{description}</div>}
    </div>
  );
}
