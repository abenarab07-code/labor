import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, CallLink, WhatsAppLink } from "@/components/admin/AdminShell";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_TONE,
  REQUEST_STATUSES,
  formatRelative,
} from "@/lib/admin/utils";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { runMutation } from "@/lib/admin/mutation-utils";
import { updateRequestStatus } from "@/lib/admin/requests";

type Req = {
  id: string;
  name: string;
  phone_e164: string;
  phone_raw: string;
  treatment: string | null;
  status: string;
  created_at: string;
  temperature: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  message: string | null;
  source_page: string | null;
  updated_at: string | null;
};

export const Route = createFileRoute("/admin/demandes/")({
  validateSearch: (s: Record<string, unknown>) => ({
    status: typeof s.status === "string" ? s.status : "all",
    q: typeof s.q === "string" ? s.q : "",
  }),
  head: () => ({
    meta: [{ title: "Demandes — Clinic OS" }, { name: "robots", content: "noindex" }],
  }),
  component: RequestsPage,
});

function RequestsPage() {
  const { status, q } = useSearch({ from: "/admin/demandes/" });
  const [items, setItems] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let query = supabase
        .from("appointment_requests")
        .select(
          "id, name, phone_e164, phone_raw, treatment, status, created_at, temperature, preferred_date, preferred_time, message, source_page, updated_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (status !== "all") query = query.eq("status", status);
      if (q) query = query.or(`name.ilike.%${q}%,phone_e164.ilike.%${q}%,phone_raw.ilike.%${q}%`);
      const { data } = await query;
      if (!cancelled) {
        setItems((data as Req[]) ?? []);
        setLoading(false);
      }
    }
    load();

    const ch = supabase
      .channel(`requests-live-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "appointment_requests" },
        (payload) => {
          setFlash(`Nouvelle demande : ${(payload.new as any).name}`);
          toast.success(`Nouvelle demande de ${(payload.new as any).name}`, {
            description: (payload.new as any).treatment ?? "Sans précision",
          });
          load();
          setTimeout(() => setFlash(null), 5000);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointment_requests" },
        load,
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [status, q]);

  const busyRef = useRef(false);
  async function updateStatus(row: Req, newStatus: string) {
    await runMutation(() => updateRequestStatus(row.id, newStatus, row.updated_at ?? null), {
      busyRef,
      successMessage: "Statut mis à jour",
    });
  }

  return (
    <div>
      <PageHeader
        title="Demandes"
        subtitle="Toutes les demandes de rendez-vous reçues du site — temps réel"
      />

      {flash && (
        <div className="mb-4 rounded-xl bg-teal/15 border border-teal/30 text-petrol px-4 py-3 text-sm">
          {flash}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          to="/admin/demandes"
          search={{ status: "all", q } as any}
          className={pill(status === "all")}
        >
          Toutes
        </Link>
        {REQUEST_STATUSES.map((s) => (
          <Link
            key={s}
            to="/admin/demandes"
            search={{ status: s, q } as any}
            className={pill(status === s)}
          >
            {REQUEST_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-ink/50">Chargement…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune demande"
          description="Les demandes envoyées depuis le site apparaîtront ici en temps réel."
          icon={Inbox}
        />
      ) : (
        <div className="rounded-2xl bg-white border border-black/5 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_180px_180px_160px_160px_180px] gap-3 px-4 py-3 border-b border-black/5 text-[10px] uppercase tracking-wider text-ink/50">
            <div>Patient</div>
            <div>Téléphone</div>
            <div>Traitement</div>
            <div>Statut lead</div>
            <div>Reçue</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-black/5">
            {items.map((r) => (
              <div
                key={r.id}
                className="grid md:grid-cols-[1fr_180px_180px_160px_160px_180px] gap-3 px-4 py-3 items-center hover:bg-mint/20"
              >
                <Link to="/admin/demandes/$id" params={{ id: r.id }} className="min-w-0">
                  <div className="text-sm font-medium text-petrol truncate">{r.name}</div>
                  <div className="text-[11px] text-ink/50 md:hidden">{r.phone_e164}</div>
                </Link>
                <div className="text-xs text-ink/60 hidden md:block">{r.phone_e164}</div>
                <div className="text-xs text-ink/60 hidden md:block truncate">
                  {r.treatment ?? "—"}
                </div>
                <div>
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r, e.target.value)}
                    className={`text-[11px] rounded-full border px-2 py-1 ${REQUEST_STATUS_TONE[r.status] ?? ""}`}
                    aria-label="Statut lead"
                  >
                    {REQUEST_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {REQUEST_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-xs text-ink/50 hidden md:block">
                  {formatRelative(r.created_at)}
                </div>
                <div className="flex flex-wrap gap-2">
                  <CallLink phone={r.phone_e164} />
                  <WhatsAppLink
                    phone={r.phone_e164}
                    message={`Bonjour ${r.name}, Laboratoire Dr Tarfaya.`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function pill(active: boolean) {
  return `text-[11px] rounded-full px-3 py-1.5 border transition-colors ${
    active
      ? "bg-petrol text-ivory border-petrol"
      : "bg-white text-ink/70 border-black/10 hover:border-petrol/30"
  }`;
}
