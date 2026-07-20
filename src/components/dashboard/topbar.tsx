import Link from "next/link";
import { Suspense } from "react";
import { signout } from "~/app/auth/actions";
import type { MealDaySummary } from "~/lib/meals";
import { DayPicker } from "./day-picker";
import { CalendarIcon, ChevronDownIcon, UploadIcon } from "./icons";

export function DashboardTopbar({
  email,
  days,
}: {
  email: string;
  days: MealDaySummary[];
}) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-18 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
      {/* Day switcher — scopes the dashboard to the selected day. */}
      <Suspense fallback={<DayPickerFallback />}>
        <DayPicker days={days} />
      </Suspense>

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/scan"
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          <UploadIcon className="size-4" />
          <span className="hidden sm:inline">Upload Photo</span>
        </Link>

        <div className="flex items-center gap-2 border-l border-border pl-3">
          <span
            className="flex size-9 items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white"
            title={email}
          >
            {initial}
          </span>
          <form action={signout}>
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
      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium"
    >
      <CalendarIcon className="size-4 text-muted-foreground" />
      <span>Today</span>
      <ChevronDownIcon className="size-4 text-muted-foreground" />
    </button>
  );
}
