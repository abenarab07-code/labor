import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { formatDZD, formatDateTime } from "@/lib/admin/utils";
import { Wallet, Download, Plus } from "lucide-react";
import { RequireAdmin } from "@/components/admin/RequireRole";
import { fetchRevenueKpis, PAYMENT_METHOD_LABELS } from "@/lib/admin/payments";
import { PaymentModal } from "@/components/admin/PaymentModal";

export const Route = createFileRoute("/admin/revenus")({
  head: () => ({ meta: [{ title: "Revenus — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAdmin>
      <RevenusPage />
    </RequireAdmin>
  ),
});

type Period = "today" | "7d" | "30d" | "month" | "year" | "all";

function periodRange(p: Period): { from: Date | null; to: Date | null } {
  const now = new Date();
  if (p === "today") return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()), to: now };
  if (p === "7d") return { from: new Date(Date.now() - 7 * 86400000), to: now };
  if (p === "30d") return { from: new Date(Date.now() - 30 * 86400000), to: now };
  if (p === "month") return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  if (p === "year") return { from: new Date(now.getFullYear(), 0, 1), to: now };
  return { from: null, to: null };
}

function RevenusPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [patients, setPatients] = useState<any[]>([]);
  const [payOpen, setPayOpen] = useState<{ patientId: string } | null>(null);

  async function loadKpis() {
    const r = periodRange(period);
    try { setKpis(await fetchRevenueKpis(r.from, r.to)); } catch (e: any) { /* silent */ }
  }
  async function loadPayments() {
    const { data } = await supabase
      .from("payments")
      .select("id, amount, method, paid_at, note, payment_reference, patient_id, quote_id, patients(full_name), quotes(quote_number)")
      .order("paid_at", { ascending: false })
      .limit(500);
    setPayments(data ?? []);
  }
  useEffect(() => {
    loadKpis(); loadPayments();
    supabase.from("patients").select("id, full_name").order("full_name").limit(500).then(({ data }) => setPatients(data ?? []));
    const ch = supabase.channel(`revenus-live-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => { loadKpis(); loadPayments(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, () => { loadKpis(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [period]);

  const filtered = useMemo(() => {
    const { from } = periodRange(period);
    if (!from) return payments;
    return payments.filter((p) => new Date(p.paid_at) >= from);
  }, [payments, period]);

  function exportCSV() {
    const rows = [["Date", "Patient", "Devis", "Méthode", "Référence", "Note", "Montant DZD"]];
    filtered.forEach((p) => rows.push([
      new Date(p.paid_at).toISOString(),
      p.patients?.full_name ?? "",
      p.quotes?.quote_number ?? "",
      p.method ?? "",
      p.payment_reference ?? "",
      (p.note ?? "").replace(/[\r\n]+/g, " "),
      String(p.amount ?? 0),
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `revenus-${period}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Revenus"
        subtitle="Encaissements, soldes restants et performance financière"
        actions={
          <>
            <select onChange={(e) => { const id = e.target.value; if (id) setPayOpen({ patientId: id }); e.currentTarget.value = ""; }}
              className="text-sm rounded-full border border-black/10 bg-white px-3 py-2">
              <option value="">＋ Enregistrer un paiement</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-4 py-2 text-sm text-petrol hover:bg-mint">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </>
        }
      />

      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Encaissé aujourd'hui" value={kpis?.collected_today} />
        <Kpi label="Encaissé (période)" value={kpis?.collected_period} tone="teal" />
        <Kpi label="Valeur devis acceptés" value={kpis?.accepted_value} tone="champagne" />
        <Kpi label="Soldes restants" value={kpis?.outstanding} tone="red" />
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl bg-white border border-black/5 p-4">
          <div className="text-[10px] uppercase text-ink/50 mb-2">Taux d'acceptation</div>
          <div className="text-2xl font-serif text-petrol">{kpis?.acceptance_rate ?? 0}%</div>
          <div className="text-xs text-ink/50">{kpis?.accepted_count ?? 0} acceptés / {kpis?.sent_count ?? 0} envoyés</div>
        </div>
        <div className="md:col-span-2 rounded-2xl bg-white border border-black/5 p-4">
          <div className="text-[10px] uppercase text-ink/50 mb-2">Par méthode (période)</div>
          <div className="flex flex-wrap gap-2">
            {(kpis?.by_method ?? []).length === 0 && <div className="text-sm text-ink/50">—</div>}
            {(kpis?.by_method ?? []).map((m: any) => (
              <div key={m.method} className="rounded-lg bg-mint/50 px-3 py-1.5 text-sm text-petrol">
                {PAYMENT_METHOD_LABELS[m.method] ?? m.method} · <b className="tabular-nums">{formatDZD(Number(m.total))}</b>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["today", "7d", "30d", "month", "year", "all"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`text-[11px] rounded-full px-3 py-1.5 border ${period === p ? "bg-petrol text-ivory border-petrol" : "bg-white border-black/10 text-ink/70"}`}>
            {p === "today" ? "Aujourd'hui" : p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : p === "month" ? "Ce mois" : p === "year" ? "Année" : "Tout"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun paiement pour cette période"
          description="Enregistrez un paiement depuis un devis accepté ou depuis un patient."
          icon={Wallet}
        />
      ) : (
        <>
          <div className="hidden md:block rounded-2xl bg-white border border-black/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-ink/50 border-b border-black/5">
                <tr><th className="text-left px-4 py-3">Date</th><th className="text-left">Patient</th><th className="text-left">Devis</th><th className="text-left">Méthode</th><th className="text-right px-4">Montant</th></tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-black/5">
                    <td className="px-4 py-3">{formatDateTime(p.paid_at)}</td>
                    <td className="text-petrol">{p.patients?.full_name ?? "—"}</td>
                    <td className="text-ink/60 font-mono text-xs">{p.quotes?.quote_number ?? "—"}</td>
                    <td>{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</td>
                    <td className="text-right px-4 text-petrol tabular-nums">{formatDZD(Number(p.amount))}</td>
                  </tr>
                ))}
                <tr className="border-t border-black/10 font-medium">
                  <td className="px-4 py-3">Total période</td><td colSpan={3}></td>
                  <td className="text-right px-4 text-emerald-700 tabular-nums">{formatDZD(filtered.reduce((s, p) => s + Number(p.amount || 0), 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-2xl bg-white border border-black/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-petrol truncate">{p.patients?.full_name ?? "—"}</div>
                    <div className="text-[10px] text-ink/50">{formatDateTime(p.paid_at)}</div>
                  </div>
                  <div className="text-petrol font-serif text-lg tabular-nums shrink-0">{formatDZD(Number(p.amount))}</div>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="rounded-full bg-mint/60 text-petrol px-2 py-0.5">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</span>
                  {p.quotes?.quote_number && <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono">{p.quotes.quote_number}</span>}
                </div>
              </div>
            ))}
            <div className="text-right text-sm text-emerald-700 tabular-nums pt-2">
              Total période : <b>{formatDZD(filtered.reduce((s, p) => s + Number(p.amount || 0), 0))}</b>
            </div>
          </div>
        </>
      )}

      {payOpen && (
        <PaymentModal patientId={payOpen.patientId} onClose={() => setPayOpen(null)} onDone={() => { setPayOpen(null); loadKpis(); loadPayments(); }} />
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | undefined; tone?: "teal" | "champagne" | "red" }) {
  const cls = tone === "red" ? "text-red-600" : tone === "champagne" ? "text-[#8a7a3f]" : "text-petrol";
  return (
    <div className="rounded-2xl bg-white border border-black/5 p-5">
      <div className="text-[10px] uppercase text-ink/50">{label}</div>
      <div className={`text-2xl font-serif mt-1 tabular-nums ${cls}`}>{formatDZD(Number(value ?? 0))}</div>
    </div>
  );
}
