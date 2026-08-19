import type { AdminAuthState } from "./auth";

export type Role = "admin" | "reception" | "practitioner" | "moderator" | "marketing" | "user";

export function hasAnyRole(auth: AdminAuthState, roles: Role[]): boolean {
  return auth.roles.some((r) => (roles as string[]).includes(r));
}

export function isReceptionOrAdmin(auth: AdminAuthState): boolean {
  return hasAnyRole(auth, ["admin", "reception"]);
}

export function canOverrideAppointmentRules(auth: AdminAuthState): boolean {
  return hasAnyRole(auth, ["admin", "reception"]);
}

export function canSeePatientPhone(auth: AdminAuthState): boolean {
  return hasAnyRole(auth, ["admin", "reception", "practitioner"]);
}
