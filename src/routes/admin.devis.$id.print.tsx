import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDZD, formatDate } from "@/lib/admin/utils";
import { QUOTE_STATUS_LABELS } from "@/lib/admin/quotes";
import { clinic } from "@/content/clinic";

export const Route = createFileRoute("/admin/devis/$id/print")({
  head: () => ({ meta: [{ title: "Devis — Impression" }, { name: "robots", content: "noindex" }] }),
  component: PrintQuote,
});

function PrintQuote() {
  const { id } = Route.useParams();
  const [quote, setQuote] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    (async () => {
      const [q, it, s] = await Promise.all([
        supabase.from("quotes").select("*, patients(full_name, phone_e164, address)").eq("id", id).maybeSingle(),
        supabase.from("quote_items").select("*").eq("quote_id", id).order("sort_order", { ascending: true }),
        supabase.from("clinic_settings").select("value").eq("key", "clinic").maybeSingle(),
      ]);
      setQuote(q.data); setItems(it.data ?? []); setSettings(s.data?.value ?? {});
      setTimeout(() => window.print(), 400);
    })();
  }, [id]);

  if (!quote) return <div className="p-8 text-sm text-ink/50">Chargement…</div>;

  const name = settings.clinic_name ?? clinic.fullName;
  const address = settings.address ?? `${clinic.address.line1}, ${clinic.address.city}`;
  const phone = settings.phone ?? clinic.phone;
  const wa = settings.whatsapp ?? clinic.whatsapp;
  const email = settings.email ?? clinic.email;

  return (
    <div className="min-h-screen bg-white text-ink print:bg-white">
      <style>{`@media print { @page { size: A4; margin: 18mm; } body { background: white; } .no-print { display: none !important; } }`}</style>
      <div className="max-w-[210mm] mx-auto p-10 text-[13px] leading-relaxed">
        <div className="flex items-start justify-between border-b border-petrol/20 pb-6">
          <div>
            <div className="font-serif text-2xl text-petrol">{name}</div>
            <div className="text-ink/70 mt-1">{address}</div>
            <div className="text-ink/70">Tél : {phone} · WhatsApp : {wa}</div>
            <div className="text-ink/70">{email}</div>
          </div>
          <div className="text-right">
            <div className="font-serif text-3xl text-petrol">DEVIS</div>
            <div className="mt-1 font-mono text-sm text-ink/70">{quote.quote_number || quote.reference}</div>
            <div className="text-xs text-ink/60">Émis le {formatDate(quote.created_at)}</div>
            {quote.expires_at && <div className="text-xs text-ink/60">Valable jusqu'au {formatDate(quote.expires_at)}</div>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] uppercase text-ink/50 tracking-wider">Patient</div>
            <div className="font-medium text-petrol">{quote.patients?.full_name}</div>
            {quote.patients?.phone_e164 && <div className="text-ink/70">{quote.patients.phone_e164}</div>}
          </div>
          <div>
            <div className="text-[10px] uppercase text-ink/50 tracking-wider">Statut</div>
            <div className="font-medium text-petrol">{QUOTE_STATUS_LABELS[quote.status]}</div>
            {quote.title && <div className="text-ink/70 mt-1">{quote.title}</div>}
          </div>
        </div>

        <table className="w-full mt-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-petrol/40 text-[11px] uppercase tracking-wider text-petrol">
              <th className="text-left py-2">Prestation</th>
              <th className="text-right py-2 w-14">Qté</th>
              <th className="text-right py-2 w-24">PU</th>
              <th className="text-right py-2 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-black/10 align-top">
                <td className="py-2">
                  <div>{it.label}</div>
                  {it.description && <div className="text-xs text-ink/60">{it.description}</div>}
                </td>
                <td className="text-right py-2 tabular-nums">{Number(it.quantity)}</td>
                <td className="text-right py-2 tabular-nums">{formatDZD(Number(it.unit_price))}</td>
                <td className="text-right py-2 tabular-nums">{formatDZD(Number(it.total))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3} className="text-right py-1 text-ink/70">Sous-total</td><td className="text-right py-1 tabular-nums">{formatDZD(Number(quote.amount))}</td></tr>
            {Number(quote.discount) > 0 && <tr><td colSpan={3} className="text-right py-1 text-ink/70">Remise</td><td className="text-right py-1 tabular-nums">- {formatDZD(Number(quote.discount))}</td></tr>}
            <tr className="border-t-2 border-petrol/40 font-serif text-lg text-petrol">
              <td colSpan={3} className="text-right py-3">Total à régler</td>
              <td className="text-right py-3 tabular-nums">{formatDZD(Number(quote.final_amount))}</td>
            </tr>
          </tfoot>
        </table>

        {quote.patient_note && (
          <div className="mt-6">
            <div className="text-[10px] uppercase text-ink/50 tracking-wider">Notes</div>
            <div className="text-ink/80 whitespace-pre-wrap">{quote.patient_note}</div>
          </div>
        )}

        <div className="mt-16 grid grid-cols-2 gap-10">
          <div>
            <div className="border-t border-black/30 pt-2 text-xs text-ink/60">Cachet & signature du praticien</div>
          </div>
          <div>
            <div className="border-t border-black/30 pt-2 text-xs text-ink/60">Bon pour accord — signature patient</div>
          </div>
        </div>

        <div className="mt-10 pt-4 border-t border-black/10 text-[10px] text-ink/50 text-center">
          {name} · {address} · {phone}
        </div>

        <div className="no-print mt-6 flex justify-end gap-2">
          <button onClick={() => window.print()} className="rounded-full bg-petrol text-ivory px-5 py-2 text-sm">Imprimer</button>
        </div>
      </div>
    </div>
  );
}
