import "server-only";

import { cookies } from "next/headers";
import {
  DEFAULT_TIME_ZONE,
  isValidTimeZone,
  TIMEZONE_COOKIE,
} from "~/lib/date";

/**
 * The user's IANA timezone for this request, read from the `tz` cookie that the
 * browser sets on the dashboard (see `TimezoneSync`). Falls back to
 * `DEFAULT_TIME_ZONE` when the cookie is missing (first-ever render) or holds a
 * value `Intl` won't accept. Used to compute day boundaries server-side so they
 * match the user's calendar instead of the host's local time.
 */
export async function getUserTimeZone(): Promise<string> {
  const store = await cookies();
  const value = store.get(TIMEZONE_COOKIE)?.value;
  return isValidTimeZone(value) ? value : DEFAULT_TIME_ZONE;
}
