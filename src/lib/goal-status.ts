import type { Goal } from "~/lib/onboarding";

/**
 * Turns a day's calorie total into a goal-aware status for the dashboard.
 *
 * The target means different things per goal: for "lose" it's a ceiling (under
 * is good), for "gain" a floor (over is good), for "maintain" a set point (near
 * it is good). We treat landing within ±5% of the target as "on target" — tight
 * enough to be meaningful, loose enough that normal estimate noise doesn't read
 * as failure.
 */

export type CalorieState = "under" | "on-target" | "over";

export type CalorieStatus = {
  state: CalorieState;
  /** Absolute kcal distance from the target (always >= 0). */
  diff: number;
  /** One-line, goal-aware message for the tracker card. */
  message: string;
};

const BAND_RATIO = 0.05;

export function getCalorieStatus(
  goal: Goal | null,
  target: number,
  consumed: number,
): CalorieStatus {
  const band = Math.max(1, Math.round(target * BAND_RATIO));
  const diffSigned = consumed - target; // positive = over, negative = under
  const diff = Math.abs(diffSigned);

  if (diff <= band) {
    return { state: "on-target", diff, message: onTarget(goal) };
  }
  if (diffSigned > 0) {
    return { state: "over", diff, message: over(goal, diff) };
  }
  return { state: "under", diff, message: under(goal, diff) };
}

function kcal(n: number): string {
  return `${n.toLocaleString()} kcal`;
}

function onTarget(goal: Goal | null): string {
  switch (goal) {
    case "lose":
      return "Right on your goal — nice work for a lose-weight day.";
    case "gain":
      return "Goal reached — perfect for a gain day.";
    case "maintain":
      return "Right on your goal — perfect for maintaining.";
    default:
      return "Right on your goal for today.";
  }
}

function over(goal: Goal | null, diff: number): string {
  switch (goal) {
    case "lose":
      return `Goal reached, and you're ${kcal(diff)} over — ease back to keep losing.`;
    case "gain":
      return `Goal reached, and you're ${kcal(diff)} over — extra fuel for gaining.`;
    case "maintain":
      return `Goal reached, and you're ${kcal(diff)} over — ease off to stay balanced.`;
    default:
      return `You're ${kcal(diff)} over today's goal.`;
  }
}

function under(goal: Goal | null, diff: number): string {
  switch (goal) {
    case "lose":
      return `On track — ${kcal(diff)} left before today's goal.`;
    case "gain":
      return `${kcal(diff)} to go — eat a bit more to hit your gain goal.`;
    case "maintain":
      return `${kcal(diff)} under your goal — a little light for maintaining.`;
    default:
      return `${kcal(diff)} left today.`;
  }
}
