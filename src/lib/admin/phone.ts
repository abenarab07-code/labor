/**
 * Shared Algerian phone normalization.
 * Canonical stored form: E.164 with `+` prefix (e.g. `+213557198750`).
 * Normalized search key (used in DB `phone_normalized` column): digits only
 * starting with country code (e.g. `213557198750`).
 */

export function digitsOnly(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\D+/g, "");
}

/**
 * Normalize any common Algerian phone format to the canonical digit key.
 * Returns null when the input has no digits.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  let d = digitsOnly(raw);
  if (!d) return null;
  if (d.startsWith("00213")) d = d.slice(2); // 00213 -> 213
  if (d.length === 10 && d.startsWith("0")) d = "213" + d.slice(1); // 0xxxxxxxxx -> 213xxxxxxxxx
  if (d.length === 9 && /^[567]/.test(d)) d = "213" + d; // xxxxxxxxx -> 213xxxxxxxxx
  return d;
}

/** Canonical E.164 form for storage (`+213…`). Falls back to raw digits. */
export function toE164(raw: string | null | undefined): string | null {
  const n = normalizePhone(raw);
  return n ? `+${n}` : null;
}

/** True when two phone strings resolve to the same normalized key. */
export function samePhone(a: string | null | undefined, b: string | null | undefined) {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  return !!na && na === nb;
}
