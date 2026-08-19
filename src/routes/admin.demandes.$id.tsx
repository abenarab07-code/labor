import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, CallLink, WhatsAppLink } from "@/components/admin/AdminShell";
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  formatDateTime,
  formatRelative,
  logActivity,
} from "@/lib/admin/utils";
import { runMutation } from "@/lib/admin/mutation-utils";
import { toast } from "sonner";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/demandes/$id")({
  head: () => ({
    meta: [{ title: "Demande — Clinic OS" }, { name: "robots", content: "noindex" }],
  }),
  component: RequestDetail,
});

function RequestDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [req, setReq] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [converting, setConverting] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("appointment_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setReq(data);
      const { data: acts } = await supabase
        .from("patient_activities")
        .select("*")
        .eq("request_id", id)
        .order("created_at", { ascending: false });
      setActivities(acts ?? []);
      // Suggestions de patients existants (par téléphone / nom)
      const { data: sugg } = await (supabase.rpc as any)("suggest_patients_for_request", {
        _request_id: id,
      });
      setMatches(sugg ?? []);
    }
    load();
    const ch = supabase
      .channel(`req-${id}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "patient_activities",
          filter: `request_id=eq.${id}`,
        },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointment_requests", filter: `id=eq.${id}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id]);

  const busyRef = useRef(false);

  async function setStatus(newStatus: string) {
    if (!req) return;
    await runMutation(
      async () => {
        let q = supabase
          .from("appointment_requests")
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (req.updated_at) q = q.eq("updated_at", req.updated_at);
        const { data, error } = await q.select("id").maybeSingle();
        if (error) throw error;
        if (!data)
          throw new Error(
            "Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.",
          );
        await logActivity({
          request_id: id,
          type: "status_change",
          summary: `Statut lead → ${REQUEST_STATUS_LABELS[newStatus] ?? newStatus}`,
        });
      },
      { busyRef, successMessage: "Statut mis à jour" },
    );
  }

  async function addActivityNote() {
    const text = noteBody.trim();
    if (!text) return;
    const r = await runMutation(
      async () => {
        await logActivity({ request_id: id, type: "note", summary: text });
      },
      { busyRef, successMessage: "Note ajoutée" },
    );
    if (r.ok) setNoteBody("");
  }

  async function convertToPatient(existingPatientId?: string) {
    if (!req) return;
    setConverting(true);
    const res = await runMutation(
      async () => {
        const { data: patientId, error } = await (supabase.rpc as any)(
          "convert_request_to_patient",
          {
            _request_id: id,
            _existing_patient_id: existingPatientId ?? null,
          },
        );
        if (error) throw error;
        if (!patientId) throw new Error("La conversion a échoué. Rien n'a été modifié.");
        return patientId as string;
      },
      {
        successMessage: existingPatientId
          ? "Demande liée au patient existant"
          : "Patient créé et lié",
      },
    );
    setConverting(false);
    if (res.ok) navigate({ to: "/admin/patients/$id", params: { id: res.data } });
  }

  if (!req) return <div className="text-sm text-ink/50">Chargement…</div>;

  return (
    <div>
      <Link
        to="/admin/demandes"
        search={{ status: "all", q: "" }}
        className="inline-flex items-center gap-1 text-xs text-ink/60 hover:text-petrol mb-3"
      >
        <ArrowLeft className="h-3 w-3" /> Retour aux demandes
      </Link>
      <PageHeader
        title={req.name}
        subtitle={`Demande reçue ${formatRelative(req.created_at)} · ${req.source_page ?? "site"}`}
        actions={
          <>
            <CallLink
              phone={req.phone_e164}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-black/10 px-4 py-2 text-sm text-petrol hover:bg-mint"
            />
            <WhatsAppLink
              phone={req.phone_e164}
              message={`Bonjour ${req.name}, Laboratoire Dr Tarfaya.`}
              className="inline-flex items-center gap-2 rounded-full bg-teal text-petrol px-4 py-2 text-sm hover:bg-teal/90"
            />
            <button
              onClick={() => convertToPatient()}
              disabled={converting || !!req.converted_patient_id}
              className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink disabled:opacity-60"
            >
              {converting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {req.converted_patient_id ? "Patient déjà créé" : "Convertir en patient"}
            </button>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white border border-black/5 p-5">
            <h3 className="font-serif text-lg text-petrol mb-4">Informations</h3>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              <Field label="Nom" value={req.name} />
              <Field label="Téléphone" value={req.phone_e164} />
              <Field label="Traitement demandé" value={req.treatment ?? "—"} />
              <Field label="Méthode de contact" value={req.contact_method} />
              <Field label="Date souhaitée" value={req.preferred_date ?? "—"} />
              <Field label="Créneau" value={req.preferred_time ?? "—"} />
              <Field label="Source" value={req.source_page ?? "—"} />
              <Field label="Reçue" value={formatDateTime(req.created_at)} />
            </dl>
            {req.message && (
              <div className="mt-4 pt-4 border-t border-black/5">
                <div className="text-[10px] uppercase tracking-wider text-ink/50 mb-2">Message</div>
                <p className="text-sm text-ink/80 whitespace-pre-wrap">{req.message}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-black/5 p-5">
            <h3 className="font-serif text-lg text-petrol mb-3">Ajouter une note</h3>
            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={3}
              placeholder="Résumé de l'échange, prochaine étape…"
              className="w-full rounded-xl border border-black/10 p-3 text-sm outline-none focus:border-teal"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={addActivityNote}
                className="rounded-full bg-petrol text-ivory px-4 py-2 text-sm hover:bg-ink"
              >
                Ajouter
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-black/5 p-5">
            <h3 className="font-serif text-lg text-petrol mb-3">Historique</h3>
            {activities.length === 0 ? (
              <div className="text-sm text-ink/50">Aucun événement encore.</div>
            ) : (
              <ul className="space-y-3">
                {activities.map((a) => (
                  <li key={a.id} className="flex gap-3 text-sm">
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
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-black/5 p-5">
            <h3 className="font-serif text-lg text-petrol mb-1">Statut lead</h3>
            <p className="text-[11px] text-ink/50 mb-3">
              Cycle d'acquisition — indépendant des rendez-vous et traitements.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REQUEST_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`text-[11px] rounded-full px-2.5 py-1 border ${
                    req.status === s
                      ? "bg-petrol text-ivory border-petrol"
                      : "bg-white text-ink/70 border-black/10 hover:border-petrol/30"
                  }`}
                >
                  {REQUEST_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {!req.converted_patient_id && matches.length > 0 && (
            <div className="rounded-2xl bg-white border border-black/5 p-5">
              <h3 className="font-serif text-lg text-petrol mb-1">Patients potentiels</h3>
              <p className="text-[11px] text-ink/50 mb-3">
                Correspondances par téléphone / nom — évite les doublons.
              </p>
              <ul className="space-y-2">
                {matches.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-black/5 p-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-petrol truncate">{m.full_name}</div>
                      <div className="text-[11px] text-ink/50">{m.phone_e164}</div>
                    </div>
                    <button
                      disabled={converting}
                      onClick={() => convertToPatient(m.id)}
                      className="text-[11px] rounded-full bg-mint text-petrol border border-petrol/15 px-3 py-1 hover:bg-teal/30 disabled:opacity-50"
                    >
                      Lier
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {req.converted_patient_id && (
            <Link
              to="/admin/patients/$id"
              params={{ id: req.converted_patient_id }}
              className="block rounded-2xl bg-mint p-5 border border-teal/20 hover:bg-mint/70"
            >
              <div className="text-xs text-petrol/70">Patient lié</div>
              <div className="text-sm font-medium text-petrol mt-1">Ouvrir la fiche patient →</div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-ink/50">{label}</dt>
      <dd className="text-petrol">{value}</dd>
    </div>
  );
}
