import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDZD, formatDate, formatRelative } from "@/lib/admin/utils";
import { X, Trash2, Printer, Copy, Check, XCircle, Send, ListChecks, Plus, Clock } from "lucide-react";
import {
  QUOTE_STATUS_LABELS, QUOTE_STATUS_TONE,
  createQuote, updateQuoteStatus, acceptQuote, refuseQuote, duplicateQuote,
  computeTotals, type QuoteItemInput,
} from "@/lib/admin/quotes";
import { PaymentModal } from "@/components/admin/PaymentModal";
import { runMutation } from "@/lib/admin/mutation-utils";
import { useAdminAuth } from "@/lib/admin/auth";
import { toast } from "sonner";
import {
  postponeShortcuts, completeTask, postponeTask,
  FOLLOWUP_TYPE_LABELS,
} from "@/lib/admin/followups";

// ============================================================
// QuoteDrawer — reusable everywhere (list, patient profile, etc.)
// ============================================================
export function QuoteDrawer({ id, onClose, canWrite, patientContext }: {
  id: string;
  onClose: () => void;
  canWrite: boolean;
  /** When true, closing does NOT navigate; parent controls the tab. */
  patientContext?: boolean;
}) {
  const [quote, setQuote] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const busy = useRef(false);

  async function load() {
    const [q, it, pa, tk] = await Promise.all([
      supabase.from("quotes").select("*, patients(full_name, phone_e164)").eq("id", id).maybeSingle(),
      supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order", { ascending: true }),
      supabase.from("payments").select("*").eq("quote_id", id).order("paid_at", { ascending: false }),
      supabase.from("follow_up_tasks").select("*").eq("linked_entity_type", "quote").eq("linked_entity_id", id).order("due_at", { nullsFirst: false }),
    ]);
    setQuote(q.data); setItems(it.data ?? []); setPayments(pa.data ?? []); setTasks(tk.data ?? []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  useEffect(() => {
    const ch = supabase.channel(`quote-drawer-${id}-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes", filter: `id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `quote_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "follow_up_tasks", filter: `linked_entity_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (!quote) return null;
  const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const remaining = Math.max(0, Number(quote.final_amount) - paid);
  const activeTasks = tasks.filter((t) => t.status === "open");
  const doneTasks = tasks.filter((t) => t.status === "done");

  async function setStatus(s: any) {
    const r = await runMutation(() => updateQuoteStatus(id, s, quote.updated_at), { busyRef: busy, successMessage: "Statut mis à jour" });
    if (r.ok) await load();
  }
  async function onAccept() {
    const r = await runMutation(() => acceptQuote(id, quote.updated_at), { busyRef: busy, successMessage: "Devis accepté" });
    if (r.ok) await load();
  }
  async function onRefuse(reason: string) {
    const r = await runMutation(() => refuseQuote(id, reason, quote.updated_at), { busyRef: busy, successMessage: "Devis refusé" });
    if (r.ok) { setRefuseOpen(false); await load(); }
  }
  async function onDuplicate() {
    const r = await runMutation(() => duplicateQuote(id), { busyRef: busy, successMessage: "Devis dupliqué" });
    if (r.ok && !patientContext) window.location.reload();
    else if (r.ok) await load();
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-ivory shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-ivory/90 backdrop-blur border-b border-black/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-ink/50">{quote.quote_number || quote.reference}</div>
            <div className="font-serif text-base sm:text-lg text-petrol truncate">{quote.title || "Devis"}</div>
          </div>
          <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full border ${QUOTE_STATUS_TONE[quote.status]}`}>{QUOTE_STATUS_LABELS[quote.status]}</span>
          <a href={`/admin/devis/${id}/print`} target="_blank" rel="noopener" className="p-2 text-ink/60 hover:text-petrol" title="Imprimer"><Printer className="h-4 w-4" /></a>
          <button onClick={onClose} className="p-2 text-ink/60 hover:text-petrol"><X className="h-5 w-5" /></button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[10px] uppercase text-ink/50">Patient</div>
              <Link to="/admin/patients/$id" params={{ id: quote.patient_id }} className="text-petrol hover:underline">{quote.patients?.full_name}</Link>
              {quote.patients?.phone_e164 && <div className="text-xs text-ink/50">{quote.patients.phone_e164}</div>}
            </div>
            <div>
              <div className="text-[10px] uppercase text-ink/50">Validité</div>
              <div>{quote.expires_at ? formatDate(quote.expires_at) : "—"}</div>
              <div className="text-xs text-ink/50">Créé {formatRelative(quote.created_at)}</div>
            </div>
          </div>

          {/* Totals block (mobile-friendly summary card) */}
          <div className="rounded-xl bg-white border border-black/5 p-3 grid grid-cols-3 gap-2 text-center sm:hidden">
            <div><div className="text-[9px] uppercase text-ink/40">Total</div><div className="text-sm font-serif text-petrol tabular-nums">{formatDZD(Number(quote.final_amount))}</div></div>
            <div><div className="text-[9px] uppercase text-ink/40">Payé</div><div className="text-sm font-serif text-emerald-700 tabular-nums">{formatDZD(paid)}</div></div>
            <div><div className="text-[9px] uppercase text-ink/40">Solde</div><div className={`text-sm font-serif tabular-nums ${remaining > 0 ? "text-red-600" : "text-emerald-700"}`}>{formatDZD(remaining)}</div></div>
          </div>

          <div className="rounded-xl bg-white border border-black/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase text-ink/50 border-b border-black/5">
                <tr><th className="text-left px-3 py-2">Prestation</th><th className="text-right px-1 hidden sm:table-cell">Qté</th><th className="text-right px-1 hidden sm:table-cell">PU</th><th className="text-right px-3">Total</th></tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-black/5">
                    <td className="px-3 py-2"><div>{it.label}</div>{it.description && <div className="text-xs text-ink/50">{it.description}</div>}
                      <div className="text-[10px] text-ink/40 sm:hidden">{Number(it.quantity)} × {formatDZD(Number(it.unit_price))}</div>
                    </td>
                    <td className="text-right px-1 tabular-nums hidden sm:table-cell">{Number(it.quantity)}</td>
                    <td className="text-right px-1 tabular-nums hidden sm:table-cell">{formatDZD(Number(it.unit_price))}</td>
                    <td className="text-right px-3 tabular-nums text-petrol">{formatDZD(Number(it.total))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-black/10 text-sm hidden sm:table-footer-group">
                <tr><td className="px-3 py-1.5 text-ink/60" colSpan={3}>Sous-total</td><td className="text-right px-3 tabular-nums">{formatDZD(Number(quote.amount))}</td></tr>
                <tr><td className="px-3 py-1.5 text-ink/60" colSpan={3}>Remise</td><td className="text-right px-3 tabular-nums">- {formatDZD(Number(quote.discount || 0))}</td></tr>
                <tr className="font-medium"><td className="px-3 py-2 text-petrol" colSpan={3}>Total</td><td className="text-right px-3 tabular-nums text-petrol">{formatDZD(Number(quote.final_amount))}</td></tr>
                <tr><td className="px-3 py-1.5 text-ink/60" colSpan={3}>Payé</td><td className="text-right px-3 tabular-nums text-emerald-700">{formatDZD(paid)}</td></tr>
                <tr className="font-medium"><td className="px-3 py-2 text-petrol" colSpan={3}>Solde restant</td><td className={`text-right px-3 tabular-nums ${remaining > 0 ? "text-red-600" : "text-emerald-700"}`}>{formatDZD(remaining)}</td></tr>
              </tfoot>
            </table>
          </div>

          {(quote.patient_note || quote.notes || quote.refusal_reason) && (
            <div className="text-sm space-y-2">
              {quote.patient_note && <div><div className="text-[10px] uppercase text-ink/50">Note patient</div><div>{quote.patient_note}</div></div>}
              {quote.notes && <div><div className="text-[10px] uppercase text-ink/50">Note interne</div><div className="text-ink/70">{quote.notes}</div></div>}
              {quote.refusal_reason && <div><div className="text-[10px] uppercase text-ink/50">Raison du refus</div><div className="text-red-700">{quote.refusal_reason}</div></div>}
            </div>
          )}

          {payments.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink/50 mb-2">Paiements</div>
              <div className="rounded-xl bg-white border border-black/5 divide-y divide-black/5">
                {payments.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between text-sm">
                    <div><div>{formatDate(p.paid_at)}</div><div className="text-xs text-ink/50">{p.method}{p.payment_reference ? ` · ${p.payment_reference}` : ""}</div></div>
                    <div className="text-emerald-700 tabular-nums">{formatDZD(Number(p.amount))}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-ups */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider text-ink/50 inline-flex items-center gap-1"><ListChecks className="h-3 w-3" /> Suivis</div>
              {canWrite && <button onClick={() => setNewTaskOpen(true)} className="text-[11px] rounded-full bg-white border border-black/10 px-2 py-1 text-petrol hover:bg-mint"><Plus className="h-3 w-3 inline" /> Créer un suivi</button>}
            </div>
            {activeTasks.length === 0 && doneTasks.length === 0 && (
              <div className="text-xs text-ink/40 italic">Aucun suivi pour ce devis.</div>
            )}
            <div className="space-y-1.5">
              {activeTasks.map((t) => (
                <FollowupRow key={t.id} task={t} onDone={load} canWrite={canWrite} />
              ))}
              {doneTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="text-xs text-ink/50 flex items-center gap-2 px-2 py-1">
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="line-through">{t.title}</span>
                  <span className="text-ink/40">· {formatRelative(t.completed_at ?? t.updated_at)}</span>
                </div>
              ))}
            </div>
          </div>

          {canWrite && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5 sticky bottom-0 bg-ivory/95 backdrop-blur -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4">
              {quote.status === "draft" && (
                <button onClick={() => setStatus("sent")} className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700"><Send className="h-3.5 w-3.5" /> Marquer envoyé</button>
              )}
              {(["sent", "viewed", "negotiating"] as const).includes(quote.status) && (
                <>
                  <button onClick={() => setStatus("negotiating")} className="rounded-full bg-amber-500 text-white px-3 py-1.5 text-sm hover:bg-amber-600">En discussion</button>
                  <button onClick={onAccept} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-700"><Check className="h-3.5 w-3.5" /> Accepter</button>
                  <button onClick={() => setRefuseOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-700"><XCircle className="h-3.5 w-3.5" /> Refuser</button>
                  <button onClick={() => setStatus("expired")} className="rounded-full bg-white border border-black/10 px-3 py-1.5 text-sm text-ink/70">Marquer expiré</button>
                </>
              )}
              {quote.status === "accepted" && remaining > 0 && (
                <button onClick={() => setPayOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-3 py-1.5 text-sm hover:bg-ink">Enregistrer paiement</button>
              )}
              <button onClick={onDuplicate} className="inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-3 py-1.5 text-sm text-ink/70"><Copy className="h-3.5 w-3.5" /> Dupliquer</button>
            </div>
          )}
        </div>

        {payOpen && (
          <PaymentModal
            patientId={quote.patient_id}
            quoteId={id}
            remaining={remaining}
            onClose={() => setPayOpen(false)}
            onDone={() => { setPayOpen(false); load(); }}
          />
        )}
        {refuseOpen && <RefuseModal onClose={() => setRefuseOpen(false)} onConfirm={onRefuse} />}
        {newTaskOpen && (
          <QuoteFollowupModal quoteId={id} patientId={quote.patient_id} onClose={() => setNewTaskOpen(false)} onDone={() => { setNewTaskOpen(false); load(); }} />
        )}
      </div>
    </div>
  );
}

function FollowupRow({ task, onDone, canWrite }: { task: any; onDone: () => void; canWrite: boolean }) {
  const [menu, setMenu] = useState(false);
  const busy = useRef(false);
  async function complete() {
    const r = await runMutation(() => completeTask(task.id, undefined, task.updated_at), { busyRef: busy, successMessage: "Suivi terminé" });
    if (r.ok) onDone();
  }
  async function postpone(d: Date) {
    const r = await runMutation(() => postponeTask(task.id, d, task.updated_at), { busyRef: busy, successMessage: "Reporté" });
    if (r.ok) { setMenu(false); onDone(); }
  }
  return (
    <div className="rounded-lg bg-white border border-black/10 px-3 py-2 text-sm flex items-center gap-2">
      {canWrite && <button onClick={complete} className="text-ink/40 hover:text-emerald-600" title="Terminé"><Check className="h-4 w-4" /></button>}
      <div className="flex-1 min-w-0">
        <div className="text-petrol truncate">{task.title}</div>
        <div className="text-[10px] text-ink/50">{FOLLOWUP_TYPE_LABELS[task.type] ?? task.type}{task.due_at ? ` · ${formatRelative(task.due_at)}` : ""}</div>
      </div>
      {canWrite && (
        <div className="relative">
          <button onClick={() => setMenu((v) => !v)} className="text-ink/40 hover:text-petrol"><Clock className="h-3.5 w-3.5" /></button>
          {menu && (
            <div className="absolute right-0 top-full mt-1 z-10 w-44 rounded-xl bg-white border border-black/10 shadow-lg p-1 text-xs">
              <div className="px-2 py-1 text-[10px] uppercase text-ink/40">Reporter</div>
              {postponeShortcuts().map((s) => (
                <button key={s.label} onClick={() => postpone(s.date)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-mint/40 text-petrol">{s.label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuoteFollowupModal({ quoteId, patientId, onClose, onDone }: { quoteId: string; patientId: string; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState("Relancer devis");
  const [dueAt, setDueAt] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); return d.toISOString().slice(0, 16); });
  const [description, setDescription] = useState("");
  const busy = useRef(false);
  async function submit() {
    if (!title.trim()) { toast.error("Titre requis"); return; }
    const r = await runMutation(async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("follow_up_tasks").insert({
        title: title.trim(),
        description: description || null,
        type: "quote_reminder",
        priority: "important",
        status: "open",
        due_at: new Date(dueAt).toISOString(),
        patient_id: patientId,
        linked_entity_type: "quote",
        linked_entity_id: quoteId,
        created_by: u.user?.id ?? null,
      } as any);
      if (error) throw error;
    }, { busyRef: busy, successMessage: "Suivi créé" });
    if (r.ok) onDone();
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-5 max-w-md w-full">
        <div className="font-serif text-lg text-petrol mb-3">Nouveau suivi devis</div>
        <div className="space-y-2 text-sm">
          <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Titre</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2" /></label>
          <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Échéance</div>
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2" /></label>
          <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Note</div>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2" /></label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-full border border-black/10">Annuler</button>
          <button onClick={submit} className="px-3 py-1.5 text-sm rounded-full bg-petrol text-ivory">Créer</button>
        </div>
      </div>
    </div>
  );
}

function RefuseModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [r, setR] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-5 max-w-md w-full">
        <div className="font-serif text-lg text-petrol mb-2">Refuser le devis</div>
        <textarea value={r} onChange={(e) => setR(e.target.value)} rows={3} placeholder="Raison (optionnel)"
          className="w-full rounded-xl border border-black/10 p-3 text-sm focus:border-teal outline-none" />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-full border border-black/10">Annuler</button>
          <button onClick={() => onConfirm(r.trim() || (null as any))} className="px-3 py-1.5 text-sm rounded-full bg-red-600 text-white">Confirmer</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NewQuoteModal — reusable creator
// ============================================================
export function NewQuoteModal({ onClose, onCreated, patientId: lockedPatient }: {
  onClose: () => void;
  onCreated: (id: string) => void;
  /** Preselect and lock the patient (patient profile flow). */
  patientId?: string | null;
}) {
  const [patients, setPatients] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [patientId, setPatientId] = useState(lockedPatient ?? "");
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [discount, setDiscount] = useState("0");
  const [patientNote, setPatientNote] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [items, setItems] = useState<QuoteItemInput[]>([{ label: "", quantity: 1, unit_price: 0, discount_amount: 0 }]);
  const busy = useRef(false);

  useEffect(() => {
    if (!lockedPatient) {
      supabase.from("patients").select("id, full_name, phone_e164").order("full_name").limit(500).then(({ data }) => setPatients(data ?? []));
    }
    supabase.from("treatments").select("id, name, price_min, price_max").eq("is_active", true).order("name").then(({ data }) => setCatalog(data ?? []));
  }, [lockedPatient]);

  const totals = useMemo(() => computeTotals(items, Number(discount) || 0), [items, discount]);

  function setItem(i: number, patch: Partial<QuoteItemInput>) {
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }
  function addItem() { setItems((p) => [...p, { label: "", quantity: 1, unit_price: 0, discount_amount: 0 }]); }
  function removeItem(i: number) { setItems((p) => p.filter((_, idx) => idx !== i)); }

  async function save() {
    if (!patientId) { toast.error("Sélectionnez un patient"); return; }
    const clean = items.filter((it) => it.label.trim());
    if (!clean.length) { toast.error("Ajoutez au moins une prestation"); return; }
    const r = await runMutation(() => createQuote({
      patient_id: patientId, title: title || null, items: clean, discount: Number(discount) || 0,
      valid_until: validUntil || null, patient_note: patientNote || null, internal_note: internalNote || null,
    }), { busyRef: busy, successMessage: "Devis créé" });
    if (r.ok) onCreated(r.data.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-ivory shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-ivory/90 backdrop-blur border-b border-black/5 px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <div className="flex-1 font-serif text-lg text-petrol">Nouveau devis</div>
          <button onClick={onClose} className="p-2 text-ink/60 hover:text-petrol"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4 sm:p-6 space-y-4 text-sm pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lockedPatient ? (
              <div className="rounded-xl bg-mint/40 border border-teal/20 px-3 py-2 text-petrol text-xs">Patient préselectionné</div>
            ) : (
              <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Patient *</div>
                <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none">
                  <option value="">— Sélectionner —</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select></label>
            )}
            <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Titre</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Plan de traitement — Facettes"
                className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" /></label>
          </div>

          <div className="rounded-xl bg-white border border-black/5 overflow-hidden">
            <div className="text-[10px] uppercase text-ink/50 px-4 py-2 border-b border-black/5">Prestations</div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center px-3 py-2 border-b border-black/5">
                <input list={`cat-${i}`} value={it.label} onChange={(e) => {
                  const label = e.target.value;
                  const match = catalog.find((c) => c.name === label);
                  setItem(i, { label, unit_price: match?.price_min ? Number(match.price_min) : it.unit_price, treatment_id: match?.id ?? null });
                }} placeholder="Prestation" className="col-span-12 sm:col-span-6 rounded-lg border border-black/10 px-2 py-1.5 focus:border-teal outline-none" />
                <datalist id={`cat-${i}`}>{catalog.map((c) => <option key={c.id} value={c.name} />)}</datalist>
                <input inputMode="decimal" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) || 0 })} className="col-span-3 sm:col-span-2 rounded-lg border border-black/10 px-2 py-1.5 text-right focus:border-teal outline-none" placeholder="Qté" />
                <input inputMode="decimal" value={it.unit_price} onChange={(e) => setItem(i, { unit_price: Number(e.target.value) || 0 })} className="col-span-8 sm:col-span-3 rounded-lg border border-black/10 px-2 py-1.5 text-right focus:border-teal outline-none" placeholder="PU" />
                <button onClick={() => removeItem(i)} className="col-span-1 text-ink/50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button onClick={addItem} className="w-full text-left px-4 py-2 text-xs text-teal hover:bg-mint">+ Ajouter une ligne</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Remise globale (DA)</div>
              <input inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" /></label>
            <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Validité (date)</div>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" /></label>
          </div>

          <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Note patient</div>
            <textarea rows={2} value={patientNote} onChange={(e) => setPatientNote(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" /></label>
          <label className="block"><div className="text-[10px] uppercase text-ink/50 mb-1">Note interne</div>
            <textarea rows={2} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" /></label>
        </div>

        <div className="sticky bottom-0 bg-ivory/95 backdrop-blur border-t border-black/5 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-ink/60">Sous-total {formatDZD(totals.subtotal)}</div>
            <div className="font-serif text-xl text-petrol tabular-nums">{formatDZD(totals.total)}</div>
          </div>
          <button onClick={save} className="rounded-full bg-petrol text-ivory px-5 py-2 hover:bg-ink">Créer</button>
        </div>
      </div>
    </div>
  );
}

// Convenience: helper for callers to run the generator
export async function generateQuoteFollowups(): Promise<number> {
  const { data, error } = await (supabase.rpc as any)("generate_quote_followups");
  if (error) throw error;
  return Number(data ?? 0);
}

// Convenience: patient financial summary
export async function fetchPatientFinancialSummary(patientId: string) {
  const { data, error } = await (supabase.rpc as any)("patient_financial_summary", { _patient_id: patientId });
  if (error) throw error;
  return data as {
    accepted_value: number;
    quoted_total: number;
    collected: number;
    outstanding: number;
    active_quotes_count: number;
  };
}

// Convenience: derive a payment-status label + tone for a treatment row
export function paymentStatusLabel(due: number, paid: number, hasQuote: boolean): { label: string; tone: string } {
  if (due <= 0 && !hasQuote) return { label: "Non facturé", tone: "bg-neutral-100 text-neutral-600 border-neutral-200" };
  if (due <= 0 && hasQuote) return { label: "Devis en cours", tone: "bg-blue-50 text-blue-700 border-blue-200" };
  if (paid <= 0) return { label: "Solde restant", tone: "bg-red-50 text-red-700 border-red-200" };
  if (paid >= due) return { label: "Payé", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  return { label: "Partiellement payé", tone: "bg-amber-50 text-amber-700 border-amber-200" };
}
