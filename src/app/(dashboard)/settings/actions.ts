"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateDailyCalorieTarget } from "~/lib/onboarding";
import { createClient } from "~/lib/supabase/server";

export type ProfileState = {
  error?: string;
  success?: boolean;
  /** The recomputed target, echoed back so the UI can confirm the new goal. */
  dailyCalorieTarget?: number;
};

export type AccountState = { error?: string; success?: boolean };

// Mirrors the onboarding schema exactly — the same fields feed the same calorie
// math, so validation and bounds must stay in lockstep with `onboarding/actions.ts`.
const profileSchema = z.object({
  goal: z.enum(["lose", "maintain", "gain"]),
  sex: z.enum(["male", "female"]),
  age: z.coerce
    .number()
    .int("Age must be a whole number.")
    .min(18, "You must be 18 or older to use the app.")
    .max(120, "Please enter a valid age."),
  heightCm: z.coerce
    .number()
    .min(50, "That height looks too low — double-check the value.")
    .max(275, "That height looks too high — double-check the value."),
  weightKg: z.coerce
    .number()
    .min(20, "That weight looks too low — double-check the value.")
    .max(500, "That weight looks too high — double-check the value."),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
});

const REQUIRED_FIELDS = [
  "goal",
  "sex",
  "age",
  "heightCm",
  "weightKg",
  "activityLevel",
] as const;

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const raw = Object.fromEntries(
    REQUIRED_FIELDS.map((f) => [f, formData.get(f)]),
  );

  const hasEmpty = REQUIRED_FIELDS.some((f) => {
    const v = raw[f];
    return v === null || v === "";
  });
  if (hasEmpty) {
    return { error: "Please fill in every field before saving." };
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please double-check your answers and try again.",
    };
  }

  const { goal, sex, age, heightCm, weightKg, activityLevel } = parsed.data;

  // Recompute the cached target from the new inputs so the dashboard's goal and
  // status message move with any change to goal, weight, height, age or activity.
  const dailyCalorieTarget = calculateDailyCalorieTarget({
    goal,
    sex,
    age,
    heightCm,
    weightKg,
    activityLevel,
  });

  // update (not upsert): the row already exists post-onboarding, and this avoids
  // ever touching onboarding_completed.
  const { error } = await supabase
    .from("profiles")
    .update({
      goal,
      sex,
      age,
      height_cm: heightCm,
      weight_kg: weightKg,
      activity_level: activityLevel,
      daily_calorie_target: dailyCalorieTarget,
    })
    .eq("id", user.id);

  if (error) {
    return {
      error: "Something went wrong saving your changes. Please try again.",
    };
  }

  // The dashboard reads goal + daily_calorie_target on every render; drop their
  // cached output so the new goal and message show on the next visit.
  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return { success: true, dailyCalorieTarget };
}

// The display name lives in Supabase Auth `user_metadata`, not the profiles
// table — the standard home for a display name, readable straight off the
// session with no extra query and no schema migration. Onboarding and this
// action are the only writers, so there's a single source of truth.
export async function updateFullName(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const raw = formData.get("fullName");
  const parsed = z
    .string()
    .trim()
    .max(80, "That name is too long.")
    .safeParse(typeof raw === "string" ? raw : "");

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please enter a valid name.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: parsed.data },
  });

  if (error) {
    return {
      error: "Something went wrong saving your name. Please try again.",
    };
  }

  // The dashboard greeting reads the name off the session; refresh it.
  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return { success: true };
}
