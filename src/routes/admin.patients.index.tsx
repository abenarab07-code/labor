import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState, CallLink, WhatsAppLink } from "@/components/admin/AdminShell";
import { Users, Plus, X, Loader2 } from "lucide-react";
import { formatDZD, formatRelative } from "@/lib/admin/utils";
import { toast } from "sonner";
import { runMutation } from "@/lib/admin/mutation-utils";
import { createPatient } from "@/lib/admin/patients";
import { normalizePhone } from "@/lib/admin/phone";

export const Route = createFileRoute("/admin/patients/")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === "string" ? s.q : "",
    status: typeof s.status === "string" ? s.status : "all",
    new: s.new === "1" ? "1" : undefined,
  }),
  head: () => ({
    meta: [{ title: "Patients — Clinic OS" }, { name: "robots", content: "noindex" }],
  }),
  component: PatientsPage,
});

const LIFECYCLE = ["lead", "prospect", "actif", "en_traitement", "termine", "dormant", "perdu"];

function PatientsPage() {
  const { q, status, new: isNew } = useSearch({ from: "/admin/patients/" });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(isNew === "1");

  useEffect(() => {
    setShowNew(isNew === "1");
  }, [isNew]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let query = supabase
        .from("patients")
        .select(
          "id, full_name, phone_e164, lifecycle_status, temperature, estimated_value, treatment_interest, last_contact_at, created_at",
        )
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(200);
      if (status !== "all") query = query.eq("lifecycle_status", status);
      if (q) {
        const norm = normalizePhone(q);
        const clauses = [`full_name.ilike.%${q}%`];
        if (norm) clauses.push(`phone_normalized.ilike.%${norm}%`);
        query = query.or(clauses.join(","));
      }
      const { data } = await query;
      if (!cancelled) {
        setItems(data ?? []);
        setLoading(false);
      }
    }
    load();
    const ch = supabase
      .channel(`patients-live-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, load)
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [q, status]);

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Base patients — leads, prospects, actifs et historique"
        actions={
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink"
          >
            <Plus className="h-4 w-4" /> Nouveau patient
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          to="/admin/patients"
          search={{ status: "all", q } as any}
          className={pill(status === "all")}
        >
          Tous
        </Link>
        {LIFECYCLE.map((s) => (
          <Link
            key={s}
            to="/admin/patients"
            search={{ status: s, q } as any}
            className={pill(status === s)}
          >
            {s}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-ink/50">Chargement…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun patient"
          description="Créez ou convertissez une demande."
          icon={Users}
        />
      ) : (
        <div className="rounded-2xl bg-white border border-black/5 overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_180px_140px_140px_140px_160px] gap-3 px-4 py-3 border-b border-black/5 text-[10px] uppercase tracking-wider text-ink/50">
            <div>Patient</div>
            <div>Téléphone</div>
            <div>Statut</div>
            <div>Traitement</div>
            <div>Valeur estimée</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-black/5">
            {items.map((p) => (
              <div
                key={p.id}
                className="grid md:grid-cols-[1fr_180px_140px_140px_140px_160px] gap-3 px-4 py-3 items-center hover:bg-mint/20"
              >
                <Link to="/admin/patients/$id" params={{ id: p.id }} className="min-w-0">
                  <div className="text-sm font-medium text-petrol truncate">{p.full_name}</div>
                  <div className="text-[11px] text-ink/50">
                    {formatRelative(p.last_contact_at ?? p.created_at)}
                  </div>
                </Link>
                <div className="text-xs text-ink/60 hidden md:block">{p.phone_e164}</div>
                <div className="text-xs hidden md:block">
                  <span className="px-2 py-0.5 rounded-full bg-mint text-petrol border border-petrol/10 text-[11px]">
                    {p.lifecycle_status}
                  </span>
                </div>
                <div className="text-xs text-ink/60 hidden md:block truncate">
                  {p.treatment_interest ?? "—"}
                </div>
                <div className="text-xs text-petrol hidden md:block tabular-nums">
                  {formatDZD(Number(p.estimated_value ?? 0))}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <CallLink phone={p.phone_e164} />
                  <WhatsAppLink
                    phone={p.phone_e164}
                    message={`Bonjour ${p.full_name}, Laboratoire Dr Tarfaya.`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNew && <NewPatientModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

function pill(active: boolean) {
  return `text-[11px] rounded-full px-3 py-1.5 border capitalize transition-colors ${active ? "bg-petrol text-ivory border-petrol" : "bg-white text-ink/70 border-black/10 hover:border-petrol/30"}`;
}

function NewPatientModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [treatment, setTreatment] = useState("");
  const [saving, setSaving] = useState(false);

  const busyRef = useRef(false);
  async function save() {
    if (!name.trim() || !phone.trim()) return toast.error("Nom et téléphone requis");
    setSaving(true);
    const res = await runMutation(
      () =>
        createPatient({
          full_name: name,
          phone,
          email: email || null,
          treatment_interest: treatment || null,
          source: "manuel",
        }),
      { busyRef },
    );
    setSaving(false);
    if (!res.ok) return;
    const r = res.data!;
    if (r.ok) {
      toast.success("Patient créé");
      navigate({ to: "/admin/patients/$id", params: { id: r.id } });
    } else {
      toast.warning(`Un patient existe déjà avec ce numéro : ${r.existing.full_name}`);
      navigate({ to: "/admin/patients/$id", params: { id: r.existing.id } });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-petrol">Nouveau patient</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-ink/50" />
          </button>
        </div>
        <div className="space-y-3">
          <Input label="Nom complet *" value={name} onChange={setName} />
          <Input
            label="Téléphone *"
            value={phone}
            onChange={setPhone}
            placeholder="0555 12 34 56"
          />
          <Input label="Email" value={email} onChange={setEmail} />
          <Input label="Traitement d'intérêt" value={treatment} onChange={setTreatment} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink/60 hover:text-petrol">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Créer
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-1">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-teal"
      />
    </label>
  );
}
