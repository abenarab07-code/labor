import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Phone,
} from "lucide-react";
import { allServices } from "@/content/services";
import { clinic } from "@/content/clinic";
import { submitAppointment } from "@/lib/appointments.functions";
import { track } from "@/lib/analytics";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useReducedMotionMode } from "@/motion/hooks";

type FormData = {
  service: string;
  name: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  contactMethod: "phone" | "whatsapp";
  consent: boolean;
};

const initial: FormData = {
  service: "",
  name: "",
  phone: "",
  preferredDate: "",
  preferredTime: "",
  message: "",
  contactMethod: "whatsapp",
  consent: false,
};

// Loose client-side phone check — server does the authoritative normalization.
const PHONE_RE = /^\+?[\d\s.\-()]{8,20}$/;

function makeIdempotencyKey(): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return rnd;
}

function tomorrowISO(): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Algiers",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const date = new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day) + 1,
    ),
  );
  return date.toISOString().slice(0, 10);
}

function readUTM(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ].forEach((k) => {
    const v = params.get(k);
    if (v) out[k] = v.slice(0, 200);
  });
  return Object.keys(out).length ? out : null;
}

export function AppointmentFunnel({
  initialService,
}: {
  initialService?: string;
}) {
  const normalizedInitialService =
    initialService &&
    allServices.some((service) => service.slug === initialService)
      ? initialService
      : "";
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    ...initial,
    service: normalizedInitialService,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const reducedMotion = useReducedMotionMode();
  const submitFn = useServerFn(submitAppointment);

  const minDate = tomorrowISO();

  const canNext =
    (step === 0 &&
      allServices.some((service) => service.slug === data.service)) ||
    (step === 1 &&
      data.name.trim().length >= 2 &&
      PHONE_RE.test(data.phone.replace(/\s/g, "")));

  const handleSubmit = async () => {
    if (submitting || done) return;
    if (!data.consent) {
      setError("Merci d'accepter d'être recontacté·e par le laboratoire.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const idempotencyKey = idempotencyKeyRef.current ?? makeIdempotencyKey();
      idempotencyKeyRef.current = idempotencyKey;
      const utm = readUTM();
      const sourcePage =
        typeof window !== "undefined" ? window.location.pathname : null;
      await submitFn({
        data: {
          treatment: data.service || null,
          name: data.name,
          phone: data.phone,
          preferredDate: data.preferredDate || null,
          preferredTime: data.preferredTime || null,
          message: data.message || null,
          contactMethod: data.contactMethod,
          consent: true,
          sourcePage,
          utm,
          idempotencyKey,
        },
      });
      track("appointment_submitted", {
        treatment: data.service || null,
        contact: data.contactMethod,
      });
      setDone(true);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Une erreur s'est produite. Merci de réessayer ou de nous contacter directement.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.5 }}
        className="rounded-3xl bg-mint p-10 md:p-14 text-center"
      >
        <div className="mx-auto h-16 w-16 rounded-full bg-petrol text-ivory flex items-center justify-center">
          <Check className="h-7 w-7" />
        </div>
        <h3 className="mt-6 font-serif text-3xl md:text-4xl text-petrol">
          Votre demande a bien été transmise.
        </h3>
        <p className="mt-4 text-ink/70 max-w-md mx-auto">
          L'équipe du laboratoire Dr Tarfaya vous contactera pour confirmer la
          prochaine étape.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={buildWhatsAppUrl("default", {
              sourcePage: "Confirmation RDV",
            })}
            onClick={() =>
              track("whatsapp_clicked", { from: "appointment_success" })
            }
            className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-6 py-3 text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            Nous écrire sur WhatsApp
          </a>
          <a
            href={clinic.phoneHref}
            onClick={() =>
              track("phone_clicked", { from: "appointment_success" })
            }
            className="inline-flex items-center gap-2 rounded-full border border-petrol/25 text-petrol px-6 py-3 text-sm"
          >
            <Phone className="h-4 w-4" />
            {clinic.phone}
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      className="rounded-3xl border border-border bg-card p-6 md:p-10"
      aria-busy={submitting}
      onSubmit={(event) => {
        event.preventDefault();
        if (step < 2) {
          if (canNext) setStep(step + 1);
          return;
        }
        void handleSubmit();
      }}
    >
      <div className="flex items-center gap-3 mb-8">
        {[0, 1, 2].map((s) => (
          <div key={s} className="flex-1">
            <div
              aria-current={s === step ? "step" : undefined}
              className={`h-1 rounded-full transition-colors ${
                s <= step ? "bg-teal" : "bg-border"
              }`}
            />
            <div className="mt-2 text-[0.68rem] uppercase tracking-wider text-ink/50">
              {["Demande", "Coordonnées", "Confirmation"][s]}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 && (
          <motion.div
            key="s0"
            initial={reducedMotion ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
          >
            <h3 className="font-serif text-2xl md:text-3xl text-petrol mb-6">
              Quelle est votre demande ?
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {allServices.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  aria-pressed={data.service === s.slug}
                  onClick={() => setData({ ...data, service: s.slug })}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    data.service === s.slug
                      ? "border-teal bg-mint/40 ring-2 ring-teal/30"
                      : "border-border hover:border-teal/40"
                  }`}
                >
                  <div className="font-serif text-lg text-petrol">{s.name}</div>
                  <div className="text-xs text-ink/60 mt-1">{s.short}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="s1"
            initial={reducedMotion ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
            className="space-y-5"
          >
            <h3 className="font-serif text-2xl md:text-3xl text-petrol mb-2">
              Vos coordonnées
            </h3>
            <Field
              label="Nom et prénom"
              value={data.name}
              onChange={(v) => setData({ ...data, name: v })}
              placeholder="Ex : Amina Kaci"
              maxLength={120}
            />
            <Field
              label="Téléphone"
              value={data.phone}
              onChange={(v) => setData({ ...data, phone: v })}
              placeholder="05 XX XX XX XX"
              type="tel"
              inputMode="tel"
              maxLength={30}
              hint="Numéro algérien (05, 06, 07…). Formats +213 et 00 213 acceptés."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Date préférée"
                value={data.preferredDate}
                onChange={(v) => setData({ ...data, preferredDate: v })}
                type="date"
                min={minDate}
                hint="Au moins 24 h à l'avance. Fermé le vendredi."
              />
              <div>
                <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
                  Heure préférée
                </label>
                <select
                  value={data.preferredTime}
                  onChange={(e) =>
                    setData({ ...data, preferredTime: e.target.value })
                  }
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 sm:text-sm"
                >
                  <option value="">Sans préférence</option>
                  <option value="matin">Matin</option>
                  <option value="apres-midi">Après-midi</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
                Comment préférez-vous être recontacté·e ?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["whatsapp", "phone"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={data.contactMethod === m}
                    onClick={() => setData({ ...data, contactMethod: m })}
                    className={`rounded-xl border py-3 text-sm transition-colors ${
                      data.contactMethod === m
                        ? "border-teal bg-mint/40 text-petrol"
                        : "border-border text-ink/70"
                    }`}
                  >
                    {m === "whatsapp" ? "WhatsApp" : "Appel téléphonique"}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="s2"
            initial={reducedMotion ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, x: -10 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-serif text-2xl md:text-3xl text-petrol mb-2">
              Une précision à ajouter ?
            </h3>
            <label className="block">
              <span className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
                Message (optionnel)
              </span>
              <textarea
                value={data.message}
                onChange={(e) => setData({ ...data, message: e.target.value })}
                rows={4}
                maxLength={1000}
                className="w-full rounded-xl border border-input bg-background p-4 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 sm:text-sm"
                placeholder="Décrivez brièvement votre situation si vous le souhaitez."
              />
            </label>

            <div className="rounded-xl bg-mint/40 p-4 text-sm text-petrol">
              <div className="font-medium mb-1">Récapitulatif</div>
              <ul className="text-ink/70 space-y-0.5">
                <li>
                  Demande :{" "}
                  {allServices.find((s) => s.slug === data.service)?.name}
                </li>
                <li>Nom : {data.name}</li>
                <li>Téléphone : {data.phone}</li>
                {data.preferredDate && (
                  <li>Date souhaitée : {data.preferredDate}</li>
                )}
                {data.preferredTime && <li>Créneau : {data.preferredTime}</li>}
                <li>
                  Contact :{" "}
                  {data.contactMethod === "whatsapp" ? "WhatsApp" : "Téléphone"}
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-3 text-sm text-ink/70 cursor-pointer">
              <input
                type="checkbox"
                checked={data.consent}
                onChange={(e) =>
                  setData({ ...data, consent: e.target.checked })
                }
                className="mt-0.5 h-4 w-4 accent-teal"
              />
              <span>
                J'accepte d'être recontacté·e par le laboratoire au sujet de ma
                demande. Aucune information n'est utilisée à des fins
                commerciales.
              </span>
            </label>

            <p className="text-xs text-ink/50">
              La demande nécessite une confirmation manuelle par l'équipe — vous
              serez recontacté·e.
            </p>
            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-petrol"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        ) : (
          <div />
        )}

        {step < 2 ? (
          <button
            type="submit"
            disabled={!canNext}
            className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-6 py-3 text-sm disabled:opacity-40 hover:bg-ink transition-colors"
          >
            Continuer <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-petrol text-ivory px-6 py-3 text-sm disabled:opacity-60 hover:bg-ink transition-colors"
          >
            {submitting ? "Envoi…" : "Demander un rendez-vous"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  hint,
  min,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  hint?: string;
  min?: string;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-ink/60 mb-2">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        min={min}
        maxLength={maxLength}
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 sm:text-sm"
      />
      {hint && <span className="mt-1.5 block text-xs text-ink/50">{hint}</span>}
    </label>
  );
}
