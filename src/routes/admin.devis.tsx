import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { formatDZD, formatDate, formatRelative } from "@/lib/admin/utils";
import { FileText, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONE } from "@/lib/admin/quotes";
import { runMutation } from "@/lib/admin/mutation-utils";
import { useAdminAuth } from "@/lib/admin/auth";
import { toast } from "sonner";
import { QuoteDrawer, NewQuoteModal, generateQuoteFollowups } from "@/components/admin/QuoteWorkbench";

export const Route = createFileRoute("/admin/devis")({
  head: () => ({ meta: [{ title: "Devis — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ open: typeof s.open === "string" ? s.open : undefined }),
  component: DevisPage,
});

type Row = any;
type View = "all" | "draft" | "sent" | "negotiating" | "accepted" | "refused" | "expired";

const VIEWS: { key: View; label: string; statuses: string[] }[] = [
  { key: "all", label: "Tous", statuses: [] },
  { key: "draft", label: "Brouillons", statuses: ["draft"] },
  { key: "sent", label: "Envoyés", statuses: ["sent", "viewed"] },
  { key: "negotiating", label: "En discussion", statuses: ["negotiating"] },
  { key: "accepted", label: "Acceptés", statuses: ["accepted"] },
  { key: "refused", label: "Refusés", statuses: ["refused"] },
  { key: "expired", label: "Expirés", statuses: ["expired"] },
];

function DevisPage() {
  const auth = useAdminAuth();
  const search = Route.useSearch();
  const [view, setView] = useState<View>("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(search.open ?? null);
  const [creating, setCreating] = useState(false);
  const [filterSheet, setFilterSheet] = useState(false);
  useEffect(() => { if (search.open) setOpenId(search.open); }, [search.open]);

  async function load() {
    setLoading(true);
    let query = supabase
      .from("quotes")
      .select("id, quote_number, reference, title, status, final_amount, discount, amount, expires_at, created_at, updated_at, sent_at, accepted_at, patient_id, patient_treatment_id, assigned_to, patients(full_name, phone_e164)")
      .order("created_at", { ascending: false })
      .limit(200);
    const statuses = VIEWS.find((v) => v.key === view)?.statuses ?? [];
    if (statuses.length) query = query.in("status", statuses);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [view]);
  useEffect(() => {
    const ch = supabase.channel(`devis-live-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      const ref = (r.quote_number || r.reference || "").toLowerCase();
      const name = (r.patients?.full_name || "").toLowerCase();
      const phone = (r.patients?.phone_e164 || "").toLowerCase();
      return ref.includes(t) || name.includes(t) || phone.includes(t);
    });
  }, [rows, q]);

  const canWrite = auth.roles.includes("admin") || auth.roles.includes("reception");

  async function onGenerateFollowups() {
    const r = await runMutation(() => generateQuoteFollowups(), { successMessage: "Relances générées" });
    if (r.ok) toast.success(`${r.data} suivi(s) créé(s)`);
  }

  return (
    <div>
      <PageHeader
        title="Devis"
        subtitle="Propositions commerciales, suivi et acceptation"
        actions={canWrite && (
          <>
            <button onClick={onGenerateFollowups} className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-3 py-2 text-xs text-petrol hover:bg-mint">
              Générer relances
            </button>
            <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink">
              <Plus className="h-4 w-4" /> Nouveau devis
            </button>
          </>
        )}
      />

      {/* Desktop filter pills */}
      <div className="hidden sm:flex flex-wrap gap-2 mb-3">
        {VIEWS.map((v) => (
          <button key={v.key} onClick={() => setView(v.key)}
            className={`text-[11px] rounded-full px-3 py-1.5 border ${view === v.key ? "bg-petrol text-ivory border-petrol" : "bg-white border-black/10 text-ink/70"}`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Mobile: filter sheet trigger + current view chip */}
      <div className="sm:hidden mb-3 flex items-center gap-2">
        <button onClick={() => setFilterSheet(true)} className="inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-3 py-1.5 text-xs text-petrol">
          <SlidersHorizontal className="h-3 w-3" /> {VIEWS.find((v) => v.key === view)?.label}
        </button>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° devis, patient, téléphone…"
          className="w-full pl-9 pr-3 py-2 rounded-full border border-black/10 bg-white text-sm outline-none focus:border-teal" />
      </div>

      {loading ? (
        <div className="text-sm text-ink/50">Chargement…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucun devis"
          description={canWrite ? "Créez un premier devis pour un patient." : "Aucun devis pour l'instant."}
          icon={FileText}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl bg-white border border-black/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-ink/50 border-b border-black/5">
                <tr>
                  <th className="text-left px-4 py-3">N°</th>
                  <th className="text-left">Patient</th>
                  <th className="text-left">Créé</th>
                  <th className="text-left">Validité</th>
                  <th className="text-right px-2">Montant</th>
                  <th className="text-left px-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => setOpenId(r.id)} className="border-t border-black/5 hover:bg-mint/30 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-petrol">{r.quote_number || r.reference || r.id.slice(0, 8)}</td>
                    <td className="text-petrol">{r.patients?.full_name ?? "—"}</td>
                    <td className="text-ink/60">{formatRelative(r.created_at)}</td>
                    <td className="text-ink/60">{r.expires_at ? formatDate(r.expires_at) : "—"}</td>
                    <td className="text-right px-2 text-petrol tabular-nums">{formatDZD(Number(r.final_amount))}</td>
                    <td className="px-4">
                      <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border ${QUOTE_STATUS_TONE[r.status] || ""}`}>
                        {QUOTE_STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filtered.map((r) => (
              <button key={r.id} onClick={() => setOpenId(r.id)} className="w-full text-left rounded-2xl bg-white border border-black/5 p-3 active:bg-mint/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-petrol font-medium truncate">{r.patients?.full_name ?? "—"}</div>
                    <div className="font-mono text-[10px] text-ink/50 truncate">{r.quote_number || r.reference}</div>
                  </div>
                  <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${QUOTE_STATUS_TONE[r.status] || ""}`}>
                    {QUOTE_STATUS_LABELS[r.status] || r.status}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div className="text-[10px] text-ink/50">{formatRelative(r.created_at)}{r.expires_at ? ` · valide ${formatDate(r.expires_at)}` : ""}</div>
                  <div className="font-serif text-lg text-petrol tabular-nums">{formatDZD(Number(r.final_amount))}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {openId && <QuoteDrawer id={openId} onClose={() => { setOpenId(null); load(); }} canWrite={canWrite} />}
      {creating && <NewQuoteModal onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setOpenId(id); load(); }} />}

      {/* Mobile filter bottom sheet */}
      {filterSheet && (
        <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setFilterSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-4 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-serif text-lg text-petrol">Filtrer</div>
              <button onClick={() => setFilterSheet(false)} className="p-1 text-ink/50"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {VIEWS.map((v) => (
                <button key={v.key} onClick={() => { setView(v.key); setFilterSheet(false); }}
                  className={`text-sm rounded-xl px-3 py-2 border text-left ${view === v.key ? "bg-petrol text-ivory border-petrol" : "bg-white border-black/10 text-ink/70"}`}>
                  {v.label}
                </button>
              ))}
            </div>
            {canWrite && (
              <button onClick={() => { onGenerateFollowups(); setFilterSheet(false); }} className="mt-3 w-full rounded-xl border border-black/10 py-2 text-sm text-petrol">
                Générer relances devis
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
