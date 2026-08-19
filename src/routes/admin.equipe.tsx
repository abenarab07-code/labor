import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/admin/AdminShell";
import { UserCog, UserPlus, X, Loader2 } from "lucide-react";
import { formatRelative, initials } from "@/lib/admin/utils";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { inviteTeamMemberFn, setTeamMemberActiveFn } from "@/lib/admin/team.functions";
import { runMutation } from "@/lib/admin/mutation-utils";
import { RequireAdmin } from "@/components/admin/RequireRole";

export const Route = createFileRoute("/admin/equipe")({
  head: () => ({ meta: [{ title: "Équipe — Clinic OS" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RequireAdmin>
      <TeamPage />
    </RequireAdmin>
  ),
});

type StaffRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  job_title: string | null;
  is_active: boolean;
  created_at: string;
  roles: string[];
};

function TeamPage() {
  const [items, setItems] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    const [{ data: staff, error: e1 }, { data: roles, error: e2 }] = await Promise.all([
      supabase.from("staff_profiles").select("*").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    const byUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const list = byUser.get(r.user_id) ?? [];
      list.push(r.role);
      byUser.set(r.user_id, list);
    });
    setItems(
      (staff ?? []).map((s: any) => ({ ...s, roles: byUser.get(s.user_id) ?? [] })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setActive = useServerFn(setTeamMemberActiveFn);
  const busyRef = useRef(false);
  async function toggle(s: StaffRow) {
    const r = await runMutation(
      () => setActive({ data: { userId: s.user_id, active: !s.is_active } }),
      { busyRef, successMessage: s.is_active ? "Désactivé" : "Réactivé" },
    );
    if (r.ok) load();
  }

  return (
    <div>
      <PageHeader
        title="Équipe"
        subtitle="Membres du cabinet ayant accès au Clinic OS"
        actions={
          <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink">
            <UserPlus className="h-4 w-4" /> Inviter un membre
          </button>
        }
      />
      {loading ? (
        <div className="text-sm text-ink/50">Chargement…</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun membre"
          description="Invitez votre premier collaborateur pour lui donner accès."
          icon={UserCog}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((s) => {
            const primaryRole = s.roles.includes("admin") ? "admin" : s.roles[0] ?? "membre";
            return (
              <div key={s.id} className="rounded-2xl bg-white border border-black/5 p-5 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-teal/20 text-teal flex items-center justify-center font-medium">
                  {initials(s.full_name || s.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-petrol truncate">{s.full_name || s.email}</div>
                  <div className="text-xs text-ink/50 truncate">
                    {s.job_title ?? primaryRole} · rejoint {formatRelative(s.created_at)}
                  </div>
                  {s.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.roles.map((r) => (
                        <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-mint text-petrol uppercase tracking-wider">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggle(s)}
                  title={s.is_active ? "Désactiver" : "Réactiver"}
                  className={`text-[10px] px-2 py-1 rounded-full border ${s.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-neutral-100 text-neutral-500 border-neutral-200"}`}
                >
                  {s.is_active ? "Actif" : "Inactif"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onDone={() => { setShowInvite(false); load(); }} />}
    </div>
  );
}

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState<"admin" | "reception" | "practitioner" | "marketing">("reception");
  const [submitting, setSubmitting] = useState(false);
  const invite = useServerFn(inviteTeamMemberFn);
  const busyRef = useRef(false);

  async function submit() {
    if (!email.trim() || !fullName.trim()) return toast.error("Nom et email requis");
    setSubmitting(true);
    const r = await runMutation(
      () => invite({ data: { email: email.trim(), fullName: fullName.trim(), role, jobTitle: jobTitle || null } }),
      { busyRef, successMessage: "Invitation envoyée" },
    );
    setSubmitting(false);
    if (r.ok) onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl text-petrol">Inviter un membre</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-ink/50" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nom complet *" value={fullName} onChange={setFullName} />
          <Field label="Email *" value={email} onChange={setEmail} placeholder="prenom@cabinet.dz" />
          <Field label="Fonction" value={jobTitle} onChange={setJobTitle} placeholder="Réceptionniste, hygiéniste…" />
          <label className="block">
            <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-1">Rôle *</div>
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-teal">
              <option value="admin">Admin</option>
              <option value="reception">Réception</option>
              <option value="practitioner">Praticien</option>
              <option value="marketing">Marketing</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-ink/60 hover:text-petrol">Annuler</button>
          <button onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink disabled:opacity-60">
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Envoyer l'invitation
          </button>
        </div>
        <p className="text-[11px] text-ink/40 mt-3">
          Un email d'invitation sera envoyé pour finaliser la création du compte.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-ink/50 mb-1">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-teal" />
    </label>
  );
}
