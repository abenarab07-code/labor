import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, CallLink, WhatsAppLink } from "@/components/admin/AdminShell";
import { formatRelative } from "@/lib/admin/utils";
import { toast } from "sonner";
import { CheckCircle, ListChecks, Plus, RotateCcw, Clock, X, MoreHorizontal } from "lucide-react";
import { isOverdue, isDueToday, isUpcoming } from "@/lib/admin/tz";
import {
  FOLLOWUP_TYPES, FOLLOWUP_TYPE_LABELS,
  FOLLOWUP_PRIORITIES, FOLLOWUP_PRIORITY_LABELS, FOLLOWUP_PRIORITY_TONE,
  completeTask, reopenTask, postponeTask, assignTask, postponeShortcuts,
} from "@/lib/admin/followups";
import { runMutation } from "@/lib/admin/mutation-utils";
import { generateQuoteFollowups } from "@/components/admin/QuoteWorkbench";
import { useAdminAuth } from "@/lib/admin/auth";

type TabKey = "overdue" | "today" | "upcoming" | "done" | "unassigned";
const TAB_KEYS: TabKey[] = ["overdue", "today", "upcoming", "done", "unassigned"];

export const Route = createFileRoute("/admin/suivis")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (TAB_KEYS as string[]).includes(s.tab as string) ? (s.tab as TabKey) : "overdue",
  }),
  head: () => ({ meta: [{ title: "Suivis — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: FollowUpsPage,
});

function FollowUpsPage() {
  const { tab } = useSearch({ from: "/admin/suivis" });
  const navigate = useNavigate({ from: "/admin/suivis" });
  const setTab = (t: TabKey) => navigate({ search: { tab: t }, replace: true });
  const [items, setItems] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => { supabase.from("staff_profiles").select("id, user_id, full_name").eq("is_active", true).then(({ data }) => setStaff(data ?? [])); }, []);

  async function load() {
    const { data, error } = await supabase.from("follow_up_tasks")
      .select("id, title, type, status, due_at, priority, patient_id, request_id, appointment_id, assigned_to, linked_entity_type, linked_entity_id, description, completion_note, updated_at, patients(full_name, phone_e164)")
      .order("due_at", { nullsFirst: false }).limit(500);
    if (error) toast.error(error.message);
    setItems(data ?? []);
  }

  useEffect(() => {
    load();
    // Unique per-mount channel name avoids StrictMode / multi-tab collisions.
    const ch = supabase.channel(`follow-live-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "follow_up_tasks" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => items.filter((t) => {
    if (tab === "done") return t.status === "done";
    if (t.status !== "open") return false;
    if (tab === "overdue") return isOverdue(t.due_at);
    if (tab === "today") return isDueToday(t.due_at);
    if (tab === "upcoming") return isUpcoming(t.due_at);
    if (tab === "unassigned") return !t.assigned_to;
    return true;
  }), [items, tab]);

  const counts = useMemo(() => ({
    overdue: items.filter((t) => t.status === "open" && isOverdue(t.due_at)).length,
    today: items.filter((t) => t.status === "open" && isDueToday(t.due_at)).length,
    upcoming: items.filter((t) => t.status === "open" && isUpcoming(t.due_at)).length,
    done: items.filter((t) => t.status === "done").length,
    unassigned: items.filter((t) => t.status === "open" && !t.assigned_to).length,
  }), [items]);

  const busyRef = useRef(false);
  async function onComplete(t: any) {
    const r = await runMutation(() => completeTask(t.id, undefined, t.updated_at), {
      busyRef, successMessage: "Tâche terminée",
    });
    if (r.ok) load();
  }
  async function onReopen(t: any) {
    const r = await runMutation(() => reopenTask(t.id, t.updated_at), {
      busyRef, successMessage: "Réouverte",
    });
    if (r.ok) load();
  }
  async function onPostpone(t: any, date: Date) {
    const r = await runMutation(() => postponeTask(t.id, date, t.updated_at), {
      busyRef, successMessage: "Reportée",
    });
    if (r.ok) { setOpenMenuId(null); load(); }
  }

  const auth = useAdminAuth();
  const canGenerate = auth.roles.includes("admin") || auth.roles.includes("reception");
  async function onGenerate() {
    const r = await runMutation(() => generateQuoteFollowups(), { successMessage: "Relances devis générées" });
    if (r.ok) { toast.success(`${r.data} suivi(s) créé(s)`); load(); }
  }

  return (
    <div>
      <PageHeader title="Suivis" subtitle="Rappels et tâches à effectuer" actions={
        <>
          {canGenerate && (
            <button onClick={onGenerate} className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-3 py-2 text-xs text-petrol hover:bg-mint">Générer relances devis</button>
          )}
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink"><Plus className="h-4 w-4" />Nouvelle tâche</button>
        </>
      } />


      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ["overdue", "En retard", counts.overdue],
          ["today", "Aujourd'hui", counts.today],
          ["upcoming", "À venir", counts.upcoming],
          ["done", "Terminés", counts.done],
          ["unassigned", "Non assignés", counts.unassigned],
        ] as Array<[TabKey, string, number]>).map(([k, l, n]) => (
          <button key={k} onClick={() => setTab(k)} className={`text-[11px] rounded-full px-3 py-1.5 border inline-flex items-center gap-1.5 ${tab === k ? "bg-petrol text-ivory border-petrol" : "bg-white border-black/10 text-ink/70"}`}>
            {l}<span className={`text-[10px] px-1.5 rounded-full ${tab === k ? "bg-white/20" : "bg-ink/10"}`}>{n}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? <EmptyState title="Aucune tâche" description={tab === "overdue" ? "Bravo, tout est à jour." : undefined} icon={ListChecks} /> : (
        <div className="rounded-2xl bg-white border border-black/5 divide-y divide-black/5">
          {filtered.map((t) => {
            const overdue = t.status === "open" && isOverdue(t.due_at);
            return (
              <div key={t.id} className="p-4 flex items-start gap-3 hover:bg-mint/20">
                {t.status === "open" ? (
                  <button onClick={() => onComplete(t)} className="mt-0.5 text-ink/40 hover:text-teal" title="Marquer terminé"><CheckCircle className="h-5 w-5" /></button>
                ) : (
                  <button onClick={() => onReopen(t)} className="mt-0.5 text-emerald-600 hover:text-petrol" title="Rouvrir"><RotateCcw className="h-5 w-5" /></button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-petrol">{t.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-mint text-petrol">{FOLLOWUP_TYPE_LABELS[t.type] ?? t.type}</span>
                    {t.priority && t.priority !== "normal" && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${FOLLOWUP_PRIORITY_TONE[t.priority] ?? ""}`}>{FOLLOWUP_PRIORITY_LABELS[t.priority] ?? t.priority}</span>
                    )}
                  </div>
                  {t.description && <div className="text-xs text-ink/60 mt-1 line-clamp-2">{t.description}</div>}
                  <div className="text-xs text-ink/50 mt-1 flex flex-wrap items-center gap-2">
                    {t.patients?.full_name && t.patient_id && <Link to="/admin/patients/$id" params={{ id: t.patient_id }} className="text-teal hover:underline">{t.patients.full_name}</Link>}
                    {t.patients?.phone_e164 && <CallLink phone={t.patients.phone_e164} />}
                    {t.patients?.phone_e164 && <WhatsAppLink phone={t.patients.phone_e164} />}
                    {t.request_id && <Link to="/admin/demandes/$id" params={{ id: t.request_id }} className="text-teal hover:underline">Demande liée</Link>}
                    {t.linked_entity_type === "quote" && t.linked_entity_id && (
                      <Link to="/admin/devis" search={{ open: t.linked_entity_id } as any} className="text-teal hover:underline">Ouvrir le devis</Link>
                    )}
                    {t.assigned_to && <span>· Assigné</span>}
                  </div>
                  {t.completion_note && <div className="text-xs text-ink/50 mt-1 italic">Note : {t.completion_note}</div>}
                </div>
                <div className="flex flex-col items-end gap-1.5 relative">
                  <div className={`text-[11px] px-2 py-1 rounded-full ${overdue ? "bg-red-100 text-red-600" : t.status === "done" ? "bg-neutral-100 text-neutral-500" : "bg-mint text-petrol"}`}>
                    {t.status === "done" ? "Terminé" : t.due_at ? formatRelative(t.due_at) : "—"}
                  </div>
                  {t.status === "open" && (
                    <button onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)} className="text-ink/40 hover:text-petrol"><MoreHorizontal className="h-4 w-4" /></button>
                  )}
                  {openMenuId === t.id && (
                    <div className="absolute right-0 top-full mt-1 z-10 w-52 rounded-xl bg-white border border-black/10 shadow-lg p-1 text-xs">
                      <div className="px-2 py-1 text-[10px] uppercase text-ink/40">Reporter</div>
                      {postponeShortcuts().map((s) => (
                        <button key={s.label} onClick={() => onPostpone(t, s.date)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-mint/40 text-petrol">{s.label}</button>
                      ))}
                      <PostponeCustomRow onSubmit={(d) => onPostpone(t, d)} />
                      <div className="border-t border-black/5 mt-1 pt-1">
                        <AssignRow task={t} staff={staff} onDone={() => { setOpenMenuId(null); load(); }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && <NewTaskModal onClose={() => setShowNew(false)} staff={staff} />}
    </div>
  );
}

function PostponeCustomRow({ onSubmit }: { onSubmit: (d: Date) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-1 px-2 py-1.5">
      <Clock className="h-3 w-3 text-ink/40" />
      <input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1 text-[11px] rounded border border-black/10 px-1.5 py-1" />
      <button onClick={() => value && onSubmit(new Date(value))} className="text-[10px] text-teal">OK</button>
    </div>
  );
}

function AssignRow({ task, staff, onDone }: { task: any; staff: any[]; onDone: () => void }) {
  return (
    <div className="px-2 py-1.5">
      <div className="text-[10px] uppercase text-ink/40 mb-1">Assigner</div>
      <select
        defaultValue={task.assigned_to ?? ""}
        onChange={async (e) => {
          const val = e.target.value || null;
          const r = await runMutation(() => assignTask(task.id, val, task.updated_at), { successMessage: "Assigné" });
          if (r.ok) onDone();
        }}
        className="w-full text-[11px] rounded border border-black/10 px-1.5 py-1">
        <option value="">— Non assigné —</option>
        {staff.map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
      </select>
    </div>
  );
}

function NewTaskModal({ onClose, staff }: { onClose: () => void; staff: any[] }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("call");
  const [priority, setPriority] = useState<string>("normal");
  const [dueAt, setDueAt] = useState(() => { const d = new Date(); d.setHours(d.getHours() + 2, 0, 0, 0); return d.toISOString().slice(0, 16); });
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [patientId, setPatientId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("patients").select("id, full_name").eq("archived", false).order("full_name").limit(100).then(({ data }) => setPatients(data ?? []));
  }, []);

  const submitBusy = useRef(false);
  async function submit() {
    if (!title.trim()) { toast.error("Titre requis"); return; }
    setSubmitting(true);
    const res = await runMutation(async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("follow_up_tasks").insert({
        title: title.trim(), type, priority, description: description || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        patient_id: patientId || null,
        assigned_to: assignedTo || null,
        linked_entity_type: patientId ? "patient" : null,
        linked_entity_id: patientId || null,
        status: "open",
        created_by: u.user?.id ?? null,
      } as any);
      if (error) throw error;
    }, { busyRef: submitBusy, successMessage: "Tâche créée" });
    setSubmitting(false);
    if (res.ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-petrol">Nouvelle tâche</h3>
          <button onClick={onClose} className="text-ink/60"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Titre</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Type</div>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
                {FOLLOWUP_TYPES.map((t) => <option key={t} value={t}>{FOLLOWUP_TYPE_LABELS[t]}</option>)}
              </select></label>
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Priorité</div>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
                {FOLLOWUP_PRIORITIES.map((p) => <option key={p} value={p}>{FOLLOWUP_PRIORITY_LABELS[p]}</option>)}
              </select></label>
          </div>
          <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Échéance</div>
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Patient (optionnel)</div>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
                <option value="">—</option>
                {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select></label>
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Assigné à</div>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm">
                <option value="">Non assigné</option>
                {staff.map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
              </select></label>
          </div>
          <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink/60">Annuler</button>
          <button disabled={submitting} onClick={submit} className="rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink disabled:opacity-50">Créer</button>
        </div>
      </div>
    </div>
  );
}
