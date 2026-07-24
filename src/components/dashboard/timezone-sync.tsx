"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TIMEZONE_COOKIE } from "~/lib/date";

/**
 * Reports the browser's IANA timezone to the server via a functional, first-party
 * cookie so server-rendered day boundaries match the user's real calendar. Runs
 * after hydration on every dashboard page (mounted once in the layout).
 *
 * `serverTimeZone` is the zone the server assumed for this render — the cookie
 * value, or `DEFAULT_TIME_ZONE` on the first-ever render before the cookie
 * exists. If the browser's actual zone differs, we refresh once so the current
 * view re-renders with the correct zone; after that they match and it's a no-op.
 * Renders nothing.
 */
export function TimezoneSync({ serverTimeZone }: { serverTimeZone: string }) {
  const router = useRouter();

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return;

    // Refresh on every mount (max-age 1 year) so the zone tracks the user across
    // travel and new devices. Not httpOnly by design: the server must read it.
    // biome-ignore lint/suspicious/noDocumentCookie: one lightweight functional cookie; the async Cookie Store API isn't universally supported.
    document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(detected)}; path=/; max-age=31536000; samesite=lax`;

    // Correct the current render if the server guessed a different zone. The
    // just-set cookie rides along with the refresh request.
    if (detected !== serverTimeZone) {
      router.refresh();
    }
  }, [serverTimeZone, router]);

  return null;
}
