/**
 * Timezone-aware date helpers shared by server code (meal queries, day grouping)
 * and client code (the day-picker). Every "day" is computed in an explicit IANA
 * timezone — the user's, resolved from the `tz` cookie on the server or straight
 * from the browser on the client — so day boundaries line up with the user's own
 * calendar no matter where the code runs. This is what keeps "today" correct on a
 * UTC host like Vercel instead of drifting to the server's local midnight.
 *
 * Kept free of "server-only" so the client day-picker can import these too.
 */

/** Functional cookie carrying the browser's IANA timezone to the server. */
export const TIMEZONE_COOKIE = "tz";

/**
 * Neutral fallback used only until we know the user's real zone (e.g. the first
 * server render before the tz cookie is set). UTC is deliberately region-neutral:
 * the audience spans multiple continents, so guessing a specific region would be
 * confidently wrong for the other half. It only affects that first render and
 * self-corrects the moment `TimezoneSync` sets the cookie.
 */
export const DEFAULT_TIME_ZONE = "UTC";

/** Whether `tz` is a valid IANA zone `Intl` will accept (guards a hostile cookie). */
export function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

type DayParts = { year: number; month: number; day: number };

/**
 * Milliseconds to add to a UTC instant to reach the wall-clock time in `timeZone`
 * (positive east of UTC). Derived by asking `Intl` what the instant reads as in
 * the zone, then treating those parts as if they were UTC.
 */
function tzOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  const asIfUtc = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour,
    map.minute,
    map.second,
  );
  return asIfUtc - instant.getTime();
}

/** The calendar Y-M-D that `instant` falls on when viewed in `timeZone`. */
function dayPartsInTz(instant: Date, timeZone: string): DayParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  return { year: map.year, month: map.month, day: map.day };
}

/**
 * The UTC instant of midnight (00:00) in `timeZone` for the given calendar day —
 * exactly the value meal queries compare `eaten_at` against. Interpret the wall
 * clock as UTC, then subtract the zone's offset; a second pass settles the rare
 * DST-transition case where the offset differs on either side of midnight.
 */
function zonedMidnight({ year, month, day }: DayParts, timeZone: string): Date {
  const wallAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let utc = wallAsUtc - tzOffsetMs(new Date(wallAsUtc), timeZone);
  utc = wallAsUtc - tzOffsetMs(new Date(utc), timeZone);
  return new Date(utc);
}

/** Serialize the day `date` falls on in `timeZone` to a stable `YYYY-MM-DD` key. */
export function toDateParam(date: Date, timeZone: string): string {
  const { year, month, day } = dayPartsInTz(date, timeZone);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Midnight (in `timeZone`) starting the day `date` falls on, or today by default. */
export function startOfDay(timeZone: string, date: Date = new Date()): Date {
  return zonedMidnight(dayPartsInTz(date, timeZone), timeZone);
}

/** Midnight (in `timeZone`) ending the day `date` falls on — i.e. the next day's start. */
export function endOfDay(timeZone: string, date: Date = new Date()): Date {
  const { year, month, day } = dayPartsInTz(date, timeZone);
  // Roll the calendar day forward via UTC arithmetic so month/year boundaries
  // are handled for us, then resolve that next day's midnight in the zone.
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return zonedMidnight(
    {
      year: next.getUTCFullYear(),
      month: next.getUTCMonth() + 1,
      day: next.getUTCDate(),
    },
    timeZone,
  );
}

/**
 * Parse a `YYYY-MM-DD` string into the UTC instant of that day's midnight in
 * `timeZone`, or null if it's missing or malformed (rejects impossible dates
 * like 2026-13-40).
 */
export function parseDateParam(
  value: string | null | undefined,
  timeZone: string,
): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return null;

  // Reject days past the end of the month (last day of month = day 0 of next).
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return null;

  return zonedMidnight({ year, month, day }, timeZone);
}

/**
 * Friendly label for a day in `timeZone`: "Today", "Yesterday", or e.g.
 * "Saturday, July 18".
 */
export function formatDayLabel(date: Date, timeZone: string): string {
  const key = toDateParam(date, timeZone);
  const todayKey = toDateParam(new Date(), timeZone);

  if (key === todayKey) return "Today";

  // Yesterday = noon inside today's zone, rolled back a full day, which stays
  // safely within the previous calendar day even across DST-length days.
  const todayMidnight = startOfDay(timeZone);
  const yesterdayNoon = new Date(todayMidnight.getTime() - 12 * 60 * 60 * 1000);
  if (key === toDateParam(yesterdayNoon, timeZone)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
