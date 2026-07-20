"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { calculateDailyCalorieTarget } from "~/lib/onboarding";
import { createClient } from "~/lib/supabase/server";

export type OnboardingState = { error?: string };

const onboardingSchema = z.object({
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

// Fields required before we even attempt range validation, so an empty form
// gets a clear "fill everything in" message rather than a misleading range one.
const REQUIRED_FIELDS = [
  "goal",
  "sex",
  "age",
  "heightCm",
  "weightKg",
  "activityLevel",
] as const;

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw = Object.fromEntries(
    REQUIRED_FIELDS.map((f) => [f, formData.get(f)]),
  );

  const hasEmpty = REQUIRED_FIELDS.some((f) => {
    const v = raw[f];
    return v === null || v === "";
  });
  if (hasEmpty) {
    return { error: "Please fill in every field before continuing." };
  }

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please double-check your answers and try again.",
    };
  }

  const { goal, sex, age, heightCm, weightKg, activityLevel } = parsed.data;

  const dailyCalorieTarget = calculateDailyCalorieTarget({
    goal,
    sex,
    age,
    heightCm,
    weightKg,
    activityLevel,
  });

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    goal,
    sex,
    age,
    height_cm: heightCm,
    weight_kg: weightKg,
    activity_level: activityLevel,
    daily_calorie_target: dailyCalorieTarget,
    onboarding_completed: true,
  });

  if (error) {
    return {
      error: "Something went wrong saving your profile. Please try again.",
    };
  }

  redirect("/dashboard");
}
