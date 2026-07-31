import Link from "next/link";
import { Suspense } from "react";
import { signout } from "~/app/auth/actions";
import type { MealDaySummary } from "~/lib/meals";
import { DayPicker } from "./day-picker";
import { CalendarIcon, ChevronDownIcon, UploadIcon } from "./icons";
import { DashboardMobileNav } from "./mobile-nav";

export function DashboardTopbar({
  email,
  days,
  timeZone,
  isAdmin = false,
}: {
  email: string;
  days: MealDaySummary[];
  timeZone: string;
  isAdmin?: boolean;
}) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-18 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur sm:gap-4 sm:px-4 lg:px-8">
      {/* Only rendered below `lg`, where the sidebar is hidden. */}
      <DashboardMobileNav isAdmin={isAdmin} />

      {/* Day switcher — scopes the dashboard to the selected day. */}
      <Suspense fallback={<DayPickerFallback />}>
        <DayPicker days={days} timeZone={timeZone} />
      </Suspense>

      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          href="/scan"
          aria-label="Upload a meal photo"
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 sm:h-10 sm:px-4"
        >
          <UploadIcon className="size-4" />
          <span className="hidden sm:inline">Upload Photo</span>
        </Link>

        {/* Sign out moves into the mobile drawer; the avatar stays as the
            signed-in cue, which is what the space is better spent on. */}
        <div className="flex shrink-0 items-center gap-2 sm:border-l sm:border-border sm:pl-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white"
            title={email}
          >
            {initial}
          </span>
          <form action={signout} className="hidden lg:block">
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

/** Static stand-in shown while the client day-picker hydrates. */
function DayPickerFallback() {
  return (
    <button
      type="button"
      className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium sm:h-10"
    >
      <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">Today</span>
      <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
