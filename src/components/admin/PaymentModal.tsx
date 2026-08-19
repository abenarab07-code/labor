import { useRef, useState } from "react";
import { toast } from "sonner";
import { formatDZD } from "@/lib/admin/utils";
import { PAYMENT_METHODS, recordPayment } from "@/lib/admin/payments";
import { runMutation } from "@/lib/admin/mutation-utils";

export function PaymentModal({ patientId, quoteId, treatmentId, remaining, onClose, onDone }: {
  patientId: string;
  quoteId?: string | null;
  treatmentId?: string | null;
  remaining?: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    amount: remaining && remaining > 0 ? String(remaining) : "",
    method: "cash",
    reference: "",
    note: "",
    paid_at: new Date().toISOString().slice(0, 16),
  });
  const [override, setOverride] = useState(false);
  const busy = useRef(false);

  async function save() {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { toast.error("Montant invalide"); return; }
    const r = await runMutation(() => recordPayment({
      patient_id: patientId, amount: amt, method: form.method,
      quote_id: quoteId ?? null, patient_treatment_id: treatmentId ?? null,
      payment_reference: form.reference || null, note: form.note || null,
      paid_at: new Date(form.paid_at).toISOString(),
      allow_overpayment: override,
    }), { busyRef: busy, successMessage: "Paiement enregistré" });
    if (r.ok) onDone();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl p-5 max-w-md w-full">
        <div className="font-serif text-lg text-petrol mb-3">Enregistrer un paiement</div>
        {remaining !== undefined && quoteId && (
          <div className="text-xs text-ink/60 mb-2">Solde restant : <b className="text-petrol">{formatDZD(remaining)}</b></div>
        )}
        <div className="space-y-2 text-sm">
          <Field label="Montant">
            <input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" />
          </Field>
          <Field label="Méthode">
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none">
              {PAYMENT_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </Field>
          <Field label="Référence (optionnel)">
            <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" />
          </Field>
          <Field label="Date">
            <input type="datetime-local" value={form.paid_at} onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" />
          </Field>
          <Field label="Note">
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full rounded-xl border border-black/10 px-3 py-2 focus:border-teal outline-none" />
          </Field>
          {quoteId && remaining !== undefined && Number(form.amount) > remaining && (
            <label className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
              <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
              Autoriser un dépassement du solde ({formatDZD(remaining)})
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-full border border-black/10">Annuler</button>
          <button onClick={save} className="px-3 py-1.5 text-sm rounded-full bg-petrol text-ivory">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase text-ink/50 mb-1">{label}</div>
      {children}
    </label>
  );
}
