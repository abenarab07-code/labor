import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Algerian phone normalization: 0[567]XXXXXXXX → +2135/6/7XXXXXXXX
function normalizePhone(input: string): string | null {
  const trimmed = input.replace(/[\s.\-()]/g, "");
  // +213...
  const plus = trimmed.match(/^\+213([567]\d{8})$/);
  if (plus) return `+213${plus[1]}`;
  // 00213...
  const zeros = trimmed.match(/^00213([567]\d{8})$/);
  if (zeros) return `+213${zeros[1]}`;
  // 0X XX XX XX XX
  const local = trimmed.match(/^0([567]\d{8})$/);
  if (local) return `+213${local[1]}`;
  return null;
}

// UTC+1 Africa/Algiers, no DST → local day = UTC day when the date is treated
// as a calendar date. Use JS Date on the ISO string.
function isFriday(dateISO: string): boolean {
  // dateISO expected as YYYY-MM-DD
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCDay() === 5; // 0=Sun ... 5=Fri
}

function isAtLeast24hAhead(dateISO: string): boolean {
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return false;
  const target = new Date(Date.UTC(y, m - 1, d, 8, 30)); // clinic opening
  return target.getTime() - Date.now() >= 24 * 60 * 60 * 1000;
}

const schema = z.object({
  treatment: z.string().trim().max(80).optional().nullable(),
  name: z.string().trim().min(2, "Nom requis").max(120),
  phone: z.string().trim().min(6).max(30),
  preferredDate: z.string().trim().max(20).optional().nullable(),
  preferredTime: z.string().trim().max(10).optional().nullable(),
  message: z.string().trim().max(1000).optional().nullable(),
  contactMethod: z.enum(["whatsapp", "phone"]),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consentement requis" }),
  }),
  sourcePage: z.string().trim().max(80).optional().nullable(),
  utm: z
    .record(z.string().max(80), z.string().max(200))
    .optional()
    .nullable(),
  idempotencyKey: z.string().trim().min(8).max(120),
});

export const submitAppointment = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => schema.parse(raw))
  .handler(async ({ data }) => {
    const phoneE164 = normalizePhone(data.phone);
    if (!phoneE164) {
      throw new Error(
        "Numéro invalide. Utilisez un numéro algérien (05, 06, 07 …).",
      );
    }

    if (data.preferredDate) {
      if (isFriday(data.preferredDate)) {
        throw new Error("Le cabinet est fermé le vendredi. Choisissez un autre jour.");
      }
      if (!isAtLeast24hAhead(data.preferredDate)) {
        throw new Error(
          "Merci de choisir une date au moins 24 heures à l'avance.",
        );
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Idempotency: if a row with this key already exists, return its id.
    const existing = await supabaseAdmin
      .from("appointment_requests")
      .select("id")
      .eq("idempotency_key", data.idempotencyKey)
      .maybeSingle();
    if (existing.data?.id) {
      return { ok: true, id: existing.data.id, deduped: true };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("appointment_requests")
      .insert({
        treatment: data.treatment ?? null,
        name: data.name,
        phone_e164: phoneE164,
        phone_raw: data.phone,
        preferred_date: data.preferredDate || null,
        preferred_time: data.preferredTime || null,
        message: data.message || null,
        contact_method: data.contactMethod,
        source_page: data.sourcePage ?? null,
        utm: data.utm ?? null,
        status: "new",
        idempotency_key: data.idempotencyKey,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[appointments] insert failed", error);
      throw new Error("Une erreur est survenue. Merci de réessayer.");
    }

    return { ok: true, id: inserted.id, deduped: false };
  });
