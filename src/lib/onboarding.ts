// Shared constants and calorie math for the onboarding flow. Kept in one place
// so the client form, the server action, and the DB check constraints stay in
// agreement about the allowed values.

export const GOALS = [
  { value: "lose", label: "Lose weight", emoji: "📉" },
  { value: "maintain", label: "Maintain weight", emoji: "⚖️" },
  { value: "gain", label: "Gain weight", emoji: "📈" },
] as const;

export const SEXES = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

export const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", hint: "Little or no exercise" },
  { value: "light", label: "Lightly active", hint: "1–3 days/week" },
  { value: "moderate", label: "Moderately active", hint: "3–5 days/week" },
  { value: "active", label: "Very active", hint: "6–7 days/week" },
  {
    value: "very_active",
    label: "Extra active",
    hint: "Hard exercise or physical job",
  },
] as const;

export type Goal = (typeof GOALS)[number]["value"];
export type Sex = (typeof SEXES)[number]["value"];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]["value"];

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

/**
 * Estimate a daily calorie target using the Mifflin-St Jeor equation for BMR,
 * scaled by an activity multiplier (TDEE) and adjusted for the user's goal.
 * Returns a rounded, sensibly floored kcal value.
 */
export function calculateDailyCalorieTarget(input: {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}): number {
  const { sex, age, heightCm, weightKg, activityLevel, goal } = input;

  const bmr =
    10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);

  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const target = tdee + GOAL_ADJUSTMENTS[goal];

  // Never recommend an unsafely low target.
  return Math.max(1200, Math.round(target));
}

// Unit conversion helpers for the metric/imperial toggle in the form.
export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

export function lbToKg(lb: number): number {
  return lb / 2.2046226218;
}
