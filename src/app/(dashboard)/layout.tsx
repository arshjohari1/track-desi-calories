import { redirect } from "next/navigation";
import { DashboardSidebar } from "~/components/dashboard/sidebar";
import { TimezoneSync } from "~/components/dashboard/timezone-sync";
import { DashboardTopbar } from "~/components/dashboard/topbar";
import { FREE_HISTORY_DAYS } from "~/lib/billing/constants";
import { fetchSubscription } from "~/lib/billing/subscription";
import { startOfDay } from "~/lib/date";
import { fetchMealDaySummaries } from "~/lib/meals";
import { createClient } from "~/lib/supabase/server";
import { getUserTimeZone } from "~/lib/timezone";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // First-run gate: users who haven't finished onboarding are sent to collect
  // the basic profile info the app needs before they can use the dashboard.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  // Read premium separately (fails safe to free) so onboarding detection never
  // depends on the billing columns existing.
  const { isPremium } = await fetchSubscription(supabase, user.id);
  const timeZone = await getUserTimeZone();
  // Free users' day-picker only reaches back the recent window; premium is full.
  const since = isPremium
    ? undefined
    : startOfDay(
        timeZone,
        new Date(Date.now() - FREE_HISTORY_DAYS * 24 * 60 * 60 * 1000),
      );
  const days = await fetchMealDaySummaries(supabase, user.id, timeZone, {
    since,
  });

  return (
    // The light shell is a faint grey wash so white cards lift off it. In dark
    // mode that wash lands *between* the page and the card and flattens both, so
    // the shell drops to the base background and lets the cards be the raised
    // surface.
    <div className="flex min-h-screen bg-muted/30 dark:bg-background">
      <TimezoneSync serverTimeZone={timeZone} />
      <DashboardSidebar
        isAdmin={user.app_metadata?.role === "admin"}
        isPremium={isPremium}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          email={user.email ?? ""}
          days={days}
          timeZone={timeZone}
          isAdmin={user.app_metadata?.role === "admin"}
        />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
