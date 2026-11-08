// All dates are "YYYY-MM-DD" strings, handled in UTC to avoid time-zone bugs.

export function today(): string {
  const pinned = process.env.NEXT_PUBLIC_DEMO_TODAY;
  if (pinned) return pinned;
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function parse(s: string): Date {
  return new Date(s + "T00:00:00Z");
}

export function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000);
}

export function dayOfMonth(s: string): number {
  return parse(s).getUTCDate();
}

export function daysInMonth(s: string): number {
  const d = parse(s);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

/** True if a monthly item due on `day` falls on date `s` (clamped to month length). */
export function isDueOn(s: string, day: number): boolean {
  return dayOfMonth(s) === Math.min(day, daysInMonth(s));
}

export function fmtDay(s: string): string {
  return parse(s).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function fmtShort(s: string): string {
  return parse(s).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function monthName(s: string): string {
  return parse(s).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
}
