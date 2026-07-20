"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "~/lib/supabase/server";

export type LogMealResult = { ok: true } | { ok: false; error: string };

// Mirrors the fields the scan flow already has on the result screen. The image
// is the same compressed data URL that was sent to the AI, or null if we somehow
// lost it. Generous numeric ceilings just guard against garbage, not real meals.
const logMealSchema = z.object({
  image: z.string().max(12_000_000).nullable(),
  dishName: z.string().min(1).max(200),
  servingSummary: z.string().max(500).nullable(),
  cuisine: z.string().max(120).nullable(),
  isSouthAsian: z.boolean(),
  calories: z.number().min(0).max(20_000),
  protein: z.number().min(0).max(5_000),
  carbs: z.number().min(0).max(5_000),
  fat: z.number().min(0).max(5_000),
  fiber: z.number().min(0).max(5_000),
  confidence: z.enum(["low", "medium", "high"]),
  assumptions: z.array(z.string()).max(20),
  tip: z.string().max(2000).nullable(),
});

export type LogMealInput = z.infer<typeof logMealSchema>;

/** Persist a scanned meal so it shows up in the tracker, recent meals, and logs. */
export async function logMeal(input: LogMealInput): Promise<LogMealResult> {
  const parsed = logMealSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "That meal is missing some details — rescan it.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be signed in to log a meal." };
  }

  const m = parsed.data;
  const { error } = await supabase.from("meals").insert({
    user_id: user.id,
    dish_name: m.dishName,
    serving_summary: m.servingSummary,
    cuisine: m.cuisine,
    is_south_asian: m.isSouthAsian,
    image_url: m.image,
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    fiber: m.fiber,
    confidence: m.confidence,
    assumptions: m.assumptions,
    tip: m.tip,
  });

  if (error) {
    console.error("[logMeal]", error);
    return { ok: false, error: "Couldn't save this meal. Please try again." };
  }

  // Refresh the tracker and history so the new meal shows up immediately.
  revalidatePath("/dashboard");
  revalidatePath("/logs");
  return { ok: true };
}
