import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { formatDZD } from "@/lib/admin/utils";
import { Stethoscope, Plus, Pencil, Trash2 } from "lucide-react";
import { runMutation } from "@/lib/admin/mutation-utils";

export const Route = createFileRoute("/admin/traitements")({
  head: () => ({ meta: [{ title: "Traitements — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: TreatmentsPage,
});

function TreatmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    supabase.from("treatments").select("*").order("name").then(({ data }) => setItems(data ?? []));
  }, [showNew, editing, reloadKey]);

  return (
    <div>
      <PageHeader title="Catalogue de traitements"
        actions={<button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink"><Plus className="h-4 w-4" /> Ajouter</button>} />
      {items.length === 0 ? <EmptyState title="Aucun traitement" description="Ajoutez votre premier traitement au catalogue." icon={Stethoscope} /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((t) => (
            <button key={t.id} onClick={() => setEditing(t)} className="text-left rounded-2xl bg-white border border-black/5 p-5 hover:border-petrol/30 hover:shadow-sm transition group">
              <div className="flex items-start justify-between mb-2">
                <div className="font-serif text-lg text-petrol">{t.name}</div>
                <span className="h-3 w-3 rounded-full mt-2" style={{ backgroundColor: t.color }} />
              </div>
              <div className="text-xs text-ink/60">{t.category ?? "—"}</div>
              <div className="mt-3 text-sm text-petrol">
                {t.price_min != null || t.price_max != null
                  ? `${formatDZD(t.price_min)}${t.price_max != null && t.price_max !== t.price_min ? ` – ${formatDZD(t.price_max)}` : ""}`
                  : <span className="text-ink/40">Prix à définir</span>}
              </div>
              <div className="text-[11px] text-ink/50 mt-1 flex items-center justify-between">
                <span>Durée moyenne : {t.default_duration_min} min</span>
                <span className="inline-flex items-center gap-1 text-petrol/60 opacity-0 group-hover:opacity-100 transition"><Pencil className="h-3 w-3" /> Modifier</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {showNew && <TreatmentModal onClose={() => setShowNew(false)} onSaved={() => setReloadKey((k) => k + 1)} />}
      {editing && <TreatmentModal treatment={editing} onClose={() => setEditing(null)} onSaved={() => setReloadKey((k) => k + 1)} />}
    </div>
  );
}

function TreatmentModal({ treatment, onClose, onSaved }: { treatment?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = Boolean(treatment);
  const [name, setName] = useState(treatment?.name ?? "");
  const [category, setCategory] = useState(treatment?.category ?? "");
  const [priceMin, setPriceMin] = useState(treatment?.price_min?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(treatment?.price_max?.toString() ?? "");
  const [duration, setDuration] = useState(treatment?.default_duration_min?.toString() ?? "60");

  const busyRef = useRef(false);
  async function save() {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(), category: category || null,
      price_min: priceMin ? Number(priceMin) : null,
      price_max: priceMax ? Number(priceMax) : (priceMin ? Number(priceMin) : null),
      default_duration_min: Number(duration) || 60,
    };
    const res = await runMutation(async () => {
      if (isEdit) {
        const { error } = await supabase.from("treatments").update(payload).eq("id", treatment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("treatments").insert(payload);
        if (error) throw error;
      }
    }, { busyRef, successMessage: isEdit ? "Traitement mis à jour" : "Traitement ajouté" });
    if (res.ok) { onSaved(); onClose(); }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm(`Supprimer « ${treatment.name} » du catalogue ?`)) return;
    const res = await runMutation(async () => {
      const { error } = await supabase.from("treatments").delete().eq("id", treatment.id);
      if (error) throw error;
    }, { busyRef, successMessage: "Traitement supprimé" });
    if (res.ok) { onSaved(); onClose(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-xl text-petrol mb-4">{isEdit ? "Modifier le traitement" : "Nouveau traitement"}</h3>
        <div className="space-y-3">
          <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Nom</div><input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
          <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Catégorie</div><input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Prix min (DA)</div><input inputMode="numeric" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Prix max (DA)</div><input inputMode="numeric" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
            <label className="block"><div className="text-[11px] uppercase text-ink/50 mb-1">Durée (min)</div><input inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm" /></label>
          </div>
        </div>
        <div className="mt-5 flex justify-between items-center gap-2">
          <div>
            {isEdit && (
              <button onClick={remove} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /> Supprimer</button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-ink/60">Annuler</button>
            <button onClick={save} className="rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink">{isEdit ? "Enregistrer" : "Créer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
