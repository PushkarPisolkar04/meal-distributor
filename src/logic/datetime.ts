// Pure date/time helpers. All functions operate on the *local* device clock,
// which is the app's single source of truth for time (per product decision).
// No external date library is used so this layer stays dependency-free and
// fast to unit test.

/** Format a Date as a local 'yyyy-MM-dd' string. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a 'yyyy-MM-dd' string into a local-midnight Date. */
export function parseISODate(iso: string): Date {
  const parts = iso.split('-').map((p) => parseInt(p, 10));
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** Today's local date as 'yyyy-MM-dd'. `now` is injectable for testing. */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

/** Weekday for an ISO date. 0=Sunday .. 6=Saturday. */
export function weekdayOf(iso: string): number {
  return parseISODate(iso).getDay();
}

/** Add (or subtract) days to an ISO date, returning a new ISO date. */
export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Parse "HH:mm" into hours/minutes. Returns null when malformed. */
export function parseHHmm(value: string): { h: number; m: number } | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  return { h: parseInt(match[1] as string, 10), m: parseInt(match[2] as string, 10) };
}

/** Minutes since local midnight for an "HH:mm" string; null when malformed. */
export function minutesOfDay(value: string): number | null {
  const parsed = parseHHmm(value);
  if (!parsed) return null;
  return parsed.h * 60 + parsed.m;
}

/** Minutes since local midnight for a Date. */
export function minutesOfDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Is the current moment strictly before the given "HH:mm" cutoff, on the same
 * local day? Used to decide whether ordering is still open.
 */
export function isBeforeCutoff(cutoff: string, now: Date = new Date()): boolean {
  const cut = minutesOfDay(cutoff);
  if (cut == null) return false;
  return minutesOfDate(now) < cut;
}

/** Whole minutes remaining until the cutoff today (0 when passed). */
export function minutesUntilCutoff(cutoff: string, now: Date = new Date()): number {
  const cut = minutesOfDay(cutoff);
  if (cut == null) return 0;
  return Math.max(0, cut - minutesOfDate(now));
}

/**
 * Start of the week containing `iso`. weekStartsOn: 0=Sun,1=Mon (default Mon,
 * matching typical Indian office weeks). Returns ISO date.
 */
export function startOfWeek(iso: string, weekStartsOn: number = 1): string {
  const day = weekdayOf(iso);
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(iso, -diff);
}

/** The 7 ISO dates of the week containing `iso`. */
export function weekDates(iso: string, weekStartsOn: number = 1): string[] {
  const start = startOfWeek(iso, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Inclusive list of ISO dates between two dates. */
export function datesInRange(fromISO: string, toISO: string): string[] {
  const out: string[] = [];
  let cur = fromISO;
  // Guard against reversed ranges.
  if (parseISODate(fromISO).getTime() > parseISODate(toISO).getTime()) return out;
  while (parseISODate(cur).getTime() <= parseISODate(toISO).getTime()) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/**
 * Is `iso` a day tiffin runs on? True when its weekday is active AND it is not
 * a configured holiday.
 */
export function isActiveDay(
  iso: string,
  activeWeekdays: number[],
  holidays: string[] = [],
): boolean {
  if (holidays.includes(iso)) return false;
  return activeWeekdays.includes(weekdayOf(iso));
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Human friendly label, e.g. "Mon, 20 Jul". */
export function formatDayLabel(iso: string): string {
  const d = parseISODate(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Short date without weekday, e.g. "20 Jul" (used in the vendor message). */
export function formatDayMonth(iso: string): string {
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
