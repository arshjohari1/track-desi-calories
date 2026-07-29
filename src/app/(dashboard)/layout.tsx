import { redirect } from "next/navigation";
import { DashboardSidebar } from "~/components/dashboard/sidebar";
import { TimezoneSync } from "~/components/dashboard/timezone-sync";
import { DashboardTopbar } from "~/components/dashboard/topbar";
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

  const timeZone = await getUserTimeZone();
  const days = await fetchMealDaySummaries(supabase, user.id, timeZone);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <TimezoneSync serverTimeZone={timeZone} />
      <DashboardSidebar isAdmin={user.app_metadata?.role === "admin"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          email={user.email ?? ""}
          days={days}
          timeZone={timeZone}
        />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
