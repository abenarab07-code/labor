import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, CallLink, WhatsAppLink, EmptyState } from "@/components/admin/AdminShell";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Wallet,
  Activity,
  Plus,
  Trash2,
  Stethoscope,
  Printer,
} from "lucide-react";
import {
  formatDZD,
  formatDateTime,
  formatDate,
  formatRelative,
  logActivity,
  logAudit,
  APPT_STATUS_LABELS,
  APPT_STATUS_TONE,
  TREATMENT_STATUSES,
  TREATMENT_STATUS_LABELS,
  TREATMENT_STATUS_TONE,
} from "@/lib/admin/utils";
import { toast } from "sonner";
import { useAdminAuth } from "@/lib/admin/auth";
import { runMutation } from "@/lib/admin/mutation-utils";
import { addPatientNote, updatePatientField, updatePatientTreatment } from "@/lib/admin/patients";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONE } from "@/lib/admin/quotes";
import { PAYMENT_METHOD_LABELS } from "@/lib/admin/payments";
import {
  QuoteDrawer,
  NewQuoteModal,
  fetchPatientFinancialSummary,
  paymentStatusLabel,
} from "@/components/admin/QuoteWorkbench";
import { PaymentModal } from "@/components/admin/PaymentModal";
import { isReceptionOrAdmin } from "@/lib/admin/permissions";

export const Route = createFileRoute("/admin/patients/$id")({
  head: () => ({
    meta: [{ title: "Patient — Clinic OS" }, { name: "robots", content: "noindex" }],
  }),
  component: PatientDetail,
});

type TabKey = "overview" | "notes" | "history" | "devis" | "paiements" | "financial";

function PatientDetail() {
  const { id } = Route.useParams();
  const auth = useAdminAuth();
  const canFinance = isReceptionOrAdmin(auth);
  const isAdmin = auth.isAdmin;
  const [p, setP] = useState<any | null>(null);
  const [appts, setAppts] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [noteBody, setNoteBody] = useState("");
  const [tab, setTab] = useState<TabKey>("overview");
  const [devisFilter, setDevisFilter] = useState<
    "all" | "active" | "accepted" | "refused" | "expired"
  >("all");
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [newQuoteOpen, setNewQuoteOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<{ quoteId?: string | null; remaining?: number } | null>(
    null,
  );
  // Treatment form
  const [tForm, setTForm] = useState({
    treatment_id: "",
    agreed_value: "",
    status: "proposal" as string,
  });
  const [showTForm, setShowTForm] = useState(false);

  async function loadAll() {
    const [pat, ap, no, ac, pa, tr, cat, qs] = await Promise.all([
      supabase.from("patients").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", id)
        .order("starts_at", { ascending: false }),
      supabase
        .from("patient_notes")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("patient_activities")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("*, patient_treatments(id, treatments(name)), quotes(id, quote_number)")
        .eq("patient_id", id)
        .order("paid_at", { ascending: false }),
      supabase
        .from("patient_treatments")
        .select("*, treatments(name), quotes(id, quote_number, status, final_amount)")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("treatments")
        .select("id, name, price_min, price_max")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("quotes")
        .select(
          "id, quote_number, title, status, final_amount, expires_at, created_at, sent_at, accepted_at, assigned_to, patient_treatment_id, patient_treatments(treatments(name))",
        )
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
    ]);
    setP(pat.data);
    setAppts(ap.data ?? []);
    setNotes(no.data ?? []);
    setActivities(ac.data ?? []);
    setPayments(pa.data ?? []);
    setTreatments(tr.data ?? []);
    setCatalog(cat.data ?? []);
    setQuotes(qs.data ?? []);
    if (canFinance) {
      try {
        setSummary(await fetchPatientFinancialSummary(id));
      } catch {
        /* ignore */
      }
    }
  }

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel(`patient-${id}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patient_activities",
          filter: `patient_id=eq.${id}`,
        },
        loadAll,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patient_notes", filter: `patient_id=eq.${id}` },
        loadAll,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments", filter: `patient_id=eq.${id}` },
        loadAll,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patient_treatments",
          filter: `patient_id=eq.${id}`,
        },
        loadAll,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotes", filter: `patient_id=eq.${id}` },
        loadAll,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const busyRef = useRef(false);

  async function addNote() {
    const text = noteBody.trim();
    if (!text) return;
    const r = await runMutation(() => addPatientNote(id, text), {
      busyRef,
      successMessage: "Note ajoutée",
    });
    if (r.ok) setNoteBody("");
  }

  async function updateField(field: string, value: any) {
    await runMutation(() => updatePatientField(id, field, value, p?.updated_at ?? null), {
      successMessage: "Mis à jour",
    });
  }

  async function addTreatment() {
    if (!tForm.treatment_id && !tForm.agreed_value) {
      toast.error("Sélectionnez un traitement ou saisissez un montant");
      return;
    }
    const sel = catalog.find((c) => c.id === tForm.treatment_id);
    const basePrice = sel?.price_min ?? sel?.price_max ?? null;
    const res = await runMutation(
      async () => {
        const payload: any = {
          patient_id: id,
          treatment_id: tForm.treatment_id || null,
          agreed_value: tForm.agreed_value ? Number(tForm.agreed_value) : basePrice,
          expected_value: basePrice,
          status: tForm.status,
        };
        const { error } = await supabase.from("patient_treatments").insert(payload);
        if (error) throw error;
        await logActivity({
          patient_id: id,
          type: "treatment",
          summary: `Traitement ajouté${sel ? ` : ${sel.name}` : ""}`,
        });
      },
      { busyRef, successMessage: "Traitement ajouté" },
    );
    if (res.ok) {
      setTForm({ treatment_id: "", agreed_value: "", status: "proposal" });
      setShowTForm(false);
    }
  }

  async function updateTreatmentStatus(t: any, status: string) {
    await runMutation(() => updatePatientTreatment(t.id, { status }, t.updated_at), {
      successMessage: "Traitement mis à jour",
    });
  }

  async function removeTreatment(t: any) {
    if (!confirm("Supprimer ce traitement ? (les paiements liés seront conservés sans lien)"))
      return;
    await runMutation(
      async () => {
        const { error } = await supabase.from("patient_treatments").delete().eq("id", t.id);
        if (error) throw error;
      },
      { successMessage: "Traitement retiré" },
    );
  }

  async function deletePayment(pay: any) {
    if (!confirm("Supprimer ce paiement ?")) return;
    await runMutation(
      async () => {
        const { error } = await supabase.from("payments").delete().eq("id", pay.id);
        if (error) throw error;
        await logAudit({
          action: "delete",
          entity_type: "payment",
          entity_id: pay.id,
          summary: `Paiement ${formatDZD(Number(pay.amount))} supprimé`,
          before: pay,
        });
      },
      { successMessage: "Paiement supprimé" },
    );
  }

  if (!p) return <div className="text-sm text-ink/50">Chargement…</div>;

  const totalPaid = payments.reduce((s, x) => s + Number(x.amount || 0), 0);

  const tabs: { k: TabKey; l: string; hidden?: boolean }[] = [
    { k: "overview", l: "Vue" },
    { k: "notes", l: "Notes" },
    { k: "devis", l: "Devis", hidden: !canFinance },
    { k: "paiements", l: "Paiements", hidden: !canFinance },
    { k: "history", l: "Historique" },
    { k: "financial", l: "Traitements", hidden: !canFinance },
  ];

  function filteredQuotes() {
    if (devisFilter === "all") return quotes;
    if (devisFilter === "active")
      return quotes.filter((q) => ["draft", "sent", "viewed", "negotiating"].includes(q.status));
    if (devisFilter === "accepted") return quotes.filter((q) => q.status === "accepted");
    if (devisFilter === "refused") return quotes.filter((q) => q.status === "refused");
    if (devisFilter === "expired") return quotes.filter((q) => q.status === "expired");
    return quotes;
  }

  function paidForQuote(qid: string) {
    return payments
      .filter((p) => p.quote_id === qid)
      .reduce((s, p) => s + Number(p.amount || 0), 0);
  }
  function paidForTreatment(tid: string) {
    return payments
      .filter((x) => x.patient_treatment_id === tid)
      .reduce((s, x) => s + Number(x.amount || 0), 0);
  }

  return (
    <div>
      <Link
        to="/admin/patients"
        search={{ q: "", status: "all", new: undefined }}
        className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-petrol mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Retour
      </Link>
      <PageHeader
        title={p.full_name}
        subtitle={`${p.phone_e164} · Créé ${formatRelative(p.created_at)}`}
        actions={
          <>
            <CallLink
              phone={p.phone_e164}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-4 py-2 text-sm text-petrol hover:bg-mint"
            />
            <WhatsAppLink
              phone={p.phone_e164}
              message={`Bonjour ${p.full_name}`}
              className="inline-flex items-center gap-2 rounded-full bg-teal text-petrol px-4 py-2 text-sm hover:bg-teal/90"
            />
            {canFinance && (
              <button
                onClick={() => setNewQuoteOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink"
              >
                <Plus className="h-4 w-4" /> Nouveau devis
              </button>
            )}
          </>
        }
      />

      {/* Compact KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl bg-white border border-black/5 p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink/50">RDV</div>
          <div className="text-2xl font-serif text-petrol">{appts.length}</div>
        </div>
        {canFinance ? (
          <>
            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink/50">
                Valeur acceptée
              </div>
              <div className="text-2xl font-serif text-petrol tabular-nums">
                {formatDZD(Number(summary?.accepted_value ?? 0))}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink/50">Encaissé</div>
              <div className="text-2xl font-serif text-emerald-700 tabular-nums">
                {formatDZD(Number(summary?.collected ?? 0))}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <div className="text-[10px] uppercase tracking-wider text-ink/50 flex items-center justify-between">
                Solde restant{" "}
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-mint/60 text-petrol">
                  {summary?.active_quotes_count ?? 0} devis actifs
                </span>
              </div>
              <div
                className={`text-2xl font-serif tabular-nums ${Number(summary?.outstanding ?? 0) > 0 ? "text-red-600" : "text-petrol"}`}
              >
                {formatDZD(Number(summary?.outstanding ?? 0))}
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-3 rounded-2xl bg-mint/40 border border-black/5 p-4 text-sm text-ink/60">
            Les données financières sont réservées à l'administration.
          </div>
        )}
      </div>

      <div className="border-b border-black/10 mb-4 flex gap-1 overflow-x-auto">
        {tabs
          .filter((t) => !t.hidden)
          .map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 py-2 text-sm border-b-2 whitespace-nowrap ${tab === t.k ? "border-teal text-petrol" : "border-transparent text-ink/50 hover:text-petrol"}`}
            >
              {t.l}
            </button>
          ))}
      </div>

      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white border border-black/5 p-5">
            <h3 className="font-serif text-lg text-petrol mb-3">Informations</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase text-ink/50">Email</dt>
                <dd className="text-petrol">{p.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-ink/50">Naissance</dt>
                <dd className="text-petrol">{p.date_of_birth ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-ink/50">Statut</dt>
                <dd>
                  <select
                    value={p.lifecycle_status}
                    onChange={(e) => updateField("lifecycle_status", e.target.value)}
                    className="text-xs rounded-full border border-black/10 px-2 py-1 bg-white"
                  >
                    {[
                      "lead",
                      "prospect",
                      "actif",
                      "en_traitement",
                      "termine",
                      "dormant",
                      "perdu",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-ink/50">Température</dt>
                <dd>
                  <select
                    value={p.temperature ?? "tiede"}
                    onChange={(e) => updateField("temperature", e.target.value)}
                    className="text-xs rounded-full border border-black/10 px-2 py-1 bg-white"
                  >
                    {["chaud", "tiede", "froid"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-ink/50">Source</dt>
                <dd className="text-petrol">{p.source ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-ink/50">Traitement</dt>
                <dd className="text-petrol">{p.treatment_interest ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-white border border-black/5 p-5">
            <h3 className="font-serif text-lg text-petrol mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Rendez-vous
            </h3>
            {appts.length === 0 ? (
              <EmptyState title="Aucun rendez-vous" />
            ) : (
              <ul className="space-y-2 text-sm">
                {appts.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex justify-between border-b border-black/5 pb-2">
                    <div>
                      <div className="text-petrol">{a.treatment ?? "Consultation"}</div>
                      <div className="text-xs text-ink/50">{formatDateTime(a.starts_at)}</div>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border h-fit ${APPT_STATUS_TONE[a.status] ?? "bg-mint text-petrol"}`}
                    >
                      {APPT_STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "notes" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-black/5 p-5">
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder="Nouvelle note clinique ou commerciale…"
              className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none focus:border-teal"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={addNote}
                className="rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink"
              >
                Ajouter
              </button>
            </div>
          </div>
          {notes.length === 0 ? (
            <EmptyState title="Aucune note" icon={FileText} />
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="rounded-xl bg-white border border-black/5 p-4">
                  <p className="text-sm text-ink whitespace-pre-wrap">{n.body}</p>
                  <div className="text-[10px] text-ink/40 uppercase tracking-wider mt-2">
                    {formatRelative(n.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="rounded-2xl bg-white border border-black/5 p-5">
          {activities.length === 0 ? (
            <EmptyState title="Aucune activité" icon={Activity} />
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="flex gap-3 text-sm border-b border-black/5 pb-3 last:border-0"
                >
                  <div className="h-2 w-2 rounded-full bg-teal mt-1.5 shrink-0" />
                  <div>
                    <div className="text-petrol">{a.summary}</div>
                    <div className="text-[10px] text-ink/40 uppercase tracking-wide">
                      {a.type} · {formatRelative(a.created_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "devis" && canFinance && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "Tous"],
                  ["active", "Actifs"],
                  ["accepted", "Acceptés"],
                  ["refused", "Refusés"],
                  ["expired", "Expirés"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setDevisFilter(k as any)}
                  className={`text-[11px] rounded-full px-3 py-1.5 border ${devisFilter === k ? "bg-petrol text-ivory border-petrol" : "bg-white border-black/10 text-ink/70"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              onClick={() => setNewQuoteOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-petrol text-ivory px-3 py-1.5 text-xs hover:bg-ink"
            >
              <Plus className="h-3 w-3" /> Créer un devis
            </button>
          </div>

          {filteredQuotes().length === 0 ? (
            <EmptyState
              title="Aucun devis pour ce patient"
              icon={FileText}
              description="Créez le premier devis pour proposer un plan de soin."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-2xl bg-white border border-black/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-ink/50 border-b border-black/5">
                    <tr>
                      <th className="text-left px-4 py-2">N°</th>
                      <th className="text-left">Titre</th>
                      <th className="text-left">Traitement</th>
                      <th className="text-left">Créé</th>
                      <th className="text-left">Validité</th>
                      <th className="text-right px-2">Total</th>
                      <th className="text-right px-2">Payé</th>
                      <th className="text-right px-2">Solde</th>
                      <th className="text-left px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes().map((q) => {
                      const paid = paidForQuote(q.id);
                      const rest = Math.max(0, Number(q.final_amount) - paid);
                      return (
                        <tr
                          key={q.id}
                          onClick={() => setOpenQuoteId(q.id)}
                          className="border-t border-black/5 hover:bg-mint/30 cursor-pointer"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-petrol">
                            {q.quote_number}
                          </td>
                          <td className="text-petrol">{q.title ?? "—"}</td>
                          <td className="text-ink/60 text-xs">
                            {q.patient_treatments?.treatments?.name ?? "—"}
                          </td>
                          <td className="text-ink/60">{formatRelative(q.created_at)}</td>
                          <td className="text-ink/60">
                            {q.expires_at ? formatDate(q.expires_at) : "—"}
                          </td>
                          <td className="text-right px-2 text-petrol tabular-nums">
                            {formatDZD(Number(q.final_amount))}
                          </td>
                          <td className="text-right px-2 tabular-nums text-emerald-700">
                            {formatDZD(paid)}
                          </td>
                          <td
                            className={`text-right px-2 tabular-nums ${rest > 0 && q.status === "accepted" ? "text-red-600" : "text-ink/50"}`}
                          >
                            {formatDZD(rest)}
                          </td>
                          <td className="px-4">
                            <span
                              className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border ${QUOTE_STATUS_TONE[q.status]}`}
                            >
                              {QUOTE_STATUS_LABELS[q.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {filteredQuotes().map((q) => {
                  const paid = paidForQuote(q.id);
                  const rest = Math.max(0, Number(q.final_amount) - paid);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setOpenQuoteId(q.id)}
                      className="w-full text-left rounded-2xl bg-white border border-black/5 p-3 active:bg-mint/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-petrol font-medium truncate">
                            {q.title ?? "Devis"}
                          </div>
                          <div className="font-mono text-[10px] text-ink/50">{q.quote_number}</div>
                        </div>
                        <span
                          className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${QUOTE_STATUS_TONE[q.status]}`}
                        >
                          {QUOTE_STATUS_LABELS[q.status]}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                        <div>
                          <div className="text-[9px] uppercase text-ink/40">Total</div>
                          <div className="text-sm font-serif text-petrol tabular-nums">
                            {formatDZD(Number(q.final_amount))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase text-ink/40">Payé</div>
                          <div className="text-sm font-serif text-emerald-700 tabular-nums">
                            {formatDZD(paid)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase text-ink/40">Solde</div>
                          <div
                            className={`text-sm font-serif tabular-nums ${rest > 0 && q.status === "accepted" ? "text-red-600" : "text-ink/60"}`}
                          >
                            {formatDZD(rest)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "paiements" && canFinance && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <div className="text-[10px] uppercase text-ink/50">Total facturé</div>
              <div className="text-xl font-serif text-petrol tabular-nums">
                {formatDZD(Number(summary?.quoted_total ?? 0))}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <div className="text-[10px] uppercase text-ink/50">Valeur acceptée</div>
              <div className="text-xl font-serif text-petrol tabular-nums">
                {formatDZD(Number(summary?.accepted_value ?? 0))}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <div className="text-[10px] uppercase text-ink/50">Encaissé</div>
              <div className="text-xl font-serif text-emerald-700 tabular-nums">
                {formatDZD(Number(summary?.collected ?? 0))}
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-black/5 p-4">
              <div className="text-[10px] uppercase text-ink/50">Solde restant</div>
              <div
                className={`text-xl font-serif tabular-nums ${Number(summary?.outstanding ?? 0) > 0 ? "text-red-600" : "text-petrol"}`}
              >
                {formatDZD(Number(summary?.outstanding ?? 0))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setPayOpen({})}
              className="inline-flex items-center gap-1 rounded-full bg-petrol text-ivory px-3 py-1.5 text-xs hover:bg-ink"
            >
              <Plus className="h-3 w-3" /> Enregistrer un paiement
            </button>
          </div>

          {payments.length === 0 ? (
            <EmptyState title="Aucun paiement enregistré pour ce patient" icon={Wallet} />
          ) : (
            <>
              <div className="hidden md:block rounded-2xl bg-white border border-black/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-ink/50 border-b border-black/5">
                    <tr>
                      <th className="text-left px-4 py-2">Date</th>
                      <th className="text-left">Méthode</th>
                      <th className="text-left">Devis</th>
                      <th className="text-left">Traitement</th>
                      <th className="text-left">Référence</th>
                      <th className="text-right px-4">Montant</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((pay) => (
                      <tr key={pay.id} className="border-t border-black/5">
                        <td className="px-4 py-2">{formatDateTime(pay.paid_at)}</td>
                        <td>{PAYMENT_METHOD_LABELS[pay.method] ?? pay.method}</td>
                        <td className="text-ink/70">
                          {pay.quotes?.quote_number ? (
                            <button
                              onClick={() => setOpenQuoteId(pay.quote_id)}
                              className="font-mono text-xs text-teal hover:underline"
                            >
                              {pay.quotes.quote_number}
                            </button>
                          ) : (
                            <span className="text-ink/40">—</span>
                          )}
                        </td>
                        <td className="text-ink/70">
                          {pay.patient_treatments?.treatments?.name ?? "—"}
                        </td>
                        <td className="text-ink/60 text-xs">{pay.payment_reference ?? "—"}</td>
                        <td className="text-right px-4 text-petrol tabular-nums">
                          {formatDZD(Number(pay.amount))}
                        </td>
                        <td className="text-right pr-3">
                          {isAdmin && (
                            <button
                              onClick={() => deletePayment(pay)}
                              className="text-ink/30 hover:text-red-500"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-black/10 font-medium">
                      <td className="px-4 py-2">Total</td>
                      <td colSpan={4}></td>
                      <td className="text-right px-4 text-emerald-700 tabular-nums">
                        {formatDZD(totalPaid)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-2">
                {payments.map((pay) => (
                  <div key={pay.id} className="rounded-2xl bg-white border border-black/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-petrol text-sm">
                          {PAYMENT_METHOD_LABELS[pay.method] ?? pay.method}
                        </div>
                        <div className="text-[10px] text-ink/50">{formatDateTime(pay.paid_at)}</div>
                      </div>
                      <div className="text-emerald-700 font-serif text-lg tabular-nums">
                        {formatDZD(Number(pay.amount))}
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] text-ink/60">
                      {pay.quotes?.quote_number && (
                        <button
                          onClick={() => setOpenQuoteId(pay.quote_id)}
                          className="rounded-full bg-mint/60 px-2 py-0.5 text-petrol font-mono"
                        >
                          {pay.quotes.quote_number}
                        </button>
                      )}
                      {pay.patient_treatments?.treatments?.name && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5">
                          {pay.patient_treatments.treatments.name}
                        </span>
                      )}
                      {pay.payment_reference && (
                        <span className="text-ink/50">Réf. {pay.payment_reference}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "financial" && canFinance && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-black/5 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg text-petrol flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Traitements
              </h3>
              <button
                onClick={() => setShowTForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-mint text-petrol px-3 py-1.5 text-xs hover:bg-teal/40"
              >
                <Plus className="h-3 w-3" /> Ajouter
              </button>
            </div>
            {showTForm && (
              <div className="mb-4 grid md:grid-cols-4 gap-2 rounded-xl bg-mint/30 p-3">
                <select
                  value={tForm.treatment_id}
                  onChange={(e) => setTForm({ ...tForm, treatment_id: e.target.value })}
                  className="rounded-lg border border-black/10 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">— Traitement (catalogue) —</option>
                  {catalog.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Montant convenu (DZD)"
                  value={tForm.agreed_value}
                  onChange={(e) => setTForm({ ...tForm, agreed_value: e.target.value })}
                  className="rounded-lg border border-black/10 px-2 py-1.5 text-sm"
                />
                <select
                  value={tForm.status}
                  onChange={(e) => setTForm({ ...tForm, status: e.target.value })}
                  className="rounded-lg border border-black/10 px-2 py-1.5 text-sm bg-white"
                >
                  {TREATMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {TREATMENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addTreatment}
                  className="rounded-lg bg-petrol text-ivory px-3 py-1.5 text-sm hover:bg-ink"
                >
                  Enregistrer
                </button>
              </div>
            )}
            {treatments.length === 0 ? (
              <EmptyState title="Aucun traitement" description="Ajoutez le premier plan de soin." />
            ) : (
              <div className="space-y-2">
                {treatments.map((t) => {
                  const linkedQuote = t.quotes;
                  const due = Number(t.agreed_value ?? t.expected_value ?? 0);
                  const paid = paidForTreatment(t.id);
                  const rest = due - paid;
                  const payStatus = paymentStatusLabel(due, paid, Boolean(linkedQuote));
                  return (
                    <div key={t.id} className="rounded-xl border border-black/5 p-3 bg-white">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="min-w-0">
                          <div className="text-petrol font-medium">
                            {t.treatments?.name ?? "Traitement personnalisé"}
                          </div>
                          <div className="text-[10px] text-ink/50 mt-0.5 flex flex-wrap items-center gap-2">
                            <select
                              value={t.status ?? "proposal"}
                              onChange={(e) => updateTreatmentStatus(t, e.target.value)}
                              className={`text-[10px] rounded-full border px-2 py-0.5 bg-white ${TREATMENT_STATUS_TONE[t.status] ?? "text-petrol"}`}
                            >
                              {TREATMENT_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {TREATMENT_STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${payStatus.tone}`}
                            >
                              {payStatus.label}
                            </span>
                            {linkedQuote?.quote_number && (
                              <button
                                onClick={() => setOpenQuoteId(linkedQuote.id)}
                                className="font-mono text-teal hover:underline"
                              >
                                {linkedQuote.quote_number}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-[10px] text-ink/50">Dû / Payé / Reste</div>
                            <div className="text-sm tabular-nums text-petrol">
                              {formatDZD(due)} ·{" "}
                              <span className="text-emerald-700">{formatDZD(paid)}</span> ·{" "}
                              <span className={rest > 0 ? "text-red-600" : "text-ink/50"}>
                                {formatDZD(Math.max(0, rest))}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeTreatment(t)}
                            className="text-ink/30 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {openQuoteId && (
        <QuoteDrawer
          id={openQuoteId}
          canWrite={canFinance}
          patientContext
          onClose={() => {
            setOpenQuoteId(null);
            loadAll();
          }}
        />
      )}
      {newQuoteOpen && (
        <NewQuoteModal
          patientId={id}
          onClose={() => setNewQuoteOpen(false)}
          onCreated={(qid) => {
            setNewQuoteOpen(false);
            setTab("devis");
            setOpenQuoteId(qid);
            loadAll();
          }}
        />
      )}
      {payOpen && canFinance && (
        <PaymentModal
          patientId={id}
          quoteId={payOpen.quoteId ?? null}
          remaining={payOpen.remaining}
          onClose={() => setPayOpen(null)}
          onDone={() => {
            setPayOpen(null);
            loadAll();
          }}
        />
      )}
    </div>
  );
}
