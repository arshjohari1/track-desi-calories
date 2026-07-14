import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Onboarding is a one-time flow. If this user has already completed it, send
  // them straight to the dashboard.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 space-y-2 text-center">
          <span className="text-3xl">🍛</span>
          <h1 className="text-2xl font-bold tracking-tight">
            Let&apos;s set up your profile
          </h1>
          <p className="text-sm text-muted-foreground">
            A few quick questions so we can calculate your daily calorie goal.
            You can change any of this later in Settings.
          </p>
        </div>

        <OnboardingForm />
      </div>
    </main>
  );
}
