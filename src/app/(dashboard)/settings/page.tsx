import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { DEFAULT_UNITS, isValidUnits, UNITS_COOKIE } from "~/lib/units";
import type { ProfileValues } from "./profile-form";
import { SettingsClient } from "./settings-client";

// Server component: load the user's canonical (metric) profile so the Profile
// tab's editor can be pre-filled. The dashboard layout already gates unfinished
// onboarding, so a profile row is expected here.
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("goal, sex, age, height_cm, weight_kg, activity_level")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const values: ProfileValues = {
    goal: profile.goal,
    sex: profile.sex,
    age: Number(profile.age),
    heightCm: Number(profile.height_cm),
    weightKg: Number(profile.weight_kg),
    activityLevel: profile.activity_level,
  };

  // Default the form's unit toggle to whatever the user last chose (cookie).
  const unitsCookie = (await cookies()).get(UNITS_COOKIE)?.value;
  const defaultUnits = isValidUnits(unitsCookie) ? unitsCookie : DEFAULT_UNITS;

  // Display name lives in Auth user_metadata; email is the login identity.
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";
  const email = user.email ?? "";

  return (
    <SettingsClient
      profile={values}
      defaultUnits={defaultUnits}
      fullName={fullName}
      email={email}
    />
  );
}
