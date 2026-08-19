import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/AdminShell";
import { Settings, Save, Loader2 } from "lucide-react";
import { RequireAdmin } from "@/components/admin/RequireRole";
import { runMutation } from "@/lib/admin/mutation-utils";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/parametres")({
  head: () => ({
    meta: [{ title: "Paramètres — Clinic OS" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <RequireAdmin>
      <SettingsPage />
    </RequireAdmin>
  ),
});

type SettingsShape = {
  clinic_name: string;
  practitioner_name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  opening_hours: string;
  closed_day: string;
  default_duration_min: number;
};

const DEFAULTS: SettingsShape = {
  clinic_name: "Laboratoire Dr Tarfaya",
  practitioner_name: "Dr. Babaammi Menoubia",
  address: "El Bouni, Annaba",
  phone: "",
  whatsapp: "",
  email: "",
  opening_hours: "Sam–Jeu · 09:00 – 18:00",
  closed_day: "Vendredi",
  default_duration_min: 30,
};

const KEY = "clinic";

function SettingsPage() {
  const [values, setValues] = useState<SettingsShape>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("value")
        .eq("key", KEY)
        .maybeSingle();
      if (error && error.code !== "PGRST116") toast.error(error.message);
      if (data?.value) setValues({ ...DEFAULTS, ...(data.value as any) });
      setLoading(false);
    })();
  }, []);

  function set<K extends keyof SettingsShape>(k: K, v: SettingsShape[K]) {
    setValues((s) => ({ ...s, [k]: v }));
  }

  async function save() {
    setSaving(true);
    const res = await runMutation(
      async () => {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("clinic_settings")
          .upsert(
            {
              key: KEY,
              value: values as any,
              updated_by: u.user?.id ?? null,
              updated_at: new Date().toISOString(),
            } as any,
            { onConflict: "key" },
          );
        if (error) throw error;
      },
      { busyRef, successMessage: "Paramètres enregistrés" },
    );
    setSaving(false);
    if (!res.ok) return;
  }

  if (loading) return <div className="text-sm text-ink/50">Chargement…</div>;

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Informations du cabinet et préférences par défaut"
        actions={
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{" "}
            Enregistrer
          </button>
        }
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Card icon={<Settings className="h-5 w-5 text-teal" />} title="Cabinet">
          <Field
            label="Nom du cabinet"
            value={values.clinic_name}
            onChange={(v) => set("clinic_name", v)}
          />
          <Field
            label="Praticien"
            value={values.practitioner_name}
            onChange={(v) => set("practitioner_name", v)}
          />
          <Field label="Adresse" value={values.address} onChange={(v) => set("address", v)} />
        </Card>
        <Card title="Contact">
          <Field
            label="Téléphone"
            value={values.phone}
            onChange={(v) => set("phone", v)}
            placeholder="+213 …"
          />
          <Field
            label="WhatsApp"
            value={values.whatsapp}
            onChange={(v) => set("whatsapp", v)}
            placeholder="+213 …"
          />
          <Field label="Email" value={values.email} onChange={(v) => set("email", v)} />
        </Card>
        <Card title="Horaires">
          <Field
            label="Horaires d'ouverture"
            value={values.opening_hours}
            onChange={(v) => set("opening_hours", v)}
          />
          <Field
            label="Jour de fermeture"
            value={values.closed_day}
            onChange={(v) => set("closed_day", v)}
          />
        </Card>
        <Card title="Agenda">
          <Field
            label="Durée RDV par défaut (min)"
            type="number"
            value={String(values.default_duration_min)}
            onChange={(v) => set("default_duration_min", Number(v) || 30)}
          />
          <p className="text-xs text-ink/50 mt-2">
            Utilisée quand aucun traitement n'est sélectionné.
          </p>
        </Card>
        <Card title="Relances devis">
          <p className="text-xs text-ink/60 leading-relaxed">
            Les relances automatiques sont générées depuis le bouton{" "}
            <span className="font-medium text-petrol">Générer les relances</span> disponible dans{" "}
            <span className="font-medium text-petrol">Suivis</span> et{" "}
            <span className="font-medium text-petrol">Devis</span>. Aucune tâche planifiée n'est
            active — la génération reste manuelle et déclenchée par l'équipe.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-black/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-serif text-lg text-petrol">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-1">{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-teal"
      />
    </label>
  );
}
