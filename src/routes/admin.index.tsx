import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { formatDZD, formatRelative, REQUEST_STATUS_LABELS, REQUEST_STATUS_TONE, APPT_STATUS_LABELS } from "@/lib/admin/utils";
import { algeriaEndOfDay, isOverdue, isDueToday } from "@/lib/admin/tz";
import {
  Inbox, Users, CalendarCheck, Clock, TrendingUp, AlertTriangle, Wallet, Activity, ArrowRight,
  Phone, ListChecks, CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Vue d'ensemble — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: OverviewPage,
});

type Kpis = {
  newRequests: number;
  toContact: number;
  todayAppts: number;
  overdueFollowUps: number;
  conversionRate: number;
  estimatedRevenue: number;
  cancelled: number;
  expectedToday: number;
  receivable: number;
  collectedMonth: number;
};

function OverviewPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [priorities, setPriorities] = useState<any[]>([]);
  const [range, setRange] = useState<"today" | "7d" | "30d">("7d");

  useEffect(() => {
    const now = new Date();
    const from = new Date(now);
    if (range === "today") from.setHours(0, 0, 0, 0);
    else from.setDate(now.getDate() - (range === "7d" ? 7 : 30));

    async function load() {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

      const [reqAll, reqNew, reqToContact, appts, follow, patientsAll, financials, paymentsAll] = await Promise.all([
        supabase.from("appointment_requests").select("id, status, converted_patient_id, created_at").gte("created_at", from.toISOString()),
        supabase.from("appointment_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("appointment_requests").select("id", { count: "exact", head: true }).in("status", ["new", "to_contact", "waiting_reply"]),
        supabase.from("appointments").select("id, starts_at, status, treatment, patient_id, patients(full_name, phone_e164)").gte("starts_at", todayStart.toISOString()).lte("starts_at", todayEnd.toISOString()).order("starts_at"),
        supabase.from("follow_up_tasks").select("id", { count: "exact", head: true }).eq("status", "open").lt("due_at", now.toISOString()),
        supabase.from("patients").select("estimated_value"),
        (supabase.from as any)("patient_financials").select("balance"),
        supabase.from("payments").select("amount, paid_at"),
      ]);

      const total = reqAll.data?.length ?? 0;
      // Conversion = demande liée à un patient (source vérité: converted_patient_id)
      const converted = reqAll.data?.filter((r) => r.converted_patient_id != null).length ?? 0;
      const estimated = (patientsAll.data ?? []).reduce((s, p) => s + Number(p.estimated_value || 0), 0);
      const receivable = (financials.data ?? []).reduce((s: number, r: any) => s + Math.max(0, Number(r.balance || 0)), 0);
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const collectedMonth = (paymentsAll.data ?? []).filter((p: any) => new Date(p.paid_at) >= monthStart).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

      setKpis({
        newRequests: reqNew.count ?? 0,
        toContact: reqToContact.count ?? 0,
        // RDV confirmés aujourd'hui — source: appointments (indépendant du lead)
        todayAppts: appts.data?.filter((a) => a.status === "confirmed").length ?? 0,
        expectedToday: appts.data?.length ?? 0,
        overdueFollowUps: follow.count ?? 0,
        conversionRate: total ? Math.round((converted / total) * 100) : 0,
        estimatedRevenue: estimated,
        cancelled: reqAll.data?.filter((r) => r.status === "lost").length ?? 0,
        receivable,
        collectedMonth,
      });
      setTodayAppts(appts.data ?? []);


      const { data: recents } = await supabase
        .from("appointment_requests")
        .select("id, name, phone_e164, treatment, status, created_at, temperature")
        .order("created_at", { ascending: false })
        .limit(6);
      setRecentRequests(recents ?? []);

      const { data: acts } = await supabase
        .from("patient_activities")
        .select("id, type, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      setActivities(acts ?? []);

      const endOfToday = algeriaEndOfDay(new Date()).toISOString();
      const { data: prio } = await supabase
        .from("follow_up_tasks")
        .select("id, title, type, due_at, priority, patient_id, patients(full_name, phone_e164)")
        .eq("status", "open")
        .lte("due_at", endOfToday)
        .order("due_at")
        .limit(8);
      setPriorities(prio ?? []);
    }
    load();

    const ch = supabase
      .channel(`overview-realtime-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointment_requests" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "follow_up_tasks" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [range]);

  const rangeLabels = { today: "Aujourd'hui", "7d": "7 jours", "30d": "30 jours" };

  return (
    <div>
      <PageHeader
        title="Vue d'ensemble"
        subtitle="Command center opérationnel de la clinique"
        actions={
          <div className="inline-flex bg-white rounded-full border border-black/5 p-1">
            {(["today", "7d", "30d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs rounded-full ${range === r ? "bg-petrol text-ivory" : "text-ink/60 hover:text-petrol"}`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={Inbox} label="Nouvelles demandes" value={kpis?.newRequests ?? "—"} tone="teal" href="/admin/demandes" />
        <KpiCard icon={Users} label="À contacter" value={kpis?.toContact ?? "—"} tone="champagne" href="/admin/demandes" />
        <KpiCard icon={CalendarCheck} label="RDV aujourd'hui" value={kpis?.todayAppts ?? "—"} tone="petrol" href="/admin/agenda" />
        <KpiCard icon={Clock} label="Attendus aujourd'hui" value={kpis?.expectedToday ?? "—"} tone="mint" href="/admin/agenda" />
        <KpiCard icon={AlertTriangle} label="Suivis en retard" value={kpis?.overdueFollowUps ?? "—"} tone="red" href="/admin/suivis" />
        <KpiCard icon={TrendingUp} label="Taux de conversion" value={kpis ? `${kpis.conversionRate}%` : "—"} tone="teal" />
        <KpiCard icon={Wallet} label="Encaissé ce mois" value={formatDZD(kpis?.collectedMonth ?? 0)} tone="petrol" href="/admin/revenus" />
        <KpiCard icon={AlertTriangle} label="Créances en cours" value={formatDZD(kpis?.receivable ?? 0)} tone="red" href="/admin/revenus" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-black/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl text-petrol">Planning du jour</h2>
              <p className="text-xs text-ink/50">Rendez-vous prévus aujourd'hui</p>
            </div>
            <Link to="/admin/agenda" className="text-xs text-teal hover:underline inline-flex items-center gap-1">
              Ouvrir l'agenda <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <EmptyState title="Aucun rendez-vous aujourd'hui" icon={CalendarCheck} />
          ) : (
            <div className="divide-y divide-black/5">
              {todayAppts.map((a) => (
                <div key={a.id} className="py-3 flex items-center gap-3">
                  <div className="w-16 text-sm font-medium text-petrol tabular-nums">
                    {new Date(a.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-petrol truncate">{a.patients?.full_name ?? "Patient"}</div>
                    <div className="text-xs text-ink/50 truncate">{a.treatment ?? "Consultation"}</div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-mint text-petrol border border-petrol/10">
                    {APPT_STATUS_LABELS[a.status] ?? a.status}
                  </span>

                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-black/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-petrol">Demandes récentes</h2>
            <Link to="/admin/demandes" search={{ status: "all", q: "" }} className="text-xs text-teal hover:underline">Toutes</Link>
          </div>
          {recentRequests.length === 0 ? (
            <EmptyState title="Aucune demande" icon={Inbox} />
          ) : (
            <div className="space-y-3">
              {recentRequests.map((r) => (
                <Link key={r.id} to="/admin/demandes/$id" params={{ id: r.id }} className="block rounded-xl border border-black/5 p-3 hover:bg-mint/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-petrol truncate">{r.name}</div>
                      <div className="text-xs text-ink/50 truncate">{r.treatment || "Sans traitement"}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${REQUEST_STATUS_TONE[r.status] ?? ""}`}>
                      {REQUEST_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink/40 mt-1">{formatRelative(r.created_at)}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-white border border-black/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-xl text-petrol">Priorités du jour</h2>
              <p className="text-xs text-ink/50">Suivis à traiter aujourd'hui ou en retard</p>
            </div>
            <Link to="/admin/suivis" search={{ tab: "overdue" }} className="text-xs text-teal hover:underline inline-flex items-center gap-1">
              Tous les suivis <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {priorities.length === 0 ? (
            <EmptyState title="Aucune priorité — tout est à jour." icon={CheckCircle} />
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {priorities.map((p) => {
                const overdue = isOverdue(p.due_at);
                const today = isDueToday(p.due_at);
                return (
                  <div key={p.id} className="rounded-xl border border-black/5 bg-mint/20 hover:bg-mint/40 p-3 flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${overdue ? "bg-red-100 text-red-600" : "bg-teal/15 text-teal"}`}>
                      <ListChecks className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-petrol truncate">{p.title}</div>
                      <div className="text-[11px] text-ink/60 mt-0.5 truncate">
                        {p.patients?.full_name && p.patient_id ? (
                          <Link to="/admin/patients/$id" params={{ id: p.patient_id }} className="text-teal hover:underline">{p.patients.full_name}</Link>
                        ) : "—"}
                        {p.patients?.phone_e164 && <> · <a href={`tel:${p.patients.phone_e164}`} className="hover:text-petrol"><Phone className="inline h-3 w-3" /></a></>}
                      </div>
                      <div className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full ${overdue ? "bg-red-100 text-red-600" : today ? "bg-champagne/30 text-[#8a7a3f]" : "bg-mint text-petrol"}`}>
                        {p.due_at ? formatRelative(p.due_at) : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-white border border-black/5 p-5">
          <div className="flex items-center justify-between mb-4">

            <h2 className="font-serif text-xl text-petrol">Activité récente</h2>
            <Link to="/admin/activite" className="text-xs text-teal hover:underline">Centre complet</Link>
          </div>
          {activities.length === 0 ? (
            <EmptyState title="Aucune activité pour l'instant" icon={Activity} />
          ) : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <li key={a.id} className="text-sm flex items-start gap-3 py-2 border-b border-black/5 last:border-0">
                  <div className="h-2 w-2 rounded-full bg-teal mt-1.5" />
                  <div className="flex-1">
                    <div className="text-petrol">{a.summary}</div>
                    <div className="text-[10px] text-ink/40 uppercase tracking-wide">{a.type} · {formatRelative(a.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone, href }: { icon: any; label: string; value: any; tone: string; href?: string }) {
  const tones: Record<string, string> = {
    teal: "bg-teal/10 text-teal",
    petrol: "bg-petrol/10 text-petrol",
    champagne: "bg-champagne/20 text-[#8a7a3f]",
    mint: "bg-mint text-petrol",
    red: "bg-red-100 text-red-600",
    neutral: "bg-neutral-100 text-neutral-500",
  };
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white border border-black/5 p-4 h-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-serif text-petrol tabular-nums">{value}</div>
      <div className="text-xs text-ink/60 mt-1">{label}</div>
    </motion.div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}
