"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FREE_KITCHEN_DISHES } from "~/lib/billing/constants";
import { fetchSubscription } from "~/lib/billing/subscription";
import { fetchKitchenDishCount } from "~/lib/kitchen";
import { createClient } from "~/lib/supabase/server";

export type KitchenResult =
  | { ok: true }
  | { ok: false; error: string; code?: "duplicate" | "limit" };

/**
 * The free tier caps saved dishes at {@link FREE_KITCHEN_DISHES}; premium is
 * unlimited. Returns an error result when the limit is hit, or null to proceed.
 * Enforced at every save action so a client can't route around it.
 */
async function checkKitchenLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<KitchenResult | null> {
  const { isPremium } = await fetchSubscription(supabase, userId);
  if (isPremium) return null;

  const count = await fetchKitchenDishCount(supabase, userId);
  if (count >= FREE_KITCHEN_DISHES) {
    return {
      ok: false,
      code: "limit",
      error: `Your free plan saves up to ${FREE_KITCHEN_DISHES} dishes. Go Premium for an unlimited Kitchen.`,
    };
  }
  return null;
}

/** Postgres unique_violation — the (user_id, lower(name)) index rejected a dupe. */
const UNIQUE_VIOLATION = "23505";

const DUPLICATE_MESSAGE =
  "You already have a dish with that name. Try a different one.";

/**
 * Mirrors what the scan and label result screens already hold. `thumbUrl` is
 * the display-sized copy the flows generate at file-select — never the
 * full-size image sent to the AI.
 */
const saveDishSchema = z.object({
  name: z.string().min(1).max(200),
  source: z.enum(["photo", "label"]),
  thumbUrl: z.string().max(2_000_000).nullable(),
  servingSummary: z.string().max(500).nullable(),
  cuisine: z.string().max(120).nullable(),
  isSouthAsian: z.boolean(),
  calories: z.number().min(0).max(20_000),
  protein: z.number().min(0).max(5_000),
  carbs: z.number().min(0).max(5_000),
  fat: z.number().min(0).max(5_000),
  fiber: z.number().min(0).max(5_000),
  sugar: z.number().min(0).max(5_000),
  confidence: z.enum(["low", "medium", "high"]),
  prepAnswers: z
    .array(
      z.object({
        question: z.string().max(500),
        answer: z.string().max(500),
      }),
    )
    .max(20),
  assumptions: z.array(z.string()).max(20),
  tip: z.string().max(2000).nullable(),
});

export type SaveDishInput = z.infer<typeof saveDishSchema>;

/** Save a finished scan to the Kitchen so it can be re-logged without AI calls. */
export async function saveDishToKitchen(
  input: SaveDishInput,
): Promise<KitchenResult> {
  const parsed = saveDishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "That dish is missing some details — rescan it.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to save a dish." };
  }

  const limit = await checkKitchenLimit(supabase, user.id);
  if (limit) return limit;

  const d = parsed.data;
  const { error } = await supabase.from("kitchen_dishes").insert({
    user_id: user.id,
    name: d.name.trim(),
    source: d.source,
    cuisine: d.cuisine,
    is_south_asian: d.isSouthAsian,
    thumb_url: d.thumbUrl,
    serving_summary: d.servingSummary,
    calories: d.calories,
    protein: d.protein,
    carbs: d.carbs,
    fat: d.fat,
    fiber: d.fiber,
    sugar: d.sugar,
    confidence: d.confidence,
    prep_answers: d.prepAnswers,
    assumptions: d.assumptions,
    tip: d.tip,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: DUPLICATE_MESSAGE, code: "duplicate" };
    }
    console.error("[saveDishToKitchen]", error);
    return { ok: false, error: "Couldn't save this dish. Please try again." };
  }

  revalidatePath("/kitchen");
  revalidatePath("/dashboard");
  return { ok: true };
}

const saveMealSchema = z.object({
  mealId: z.string().uuid(),
  name: z.string().min(1).max(200),
});

/**
 * Save an already-logged meal to the Kitchen.
 *
 * Takes only the meal id and reads the row server-side: a logged meal already
 * *is* a snapshot (name, macros, image, portion), so there's no reason to make
 * the browser re-upload a payload it already sent — especially the image.
 *
 * `prep_answers` is empty here — the scan's questions are long gone by the time
 * a meal reaches the logs — so the dish card falls back to its assumptions.
 */
export async function saveMealToKitchen(
  mealId: string,
  name: string,
): Promise<KitchenResult> {
  const parsed = saveMealSchema.safeParse({ mealId, name });
  if (!parsed.success) {
    return { ok: false, error: "That meal can't be saved. Please try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to save a dish." };
  }

  const limit = await checkKitchenLimit(supabase, user.id);
  if (limit) return limit;

  const { data: meal, error: readError } = await supabase
    .from("meals")
    .select(
      "dish_name, serving_summary, cuisine, is_south_asian, image_url, calories, protein, carbs, fat, fiber, sugar, confidence, assumptions, tip",
    )
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id)
    .single();

  if (readError || !meal) {
    return { ok: false, error: "Couldn't find that meal." };
  }

  const { error } = await supabase.from("kitchen_dishes").insert({
    user_id: user.id,
    name: parsed.data.name.trim(),
    // Meals don't record which flow produced them; a photo is the safe default
    // and only affects a label on the card.
    source: "photo",
    cuisine: meal.cuisine,
    is_south_asian: meal.is_south_asian,
    thumb_url: meal.image_url,
    serving_summary: meal.serving_summary,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fiber: meal.fiber,
    sugar: meal.sugar ?? 0,
    confidence: meal.confidence,
    prep_answers: [],
    assumptions: meal.assumptions ?? [],
    tip: meal.tip,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: DUPLICATE_MESSAGE, code: "duplicate" };
    }
    console.error("[saveMealToKitchen]", error);
    return { ok: false, error: "Couldn't save this dish. Please try again." };
  }

  revalidatePath("/kitchen");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Log a saved dish as a meal eaten now.
 *
 * The macros come from the stored row, never from the client — the browser only
 * says *which* dish, so a tampered request can't invent a 0-calorie biryani.
 */
export async function logKitchenDish(dishId: string): Promise<KitchenResult> {
  if (!z.string().uuid().safeParse(dishId).success) {
    return { ok: false, error: "Couldn't find that dish." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to log a meal." };
  }

  const { data: dish, error: readError } = await supabase
    .from("kitchen_dishes")
    .select(
      "id, name, serving_summary, cuisine, is_south_asian, thumb_url, calories, protein, carbs, fat, fiber, sugar, confidence, assumptions, tip, times_logged",
    )
    .eq("id", dishId)
    .eq("user_id", user.id)
    .single();

  if (readError || !dish) {
    return { ok: false, error: "Couldn't find that dish." };
  }

  const { error: insertError } = await supabase.from("meals").insert({
    user_id: user.id,
    kitchen_dish_id: dish.id,
    dish_name: dish.name,
    serving_summary: dish.serving_summary,
    cuisine: dish.cuisine,
    is_south_asian: dish.is_south_asian,
    image_url: dish.thumb_url,
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
    fiber: dish.fiber,
    sugar: dish.sugar,
    confidence: dish.confidence,
    assumptions: dish.assumptions ?? [],
    tip: dish.tip,
    // eaten_at defaults to now() — a Kitchen log is always "just now".
  });

  if (insertError) {
    console.error("[logKitchenDish] insert", insertError);
    return { ok: false, error: "Couldn't log this dish. Please try again." };
  }

  // Best-effort: the meal is already saved, so a failed counter bump shouldn't
  // read as a failed log. It only affects ordering in the Kitchen.
  const { error: bumpError } = await supabase
    .from("kitchen_dishes")
    .update({
      times_logged: (Number(dish.times_logged) || 0) + 1,
      last_logged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", dish.id)
    .eq("user_id", user.id);

  if (bumpError) console.error("[logKitchenDish] bump", bumpError);

  revalidatePath("/dashboard");
  revalidatePath("/logs");
  revalidatePath("/kitchen");
  return { ok: true };
}

/**
 * Remove a saved dish. Meals already logged from it are untouched — the foreign
 * key nulls out rather than cascading, so past days keep their totals.
 */
export async function deleteKitchenDish(
  dishId: string,
): Promise<KitchenResult> {
  if (!z.string().uuid().safeParse(dishId).success) {
    return { ok: false, error: "Couldn't find that dish." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to delete a dish." };
  }

  const { error } = await supabase
    .from("kitchen_dishes")
    .delete()
    .eq("id", dishId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteKitchenDish]", error);
    return { ok: false, error: "Couldn't delete this dish. Please try again." };
  }

  revalidatePath("/kitchen");
  revalidatePath("/dashboard");
  return { ok: true };
}
