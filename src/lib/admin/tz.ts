// Algeria timezone helpers. Algeria = UTC+1, no DST — safe fixed offset.
const TZ_OFFSET_MIN = 60;

function toAlgeriaParts(d: Date) {
  const shifted = new Date(d.getTime() + TZ_OFFSET_MIN * 60_000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth(),
    d: shifted.getUTCDate(),
    hh: shifted.getUTCHours(),
    mm: shifted.getUTCMinutes(),
    dow: shifted.getUTCDay(), // 0 = Sunday
  };
}

/** Start (00:00) of the given date in Algeria time, returned as UTC Date. */
export function algeriaStartOfDay(d: Date): Date {
  const p = toAlgeriaParts(d);
  return new Date(Date.UTC(p.y, p.m, p.d, 0, 0, 0) - TZ_OFFSET_MIN * 60_000);
}

export function algeriaEndOfDay(d: Date): Date {
  return new Date(algeriaStartOfDay(d).getTime() + 24 * 3600_000);
}

export function algeriaTodayStart(): Date {
  return algeriaStartOfDay(new Date());
}

export function isAlgeriaSameDay(a: Date, b: Date): boolean {
  const pa = toAlgeriaParts(a);
  const pb = toAlgeriaParts(b);
  return pa.y === pb.y && pa.m === pb.m && pa.d === pb.d;
}

export function isOverdue(due: string | Date | null | undefined): boolean {
  if (!due) return false;
  const d = typeof due === "string" ? new Date(due) : due;
  return d.getTime() < algeriaTodayStart().getTime();
}

export function isDueToday(due: string | Date | null | undefined): boolean {
  if (!due) return false;
  const d = typeof due === "string" ? new Date(due) : due;
  return isAlgeriaSameDay(d, new Date());
}

export function isUpcoming(due: string | Date | null | undefined): boolean {
  if (!due) return false;
  const d = typeof due === "string" ? new Date(due) : due;
  const endToday = algeriaEndOfDay(new Date()).getTime();
  return d.getTime() >= endToday;
}

export function algeriaDow(d: Date): number {
  return toAlgeriaParts(d).dow;
}

export function algeriaHM(d: Date): { h: number; m: number } {
  const p = toAlgeriaParts(d);
  return { h: p.hh, m: p.mm };
}

/** Formats a local `datetime-local` input value in Algeria time from a Date. */
export function toLocalInput(d: Date): string {
  const p = toAlgeriaParts(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}T${pad(p.hh)}:${pad(p.mm)}`;
}

/** Parses a `datetime-local` string (assumed Algeria time) to a UTC Date. */
export function fromLocalInput(s: string): Date {
  // Interpret as Algeria local, then convert to UTC.
  const [date, time] = s.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm, 0) - TZ_OFFSET_MIN * 60_000);
}

export const ALGERIA_TZ = "Africa/Algiers";
