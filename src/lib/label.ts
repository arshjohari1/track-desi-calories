/**
 * Nutrition-label scan — pure helpers for scaling a packaged food's PER-SERVING
 * macros by how much the user actually ate.
 *
 * Deliberately framework-free and NOT `server-only`: the label AI schema (server
 * side, in `~/lib/ai/food`) and the label flow (client component) both share
 * these types, and the scaling math is unit-testable in isolation.
 */

export type PerServingMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
};

/** What the AI reads off a nutrition label, normalized to kcal + grams. */
export type LabelReading = {
  productName: string;
  servingSizeText: string;
  /** Grams in ONE serving if determinable, else null (enables the grams path). */
  servingSizeGrams: number | null;
  servingsPerContainer: number | null;
  /** Net weight of the WHOLE package in grams, if printed, for a "whole pack" amount. */
  netWeightGrams: number | null;
  perServing: PerServingMacros;
  confidence: "low" | "medium" | "high";
  /** Normalizations/assumptions, e.g. "Converted kJ to kcal", "Fiber not listed". */
  notes: string[];
  /** False when the photo doesn't look like a nutrition panel at all. */
  isLabel: boolean;
};

export type AmountMode = "servings" | "grams";

export type AmountInput = {
  mode: AmountMode;
  servings: number;
  grams: number;
  servingSizeGrams: number | null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * How many servings the eaten amount represents. In servings mode that's just
 * the servings value; in grams mode it's grams ÷ one-serving-grams. Falls back
 * to the servings value if the gram weight of a serving is unknown. Never < 0.
 */
export function computeFactor({
  mode,
  servings,
  grams,
  servingSizeGrams,
}: AmountInput): number {
  if (mode === "grams") {
    if (!servingSizeGrams || servingSizeGrams <= 0) {
      return Math.max(0, servings);
    }
    return Math.max(0, grams) / servingSizeGrams;
  }
  return Math.max(0, servings);
}

/**
 * Scale per-serving macros by a factor. Calories round to whole kcal; the gram
 * macros round to 0.1 g so scaling by fractional servings doesn't leave noise.
 */
export function scaleMacros(
  perServing: PerServingMacros,
  factor: number,
): PerServingMacros {
  const f = Number.isFinite(factor) && factor > 0 ? factor : 0;
  return {
    calories: Math.round(perServing.calories * f),
    protein: round1(perServing.protein * f),
    carbs: round1(perServing.carbs * f),
    fat: round1(perServing.fat * f),
    fiber: round1(perServing.fiber * f),
    sugar: round1(perServing.sugar * f),
  };
}

/**
 * Work out an amount that represents the WHOLE package, so the "whole thing"
 * shortcut can log an entire pack in one tap.
 *
 * Prefers servings-per-container (exact), else derives from the pack's net
 * weight ÷ one serving's weight. Returns null when the label gives us neither —
 * the label alone just doesn't say how big the pack is, so the UI has to ask.
 */
export function deriveWholePack({
  servingsPerContainer,
  netWeightGrams,
  servingSizeGrams,
}: {
  servingsPerContainer: number | null;
  netWeightGrams: number | null;
  servingSizeGrams: number | null;
}): { mode: AmountMode; servings: number; grams: number } | null {
  if (servingsPerContainer && servingsPerContainer > 0) {
    return { mode: "servings", servings: servingsPerContainer, grams: 0 };
  }
  if (
    netWeightGrams &&
    netWeightGrams > 0 &&
    servingSizeGrams &&
    servingSizeGrams > 0
  ) {
    return { mode: "grams", servings: 1, grams: netWeightGrams };
  }
  return null;
}

/** Human-readable amount eaten, for the logged meal's serving summary. */
export function formatAmountEaten({
  mode,
  servings,
  grams,
  servingSizeGrams,
}: AmountInput): string {
  if (mode === "grams") {
    return `${Math.max(0, Math.round(grams))} g`;
  }
  const s = Math.max(0, servings);
  const label = s === 1 ? "serving" : "servings";
  const sStr = Number.isInteger(s) ? String(s) : String(round1(s));
  const gramsPart =
    servingSizeGrams && servingSizeGrams > 0
      ? ` (${Math.round(s * servingSizeGrams)} g)`
      : "";
  return `${sStr} ${label}${gramsPart}`;
}
