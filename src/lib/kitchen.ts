import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Confidence } from "~/lib/meals";

/**
 * Reads for the Kitchen: dishes a user saved so they can re-log a repeat meal
 * without another scan.
 *
 * A dish is a snapshot of one completed scan, not a recipe — it holds the
 * macros as estimated, for the portion described by `servingSummary`. Logging
 * one copies these numbers onto a new meal verbatim.
 *
 * Same `numeric` caveat as meals.ts: PostgREST may serialize those columns as
 * strings, so every value goes through `Number()` in `toKitchenDish`.
 */

export type PrepAnswer = { question: string; answer: string };

export type KitchenDish = {
  id: string;
  name: string;
  source: "photo" | "label";
  cuisine: string | null;
  isSouthAsian: boolean;
  thumbUrl: string | null;
  servingSummary: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  confidence: Confidence | null;
  prepAnswers: PrepAnswer[];
  assumptions: string[];
  tip: string | null;
  timesLogged: number;
  lastLoggedAt: string | null;
};

const DISH_SELECT =
  "id, name, source, cuisine, is_south_asian, thumb_url, serving_summary, calories, protein, carbs, fat, fiber, sugar, confidence, prep_answers, assumptions, tip, times_logged, last_logged_at";

type RawDish = {
  id: string;
  name: string;
  source: "photo" | "label";
  cuisine: string | null;
  is_south_asian: boolean;
  thumb_url: string | null;
  serving_summary: string | null;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
  fiber: number | string;
  sugar: number | string;
  confidence: Confidence | null;
  prep_answers: unknown;
  assumptions: string[] | null;
  tip: string | null;
  times_logged: number | string;
  last_logged_at: string | null;
};

/**
 * `prep_answers` is jsonb, so the shape is only guaranteed by whatever wrote it.
 * Drop anything that doesn't look like a {question, answer} pair rather than
 * letting a malformed entry crash the card that renders it.
 */
function toPrepAnswers(value: unknown): PrepAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const { question, answer } = entry as Record<string, unknown>;
    if (typeof question !== "string" || typeof answer !== "string") return [];
    return [{ question, answer }];
  });
}

function toKitchenDish(row: RawDish): KitchenDish {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    cuisine: row.cuisine,
    isSouthAsian: Boolean(row.is_south_asian),
    thumbUrl: row.thumb_url,
    servingSummary: row.serving_summary,
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    carbs: Number(row.carbs) || 0,
    fat: Number(row.fat) || 0,
    fiber: Number(row.fiber) || 0,
    sugar: Number(row.sugar) || 0,
    confidence: row.confidence,
    prepAnswers: toPrepAnswers(row.prep_answers),
    assumptions: row.assumptions ?? [],
    tip: row.tip,
    timesLogged: Number(row.times_logged) || 0,
    lastLoggedAt: row.last_logged_at,
  };
}

/**
 * A user's saved dishes. Ordered by how often they're logged so the ones they
 * actually repeat surface first; `limit` powers the dashboard's short rail.
 * Returns an empty array on any error so pages degrade to their empty states.
 */
export async function fetchKitchenDishes(
  supabase: SupabaseClient,
  userId: string,
  opts: { limit?: number } = {},
): Promise<KitchenDish[]> {
  if (!userId) return [];

  let query = supabase
    .from("kitchen_dishes")
    .select(DISH_SELECT)
    .eq("user_id", userId)
    .order("times_logged", { ascending: false })
    .order("last_logged_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as RawDish[]).map(toKitchenDish);
}

/** How many dishes a user has saved, for the dashboard tile. 0 on error. */
export async function fetchKitchenDishCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("kitchen_dishes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}
