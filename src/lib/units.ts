// Unit-system display preference (metric vs imperial). Body metrics are always
// stored canonically in metric in the DB; this only controls which units the
// profile/onboarding forms show and accept. Persisted as a lightweight
// first-party cookie so the choice survives a refresh and is readable during
// SSR — the same approach as the timezone cookie (see `src/lib/date.ts`).

export const UNITS_COOKIE = "units";

export type Units = "metric" | "imperial";

export const DEFAULT_UNITS: Units = "metric";

export function isValidUnits(value: string | undefined | null): value is Units {
  return value === "metric" || value === "imperial";
}

/**
 * Persist the user's chosen unit system so the forms default to it next time.
 * Client-only (no-op during SSR). Not httpOnly by design: written client-side
 * and read back server-side on the next render.
 */
export function rememberUnits(units: Units): void {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: one lightweight functional cookie; matches the tz cookie approach.
  document.cookie = `${UNITS_COOKIE}=${units}; path=/; max-age=31536000; samesite=lax`;
}
