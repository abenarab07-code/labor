import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, CallLink, WhatsAppLink } from "@/components/admin/AdminShell";
import { APPT_STATUS_LABELS, APPT_STATUS_TONE, formatDateTime, initials } from "@/lib/admin/utils";
import { ChevronLeft, ChevronRight, CalendarPlus, Calendar, X, AlertTriangle, Clock, User, Stethoscope, History } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { algeriaStartOfDay, algeriaEndOfDay, fromLocalInput, toLocalInput } from "@/lib/admin/tz";
import {
  changeAppointmentStatus, rescheduleAppointment, cancelAppointment, markNoShowWithCallback,
  setAppointmentConfirmation, setAppointmentPractitioner,
  findConflicts, isWithinWorkingHours,
  CONFIRMATION_LABELS, CONFIRMATION_DOT, type ApptStatus, type ConfirmationStatus,
} from "@/lib/admin/appointments";
import { runMutation } from "@/lib/admin/mutation-utils";
import { useAdminAuth } from "@/lib/admin/auth";
import { canOverrideAppointmentRules } from "@/lib/admin/permissions";

export const Route = createFileRoute("/admin/agenda")({
  head: () => ({ meta: [{ title: "Agenda — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: AgendaPage,
});

type View = "day" | "week" | "month" | "practitioner";

function startOfWeek(d: Date) {
  const c = new Date(d);
  const day = (c.getDay() + 6) % 7;
  c.setDate(c.getDate() - day);
  c.setHours(0, 0, 0, 0);
  return c;
}

function AgendaPage() {
  const isMobile = useIsMobile();
  const [anchor, setAnchor] = useState(new Date());
  const [items, setItems] = useState<any[]>([]);
  const [view, setView] = useState<View>(isMobile ? "day" : "week");
  const [showNew, setShowNew] = useState(false);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => { if (isMobile) setView("day"); }, [isMobile]);

  const range = useMemo(() => {
    if (view === "month") {
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
      return { start, end };
    }
    if (view === "day") {
      return { start: algeriaStartOfDay(anchor), end: algeriaEndOfDay(anchor) };
    }
    const start = startOfWeek(anchor);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return { start, end };
  }, [anchor, view]);

  useEffect(() => {
    supabase.from("staff_profiles").select("id, user_id, full_name, color, job_title").eq("is_active", true).then(({ data }) => setStaff(data ?? []));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase.from("appointments")
        .select("id, starts_at, ends_at, status, treatment, notes, patient_id, practitioner_id, confirmation_status, assigned_to, cancellation_reason, patients(full_name, phone_e164)")
        .gte("starts_at", range.start.toISOString()).lt("starts_at", range.end.toISOString())
        .order("starts_at");
      if (error) toast.error(error.message);
      if (!cancelled) setItems(data ?? []);
    }
    load();
    const ch = supabase.channel(`agenda-${range.start.toISOString()}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, load).subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [range.start.getTime(), range.end.getTime()]);

  function shift(dir: 1 | -1) {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + 7 * dir);
    else if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir);
    setAnchor(d);
  }

  const staffByUserId = useMemo(() => new Map(staff.map((s) => [s.user_id, s])), [staff]);
  const staffById = useMemo(() => new Map(staff.map((s) => [s.id, s])), [staff]);

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle="Planification opérationnelle"
        actions={
          <div className="flex flex-wrap gap-2 items-center">
            <div className="inline-flex bg-white rounded-full border border-black/5 p-1 text-xs">
              {(["day", "week", "month", "practitioner"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-full ${view === v ? "bg-petrol text-ivory" : "text-ink/60"}`}>
                  {v === "day" ? "Jour" : v === "week" ? "Semaine" : v === "month" ? "Mois" : "Praticien"}
                </button>
              ))}
            </div>
            <div className="inline-flex gap-1">
              <button onClick={() => shift(-1)} className="p-2 rounded-lg bg-white border border-black/5"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setAnchor(new Date())} className="px-3 rounded-lg bg-white border border-black/5 text-xs">Aujourd'hui</button>
              <button onClick={() => shift(1)} className="p-2 rounded-lg bg-white border border-black/5"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink">
              <CalendarPlus className="h-4 w-4" /> Nouveau RDV
            </button>
          </div>
        }
      />

      {view === "practitioner" ? (
        <PractitionerView items={items} staff={staff} onOpen={setDrawerId} range={range} />
      ) : view === "month" ? (
        <MonthView anchor={anchor} items={items} onOpen={setDrawerId} />
      ) : (
        <DayWeekView view={view} range={range} items={items} staffByUserId={staffByUserId} onOpen={setDrawerId} />
      )}

      {items.length === 0 && <div className="mt-6"><EmptyState title="Aucun rendez-vous" icon={Calendar} /></div>}

      {showNew && <AppointmentModal onClose={() => setShowNew(false)} staff={staff} initialStart={anchor} />}
      {drawerId && <AppointmentDrawer id={drawerId} onClose={() => setDrawerId(null)} staff={staff} staffById={staffById} />}
    </div>
  );
}

function DayWeekView({ view, range, items, staffByUserId, onOpen }: any) {
  const days = view === "week"
    ? Array.from({ length: 7 }, (_, i) => { const d = new Date(range.start); d.setDate(range.start.getDate() + i); return d; })
    : [range.start];
  return (
    <div className={`grid gap-3 ${view === "week" ? "grid-cols-1 md:grid-cols-7" : "grid-cols-1"}`}>
      {days.map((d: Date) => {
        const dayItems = items.filter((i: any) => new Date(i.starts_at).toDateString() === d.toDateString());
        const isToday = d.toDateString() === new Date().toDateString();
        return (
          <div key={d.toISOString()} className={`rounded-2xl bg-white border ${isToday ? "border-teal/40" : "border-black/5"} p-3 min-h-[240px]`}>
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink/50">{d.toLocaleDateString("fr-FR", { weekday: "short" })}</div>
                <div className={`font-serif text-lg ${isToday ? "text-teal" : "text-petrol"}`}>{d.getDate()}</div>
              </div>
              <div className="text-[10px] text-ink/40">{dayItems.length} RDV</div>
            </div>
            {dayItems.length === 0 ? (
              <div className="text-xs text-ink/40 italic">—</div>
            ) : (
              <div className="space-y-2">
                {dayItems.map((a: any) => (
                  <AppointmentCard key={a.id} appt={a} staffByUserId={staffByUserId} onOpen={() => onOpen(a.id)} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ anchor, items, onOpen }: any) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(anchor.getFullYear(), anchor.getMonth(), d));
  return (
    <div className="rounded-2xl bg-white border border-black/5 p-3">
      <div className="grid grid-cols-7 gap-2 text-[10px] uppercase text-ink/50 mb-2">
        {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => <div key={d} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {cells.map((c, idx) => {
          if (!c) return <div key={idx} />;
          const dayItems = items.filter((i: any) => new Date(i.starts_at).toDateString() === c.toDateString());
          const isToday = c.toDateString() === new Date().toDateString();
          return (
            <div key={idx} className={`min-h-[80px] rounded-xl border p-2 text-[11px] ${isToday ? "border-teal/40 bg-teal/5" : "border-black/5"}`}>
              <div className={`font-serif ${isToday ? "text-teal" : "text-petrol"}`}>{c.getDate()}</div>
              <div className="mt-1 space-y-1">
                {dayItems.slice(0, 3).map((a: any) => (
                  <button key={a.id} onClick={() => onOpen(a.id)} className="w-full text-left truncate rounded bg-mint/40 px-1.5 py-0.5 hover:bg-mint">
                    {new Date(a.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} {a.patients?.full_name ?? "—"}
                  </button>
                ))}
                {dayItems.length > 3 && <div className="text-ink/50">+{dayItems.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PractitionerView({ items, staff, onOpen, range }: any) {
  const cols = staff.length ? staff : [{ id: null, user_id: null, full_name: "Non assigné", color: "#94a3b8" }];
  return (
    <div className="overflow-x-auto">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(220px, 1fr))` }}>
        {cols.map((s: any) => {
          const own = items.filter((i: any) => i.practitioner_id === s.user_id);
          return (
            <div key={s.id ?? "none"} className="rounded-2xl bg-white border border-black/5 p-3 min-h-[240px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium text-ivory" style={{ background: s.color ?? "#00A99D" }}>{initials(s.full_name)}</div>
                <div>
                  <div className="text-sm text-petrol font-medium">{s.full_name}</div>
                  <div className="text-[10px] text-ink/50">{own.length} RDV · {range.start.toLocaleDateString("fr-FR")}</div>
                </div>
              </div>
              {own.length === 0 ? <div className="text-xs text-ink/40 italic">—</div> : (
                <div className="space-y-2">{own.map((a: any) => <AppointmentCard key={a.id} appt={a} staffByUserId={new Map()} onOpen={() => onOpen(a.id)} />)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentCard({ appt, staffByUserId, onOpen }: { appt: any; staffByUserId: Map<string, any>; onOpen: () => void }) {
  const prac = appt.practitioner_id ? staffByUserId.get(appt.practitioner_id) : null;
  const conf = (appt.confirmation_status ?? "unconfirmed") as ConfirmationStatus;
  const durMin = Math.round((new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime()) / 60000);
  return (
    <button onClick={onOpen} className="w-full text-left rounded-xl border border-black/5 bg-mint/30 p-2 hover:bg-mint">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${CONFIRMATION_DOT[conf]}`} title={CONFIRMATION_LABELS[conf]} />
        <div className="text-[11px] font-medium text-petrol">{new Date(appt.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
        <div className="text-[10px] text-ink/40 ml-auto">{durMin}′</div>
      </div>
      <div className="text-xs text-petrol truncate mt-0.5">{appt.patients?.full_name ?? "Sans patient"}</div>
      <div className="text-[10px] text-ink/50 truncate">{appt.treatment ?? "Consultation"}</div>
      <div className="flex items-center justify-between gap-1 mt-1">
        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full border ${APPT_STATUS_TONE[appt.status] ?? ""}`}>{APPT_STATUS_LABELS[appt.status] ?? appt.status}</span>
        {prac && <span className="text-[9px] text-ink/50">{initials(prac.full_name)}</span>}
      </div>
    </button>
  );
}

const NEXT_PRIMARY: Partial<Record<ApptStatus, { next: ApptStatus; label: string }>> = {
  tentative: { next: "confirmed", label: "Confirmer" },
  confirmed: { next: "arrived", label: "Marquer arrivé" },
  arrived: { next: "in_consultation", label: "Démarrer la consultation" },
  waiting: { next: "in_consultation", label: "Démarrer la consultation" },
  in_consultation: { next: "completed", label: "Terminer" },
};

const SECONDARY_STATUSES: Array<[ApptStatus, string]> = [
  ["confirmed", "Confirmer"],
  ["arrived", "Marquer arrivé"],
  ["waiting", "Mettre en attente"],
  ["in_consultation", "Démarrer"],
  ["completed", "Terminer"],
];

function AppointmentDrawer({ id, onClose, staff, staffById }: { id: string; onClose: () => void; staff: any[]; staffById: Map<string, any> }) {
  const auth = useAdminAuth();
  const [appt, setAppt] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showNoShow, setShowNoShow] = useState(false);
  const busyRef = useRef(false);

  async function reload() {
    const { data: a } = await supabase.from("appointments")
      .select("*, patients(id, full_name, phone_e164)")
      .eq("id", id).maybeSingle();
    setAppt(a);
    const { data: e } = await supabase.from("appointment_events").select("*").eq("appointment_id", id).order("created_at", { ascending: false });
    setEvents(e ?? []);
    const { data: t } = await supabase.from("follow_up_tasks").select("id, title, status, due_at").eq("appointment_id", id).order("due_at");
    setTasks(t ?? []);
  }

  useEffect(() => { reload(); }, [id]);

  async function quickStatus(next: ApptStatus) {
    if (!appt) return;
    const res = await runMutation(async () => {
      if (next === "no_show") await markNoShowWithCallback(id, appt.updated_at);
      else await changeAppointmentStatus(id, next, undefined, appt.updated_at);
    }, { busyRef, successMessage: `Statut → ${APPT_STATUS_LABELS[next]}` });
    if (res.ok) reload(); else reload();
  }

  async function setConfirmation(next: ConfirmationStatus) {
    if (!appt) return;
    const res = await runMutation(
      () => setAppointmentConfirmation(id, next, appt.updated_at),
      { busyRef, successMessage: CONFIRMATION_LABELS[next] },
    );
    if (res.ok) reload(); else reload();
  }

  async function setPractitioner(userId: string | null) {
    if (!appt) return;
    const res = await runMutation(
      () => setAppointmentPractitioner(id, userId, appt.updated_at),
      { busyRef },
    );
    if (res.ok) reload(); else reload();
  }

  if (!appt) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 text-sm">Chargement…</div>
    </div>
  );

  const prac = appt.practitioner_id ? staffByUserId(staff, appt.practitioner_id) : null;
  const patientPhone = appt.patients?.phone_e164;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside className="w-full max-w-md h-full bg-[#faf9f5] shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#faf9f5]/90 backdrop-blur border-b border-black/5 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-serif text-xl text-petrol">{appt.patients?.full_name ?? "Sans patient"}</div>
            <div className="text-xs text-ink/60">{formatDateTime(appt.starts_at)}</div>
          </div>
          <button onClick={onClose} className="text-ink/60 p-1"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`text-[11px] px-2 py-1 rounded-full border ${APPT_STATUS_TONE[appt.status] ?? ""}`}>{APPT_STATUS_LABELS[appt.status] ?? appt.status}</span>
            <span className={`text-[11px] px-2 py-1 rounded-full border border-black/10 bg-white text-ink/70`}>{CONFIRMATION_LABELS[(appt.confirmation_status ?? "unconfirmed") as ConfirmationStatus]}</span>
          </div>

          <dl className="text-sm grid grid-cols-3 gap-y-2">
            <dt className="text-ink/50 col-span-1 flex items-center gap-1"><Stethoscope className="h-3 w-3" />Traitement</dt><dd className="col-span-2 text-petrol">{appt.treatment ?? "—"}</dd>
            <dt className="text-ink/50 col-span-1 flex items-center gap-1"><Clock className="h-3 w-3" />Fin</dt><dd className="col-span-2 text-petrol">{new Date(appt.ends_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</dd>
            <dt className="text-ink/50 col-span-1 flex items-center gap-1"><User className="h-3 w-3" />Praticien</dt>
            <dd className="col-span-2">
              <select value={appt.practitioner_id ?? ""} onChange={(e) => setPractitioner(e.target.value || null)} className="text-sm rounded-lg border border-black/10 px-2 py-1 bg-white">
                <option value="">Non assigné</option>
                {staff.map((s: any) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
              </select>
            </dd>
          </dl>

          {(patientPhone) && (
            <div className="flex gap-2">
              <CallLink phone={patientPhone} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white border border-black/10 text-petrol" />
              <WhatsAppLink phone={patientPhone} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white border border-black/10 text-teal" />
              {appt.patient_id && <Link to="/admin/patients/$id" params={{ id: appt.patient_id }} className="text-xs px-3 py-1.5 rounded-full bg-petrol text-ivory">Ouvrir patient</Link>}
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase text-ink/50 mb-2">Statut confirmation</div>
            <div className="flex flex-wrap gap-1.5">
              {(["unconfirmed","sent","confirmed","declined"] as ConfirmationStatus[]).map((c) => (
                <button key={c} onClick={() => setConfirmation(c)} className={`text-[11px] px-2 py-1 rounded-full border ${appt.confirmation_status === c ? "bg-petrol text-ivory border-petrol" : "bg-white border-black/10 text-ink/70"}`}>{CONFIRMATION_LABELS[c]}</button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase text-ink/50 mb-2">Action recommandée</div>
            {(() => {
              const primary = NEXT_PRIMARY[appt.status as ApptStatus];
              return primary ? (
                <button
                  disabled={busyRef.current}
                  onClick={() => quickStatus(primary.next)}
                  className="w-full rounded-xl bg-petrol text-ivory px-4 py-2.5 text-sm font-medium hover:bg-ink disabled:opacity-50"
                >
                  {primary.label}
                </button>
              ) : (
                <div className="text-xs text-ink/50 italic px-1">Aucune action clinique restante.</div>
              );
            })()}
          </div>

          <div>
            <div className="text-[10px] uppercase text-ink/50 mb-2">Autres statuts</div>
            <div className="grid grid-cols-2 gap-1.5">
              {SECONDARY_STATUSES
                .filter(([s]) => s !== NEXT_PRIMARY[appt.status as ApptStatus]?.next && s !== appt.status)
                .map(([s, l]) => (
                  <button key={s} disabled={busyRef.current} onClick={() => quickStatus(s)} className="text-xs px-3 py-2 rounded-lg bg-white border border-black/10 hover:bg-mint/40 text-petrol disabled:opacity-50">{l}</button>
              ))}
              <button disabled={busyRef.current} onClick={() => setShowReschedule(true)} className="text-xs px-3 py-2 rounded-lg bg-white border border-black/10 hover:bg-mint/40 text-petrol disabled:opacity-50">Reporter</button>
              <button disabled={busyRef.current} onClick={() => setShowCancel(true)} className="text-xs px-3 py-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 disabled:opacity-50">Annuler</button>
              <button disabled={busyRef.current} onClick={() => setShowNoShow(true)} className="text-xs px-3 py-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 col-span-2 disabled:opacity-50">Non présenté (+ rappel)</button>
            </div>
          </div>


          {appt.cancellation_reason && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-700">
              <div className="font-medium">Annulé par {appt.cancelled_by ?? "—"}</div>
              <div className="mt-0.5">{appt.cancellation_reason}</div>
            </div>
          )}

          {appt.notes && (
            <div className="rounded-xl bg-white border border-black/5 p-3 text-sm text-ink/80">
              <div className="text-[10px] uppercase text-ink/50 mb-1">Note administrative</div>
              {appt.notes}
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase text-ink/50 mb-2 flex items-center gap-1"><History className="h-3 w-3" />Historique</div>
            {events.length === 0 ? <div className="text-xs text-ink/40 italic">Aucun événement</div> : (
              <ol className="space-y-1.5 text-xs">
                {events.map((e) => (
                  <li key={e.id} className="rounded-lg bg-white border border-black/5 px-3 py-1.5">
                    <div className="text-petrol">
                      {e.event_type === "status_change" ? `Statut : ${APPT_STATUS_LABELS[e.from_status] ?? e.from_status} → ${APPT_STATUS_LABELS[e.to_status] ?? e.to_status}` :
                       e.event_type === "created" ? `Créé (${APPT_STATUS_LABELS[e.to_status] ?? e.to_status})` :
                       e.event_type === "rescheduled" ? "Reporté" : e.event_type}
                    </div>
                    <div className="text-[10px] text-ink/50">{formatDateTime(e.created_at)}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {tasks.length > 0 && (
            <div>
              <div className="text-[10px] uppercase text-ink/50 mb-2">Suivis liés</div>
              <div className="space-y-1.5">
                {tasks.map((t) => (
                  <div key={t.id} className="rounded-lg bg-white border border-black/5 px-3 py-1.5 text-xs flex justify-between">
                    <span className="text-petrol">{t.title}</span>
                    <span className="text-ink/50">{t.due_at ? formatDateTime(t.due_at) : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showReschedule && <RescheduleModal apptId={id} current={{ starts_at: appt.starts_at, ends_at: appt.ends_at, practitioner_id: appt.practitioner_id, patient_id: appt.patient_id }} onClose={() => { setShowReschedule(false); reload(); }} canOverride={canOverrideAppointmentRules(auth)} />}
        {showCancel && <CancelModal apptId={id} onClose={() => { setShowCancel(false); reload(); }} />}
        {showNoShow && (
          <ConfirmDialog
            title="Marquer comme non présenté ?"
            body={`Le patient ${appt.patients?.full_name ?? ""} sera marqué non présenté et un rappel sera créé automatiquement.`}
            confirmLabel="Confirmer non présenté"
            danger
            onCancel={() => setShowNoShow(false)}
            onConfirm={async () => { setShowNoShow(false); await quickStatus("no_show"); }}
          />
        )}
      </aside>
    </div>
  );
}

function staffByUserId(staff: any[], userId: string) {
  return staff.find((s) => s.user_id === userId) ?? null;
}

function RescheduleModal({ apptId, current, onClose, canOverride }: { apptId: string; current: any; onClose: () => void; canOverride: boolean }) {
  const [start, setStart] = useState(toLocalInput(new Date(current.starts_at)));
  const [duration, setDuration] = useState(Math.round((new Date(current.ends_at).getTime() - new Date(current.starts_at).getTime()) / 60000));
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function submit(force = false) {
    setSubmitting(true);
    const s = fromLocalInput(start);
    const e = new Date(s.getTime() + duration * 60000);
    const warns: string[] = [];
    const hours = await isWithinWorkingHours(s, e);
    if (!hours.ok) warns.push(hours.reason ?? "Hors horaires");
    const conflicts = await findConflicts({ starts_at: s, ends_at: e, practitioner_id: current.practitioner_id, patient_id: current.patient_id, ignoreId: apptId });
    if (conflicts.practitioner.length) warns.push(`Conflit praticien (${conflicts.practitioner.length})`);
    if (conflicts.patient.length) warns.push(`Conflit patient (${conflicts.patient.length})`);
    if (warns.length && !force) { setWarnings(warns); setSubmitting(false); return; }
    const res = await runMutation(
      () => rescheduleAppointment(apptId, s, e, current.updated_at),
      { successMessage: "Rendez-vous reporté" },
    );
    setSubmitting(false);
    if (res.ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg text-petrol mb-3">Reporter le rendez-vous</h3>
        <div className="space-y-2">
          <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Nouvelle date/heure</div>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          </label>
          <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Durée (min)</div>
            <input type="number" min={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          </label>
          {warnings.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <div className="flex items-center gap-1.5 font-medium mb-1"><AlertTriangle className="h-3.5 w-3.5" />Attention</div>
              <ul className="list-disc list-inside">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-ink/60">Annuler</button>
          {warnings.length > 0 && canOverride && <button disabled={submitting} onClick={() => submit(true)} className="rounded-full bg-red-600 text-white px-4 py-2 text-sm">Forcer</button>}
          <button disabled={submitting} onClick={() => submit(false)} className="rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink">Reporter</button>
        </div>
      </div>
    </div>
  );
}

function CancelModal({ apptId, onClose }: { apptId: string; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [by, setBy] = useState<"patient" | "clinic" | "other">("patient");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!reason.trim()) { toast.error("Motif requis"); return; }
    setSubmitting(true);
    const { data: cur } = await supabase.from("appointments").select("updated_at").eq("id", apptId).maybeSingle();
    const res = await runMutation(
      () => cancelAppointment(apptId, reason.trim(), by, cur?.updated_at ?? null),
      { successMessage: "Rendez-vous annulé" },
    );
    setSubmitting(false);
    if (res.ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg text-petrol mb-3">Annuler le rendez-vous</h3>
        <label className="block mb-2"><div className="text-[10px] uppercase text-ink/50 mb-1">Annulé par</div>
          <select value={by} onChange={(e) => setBy(e.target.value as any)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
            <option value="patient">Patient</option><option value="clinic">Clinique</option><option value="other">Autre</option>
          </select>
        </label>
        <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Motif</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-ink/60">Retour</button>
          <button disabled={submitting} onClick={submit} className="rounded-full bg-red-600 text-white px-4 py-2 text-sm">Confirmer l'annulation</button>
        </div>
      </div>
    </div>
  );
}

function AppointmentModal({ onClose, staff, initialStart }: { onClose: () => void; staff: any[]; initialStart: Date }) {
  const auth = useAdminAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [treatment, setTreatment] = useState("");
  const [startsAt, setStartsAt] = useState(() => { const d = new Date(initialStart); d.setMinutes(0, 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1); return toLocalInput(d); });
  const [duration, setDuration] = useState(60);
  const [practitionerId, setPractitionerId] = useState<string>("");
  const [status, setStatus] = useState<ApptStatus>("tentative");
  const [confirmation, setConfirmation] = useState<ConfirmationStatus>("unconfirmed");
  const [note, setNote] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      let q = supabase.from("patients").select("id, full_name, phone_e164").eq("archived", false).order("full_name").limit(50);
      if (patientQuery.trim()) {
        const term = patientQuery.trim();
        q = supabase.from("patients").select("id, full_name, phone_e164").eq("archived", false)
          .or(`full_name.ilike.%${term}%,phone_e164.ilike.%${term}%,phone_raw.ilike.%${term}%`)
          .order("full_name").limit(50);
      }
      const { data } = await q;
      setPatients(data ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [patientQuery]);

  async function save(force = false) {
    if (!patientId) { toast.error("Sélectionnez un patient"); return; }
    setSubmitting(true);
    const s = fromLocalInput(startsAt);
    const e = new Date(s.getTime() + duration * 60000);
    if (e.getTime() <= s.getTime()) { toast.error("Fin après début requise"); setSubmitting(false); return; }
    const warns: string[] = [];
    const hours = await isWithinWorkingHours(s, e);
    if (!hours.ok) warns.push(hours.reason ?? "Hors horaires");
    const conflicts = await findConflicts({ starts_at: s, ends_at: e, practitioner_id: practitionerId || null, patient_id: patientId });
    if (conflicts.practitioner.length) warns.push(`Conflit praticien (${conflicts.practitioner.length})`);
    if (conflicts.patient.length) warns.push(`Conflit patient (${conflicts.patient.length})`);
    if (warns.length && !force) { setWarnings(warns); setSubmitting(false); return; }
    const res = await runMutation(async () => {
      const { error } = await supabase.from("appointments").insert({
        patient_id: patientId, starts_at: s.toISOString(), ends_at: e.toISOString(),
        treatment: treatment || null, status,
        practitioner_id: practitionerId || null, confirmation_status: confirmation, notes: note || null,
      } as any);
      if (error) throw error;
    }, { successMessage: "Rendez-vous créé" });
    setSubmitting(false);
    if (res.ok) onClose();
  }

  const canOverride = canOverrideAppointmentRules(auth);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-xl text-petrol mb-4">Nouveau rendez-vous</h3>
        <div className="space-y-3">
          <label className="block">
            <div className="text-[11px] uppercase text-ink/50 mb-1">Rechercher patient</div>
            <input placeholder="Nom ou téléphone" value={patientQuery} onChange={(e) => setPatientQuery(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase text-ink/50 mb-1">Patient</div>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
              <option value="">Sélectionner…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}{p.phone_e164 ? ` — ${p.phone_e164}` : ""}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-[11px] uppercase text-ink/50 mb-1">Traitement</div>
            <input value={treatment} onChange={(e) => setTreatment(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Début</div>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Durée (min)</div>
              <input type="number" min={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Praticien</div>
              <select value={practitionerId} onChange={(e) => setPractitionerId(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
                <option value="">Non assigné</option>
                {staff.map((s: any) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
              </select></label>
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Statut</div>
              <select value={status} onChange={(e) => setStatus(e.target.value as ApptStatus)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
                {Object.entries(APPT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></label>
          </div>
          <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Confirmation</div>
            <select value={confirmation} onChange={(e) => setConfirmation(e.target.value as ConfirmationStatus)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
              {(["unconfirmed","sent","confirmed","declined"] as ConfirmationStatus[]).map((c) => <option key={c} value={c}>{CONFIRMATION_LABELS[c]}</option>)}
            </select>
          </label>
          <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Note interne</div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          </label>
          {warnings.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
              <div className="flex items-center gap-1.5 font-medium mb-1"><AlertTriangle className="h-3.5 w-3.5" />Attention</div>
              <ul className="list-disc list-inside">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              {canOverride && <div className="mt-2 text-[11px]">Vous pouvez forcer la création.</div>}
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink/60">Annuler</button>
          {warnings.length > 0 && canOverride && <button disabled={submitting} onClick={() => save(true)} className="rounded-full bg-red-600 text-white px-4 py-2 text-sm">Forcer</button>}
          <button disabled={submitting} onClick={() => save(false)} className="rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink disabled:opacity-50">Créer</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onCancel }: { title: string; body?: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-lg text-petrol mb-2">{title}</h3>
        {body && <p className="text-sm text-ink/70">{body}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 text-sm text-ink/60">Retour</button>
          <button
            disabled={busy}
            onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
            className={`rounded-full px-4 py-2 text-sm text-white disabled:opacity-50 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-petrol hover:bg-ink"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
