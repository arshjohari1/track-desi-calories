import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDayLabel, toDateParam } from "~/lib/date";

/**
 * Meal reads for the dashboard tracker, "recent meals", the day-picker, and the
 * logs view.
 *
 * Macro columns are Postgres `numeric`, which PostgREST can serialize as either
 * a JSON number or a string depending on the setup — every value is coerced
 * through `Number()` in `toMeal` so callers always get real numbers to sum.
 */

export type Confidence = "low" | "medium" | "high";

export type Meal = {
  id: string;
  dishName: string;
  servingSummary: string | null;
  cuisine: string | null;
  isSouthAsian: boolean;
  imageUrl: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  confidence: Confidence | null;
  eatenAt: string;
};

const MEAL_SELECT =
  "id, dish_name, serving_summary, cuisine, is_south_asian, image_url, calories, protein, carbs, fat, fiber, sugar, confidence, eaten_at";

type RawMeal = {
  id: string;
  dish_name: string;
  serving_summary: string | null;
  cuisine: string | null;
  is_south_asian: boolean;
  image_url: string | null;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  fiber: number | string;
  // Nullable: meals logged before the sugar column existed have no value.
  sugar: number | string | null;
  confidence: Confidence | null;
  eaten_at: string;
};

function toMeal(row: RawMeal): Meal {
  return {
    id: row.id,
    dishName: row.dish_name,
    servingSummary: row.serving_summary,
    cuisine: row.cuisine,
    isSouthAsian: Boolean(row.is_south_asian),
    imageUrl: row.image_url,
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    carbs: Number(row.carbs) || 0,
    fat: Number(row.fat) || 0,
    fiber: Number(row.fiber) || 0,
    sugar: Number(row.sugar) || 0,
    confidence: row.confidence,
    eatenAt: row.eaten_at,
  };
}

/**
 * Fetch a user's meals, newest first. `since`/`until` bound the eaten_at window
 * (e.g. a single day) and `limit` caps the count. Returns an empty array on any
 * error so pages degrade to their empty states.
 */
export async function fetchMeals(
  supabase: SupabaseClient,
  userId: string,
  opts: { since?: Date; until?: Date; limit?: number } = {},
): Promise<Meal[]> {
  if (!userId) return [];

  let query = supabase
    .from("meals")
    .select(MEAL_SELECT)
    .eq("user_id", userId)
    .order("eaten_at", { ascending: false });

  if (opts.since) query = query.gte("eaten_at", opts.since.toISOString());
  if (opts.until) query = query.lt("eaten_at", opts.until.toISOString());
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as RawMeal[]).map(toMeal);
}

export function sumCalories(meals: Meal[]): number {
  return meals.reduce((total, meal) => total + meal.calories, 0);
}

export type MacroTotals = {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
};

/** Sum the gram macros across meals (for the dashboard's daily breakdown). */
export function sumMacros(meals: Meal[]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (totals, meal) => ({
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
      fiber: totals.fiber + meal.fiber,
      sugar: totals.sugar + meal.sugar,
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
  );
}

export type MealDay = {
  key: string;
  label: string;
  meals: Meal[];
  total: number;
};

/**
 * Group meals (assumed newest-first) into calendar days in `timeZone`, newest
 * day first, with a friendly label and per-day calorie total.
 */
export function groupMealsByDay(meals: Meal[], timeZone: string): MealDay[] {
  const groups = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = toDateParam(new Date(meal.eatenAt), timeZone);
    const bucket = groups.get(key);
    if (bucket) bucket.push(meal);
    else groups.set(key, [meal]);
  }

  return [...groups.entries()].map(([key, dayMeals]) => ({
    key,
    label: formatDayLabel(new Date(dayMeals[0].eatenAt), timeZone),
    meals: dayMeals,
    total: sumCalories(dayMeals),
  }));
}

export type MealDaySummary = {
  /** `YYYY-MM-DD` in local time; empty string is reserved for a synthetic "today". */
  date: string;
  label: string;
  count: number;
  total: number;
};

/**
 * Lightweight per-day summaries (no images) for the day-picker: each day the
 * user has logged, newest first, with its meal count and calorie total.
 */
export async function fetchMealDaySummaries(
  supabase: SupabaseClient,
  userId: string,
  timeZone: string,
  opts: { limit?: number } = {},
): Promise<MealDaySummary[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("meals")
    .select("eaten_at, calories")
    .eq("user_id", userId)
    .order("eaten_at", { ascending: false })
    .limit(opts.limit ?? 500);

  if (error || !data) return [];

  const groups = new Map<
    string,
    { total: number; count: number; instant: Date }
  >();
  for (const row of data as { eaten_at: string; calories: number | string }[]) {
    const instant = new Date(row.eaten_at);
    const key = toDateParam(instant, timeZone);
    const calories = Number(row.calories) || 0;
    const group = groups.get(key);
    if (group) {
      group.total += calories;
      group.count += 1;
    } else {
      // Rows are newest-first, so this instant lands in `key`'s day — any
      // instant within the day is enough to label it.
      groups.set(key, { total: calories, count: 1, instant });
    }
  }

  return [...groups.entries()].map(([date, group]) => ({
    date,
    label: formatDayLabel(group.instant, timeZone),
    count: group.count,
    total: Math.round(group.total),
  }));
}
