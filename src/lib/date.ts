/**
 * Local-time date helpers shared by server code (meal queries, grouping) and
 * client code (the dashboard day-picker). Everything is computed in the
 * runtime's local timezone so "days" line up with the user's calendar.
 *
 * Kept free of "server-only" so the client day-picker can import the label /
 * parse helpers too.
 */

/** Midnight (local) at the start of the given day, or today by default. */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Serialize a date to a stable `YYYY-MM-DD` key in local time. */
export function toDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a `YYYY-MM-DD` string into a local-midnight Date, or null if it's
 * missing or malformed (rejects impossible dates like 2026-13-40).
 */
export function parseDateParam(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const d = new Date(year, month - 1, day);

  // Reject values that JS rolled over (e.g. month 13 → next year).
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Friendly label for a day: "Today", "Yesterday", or e.g. "Saturday, July 18". */
export function formatDayLabel(date: Date): string {
  const today = startOfDay();
  const yesterday = startOfDay();
  yesterday.setDate(yesterday.getDate() - 1);

  const day = startOfDay(date);
  if (day.getTime() === today.getTime()) return "Today";
  if (day.getTime() === yesterday.getTime()) return "Yesterday";
  return day.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
