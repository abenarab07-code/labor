import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminShell";
import { REQUEST_STATUS_LABELS, formatDZD } from "@/lib/admin/utils";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const from = new Date(); from.setDate(from.getDate() - 30);
      const [reqs, appts, pays, patients] = await Promise.all([
        supabase.from("appointment_requests").select("status, converted_patient_id, treatment, source_page, created_at").gte("created_at", from.toISOString()),
        supabase.from("appointments").select("status, treatment").gte("created_at", from.toISOString()),
        supabase.from("payments").select("amount").gte("paid_at", from.toISOString()),
        supabase.from("patients").select("source, lifecycle_status").gte("created_at", from.toISOString()),
      ]);
      const statusMap: Record<string, number> = {};
      (reqs.data ?? []).forEach((r) => { statusMap[r.status] = (statusMap[r.status] ?? 0) + 1; });
      const treatmentMap: Record<string, number> = {};
      (reqs.data ?? []).forEach((r) => { const t = r.treatment ?? "Sans"; treatmentMap[t] = (treatmentMap[t] ?? 0) + 1; });
      const sourceMap: Record<string, number> = {};
      (reqs.data ?? []).forEach((r) => { const s = r.source_page ?? "direct"; sourceMap[s] = (sourceMap[s] ?? 0) + 1; });
      const revenue = (pays.data ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const total = reqs.data?.length ?? 0;
      const converted = reqs.data?.filter((r: any) => r.converted_patient_id != null).length ?? 0;
      setStats({ total, converted, conversion: total ? Math.round(converted / total * 100) : 0, revenue, statusMap, treatmentMap, sourceMap, patients: patients.data?.length ?? 0, appts: appts.data?.length ?? 0 });
    }
    load();
  }, []);

  if (!stats) return <div className="text-sm text-ink/50">Chargement…</div>;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance des 30 derniers jours" />
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <Kpi l="Demandes" v={stats.total} />
        <Kpi l="Conversion" v={`${stats.conversion}%`} />
        <Kpi l="Nouveaux patients" v={stats.patients} />
        <Kpi l="Revenu" v={formatDZD(stats.revenue)} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <Chart title="Par statut" data={stats.statusMap} labelMap={REQUEST_STATUS_LABELS} />
        <Chart title="Par traitement" data={stats.treatmentMap} />
        <Chart title="Par source" data={stats.sourceMap} />
      </div>
    </div>
  );
}

function Kpi({ l, v }: { l: string; v: any }) {
  return <div className="rounded-2xl bg-white border border-black/5 p-5"><div className="text-[10px] uppercase text-ink/50">{l}</div><div className="text-2xl font-serif text-petrol mt-1">{v}</div></div>;
}

function Chart({ title, data, labelMap }: { title: string; data: Record<string, number>; labelMap?: Record<string, string> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="rounded-2xl bg-white border border-black/5 p-5">
      <h3 className="font-serif text-lg text-petrol mb-3">{title}</h3>
      <ul className="space-y-2">
        {entries.map(([k, v]) => (
          <li key={k}>
            <div className="flex justify-between text-xs mb-1"><span className="text-ink/70 truncate">{labelMap?.[k] ?? k}</span><span className="text-petrol tabular-nums">{v}</span></div>
            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden"><div className="h-full bg-teal rounded-full" style={{ width: `${(v / max) * 100}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}
