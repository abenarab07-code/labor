import { toast } from "sonner";

/**
 * Shared wrapper for Supabase mutations invoked from the admin UI.
 *
 * Responsibilities:
 * - Prevent duplicate submissions via the `busyRef` guard.
 * - Surface a single toast on success and a single toast on failure.
 * - Return `{ ok, error }` so callers can rollback optimistic UI without
 *   swallowing the underlying error.
 *
 * Callers keep drawers/dialogs open on failure by branching on `ok`.
 */
export type MutationResult<T> = { ok: true; data: T } | { ok: false; error: Error };

export const STALE_CONFLICT_MSG =
  "Cette fiche a été modifiée par un autre membre de l'équipe. Actualisez les données avant de réessayer.";

export function isStaleConflict(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err ?? "");
  return m.includes("modifiée par un autre membre");
}

/** Throw the canonical stale-write French message from data-layer helpers. */
export function throwStaleConflict(): never {
  throw new Error(STALE_CONFLICT_MSG);
}

export async function runMutation<T>(
  fn: () => Promise<T>,
  opts: {
    successMessage?: string;
    errorMessage?: string;
    busyRef?: { current: boolean };
    onError?: (err: Error) => void;
    /** Suppress toasts (caller shows its own UI). */
    silent?: boolean;
  } = {},
): Promise<MutationResult<T>> {
  if (opts.busyRef?.current) {
    return { ok: false, error: new Error("Opération déjà en cours") };
  }
  if (opts.busyRef) opts.busyRef.current = true;
  try {
    const data = await fn();
    if (opts.successMessage && !opts.silent) toast.success(opts.successMessage);
    return { ok: true, data };
  } catch (err: any) {
    const error = err instanceof Error ? err : new Error(err?.message ?? "Erreur inconnue");
    const msg = friendlyError(error, opts.errorMessage);
    if (!opts.silent) toast.error(msg);
    opts.onError?.(error);
    return { ok: false, error };
  } finally {
    if (opts.busyRef) opts.busyRef.current = false;
  }
}

/** Translate opaque Supabase / Postgres errors into short French messages. */
export function friendlyError(err: Error, fallback?: string): string {
  const m = err.message ?? "";
  if (isStaleConflict(err)) return STALE_CONFLICT_MSG;
  if (/JWT|not authenticated|Unauthorized/i.test(m)) return "Session expirée — reconnectez-vous.";
  if (/row-level security|permission denied|403/i.test(m)) return "Accès refusé (permissions).";
  if (/duplicate key|unique constraint/i.test(m)) return "Doublon détecté.";
  if (/foreign key/i.test(m)) return "Référence liée manquante.";
  if (/network|Failed to fetch|NetworkError/i.test(m)) return "Connexion réseau interrompue.";
  if (/conflict|409/i.test(m)) return STALE_CONFLICT_MSG;
  return fallback ?? m ?? "Erreur";
}
