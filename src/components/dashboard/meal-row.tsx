import type { ReactNode } from "react";
import type { Meal } from "~/lib/meals";
import { cn } from "~/lib/utils";
import { SpiceIcon } from "./icons";

/** A single logged meal: thumbnail, name + portion, macro breakdown, calories.
 * Pass `action` to render a trailing control (e.g. a delete button in Logs).
 *
 * Deliberately no confidence badge. Confidence is useful while you're deciding
 * whether to accept an estimate, which is the scan screen's job — once the meal
 * is logged the number is the number, and repeating "medium" on every row was
 * noise. It is still stored on the meal and shown during the scan. */
export function MealRow({ meal, action }: { meal: Meal; action?: ReactNode }) {
  const time = new Date(meal.eatenAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    // Wraps on narrow screens: with a trailing action slot, thumbnail + name +
    // calories + buttons on one line squeezed the name column to ~76px at 320px.
    // The `min-w-36` floor on the name column overflows the line just enough to
    // push the action block onto its own row, where it right-aligns.
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
      {meal.imageUrl ? (
        // biome-ignore lint/performance/noImgElement: stored data URL, not a remote asset
        <img
          src={meal.imageUrl}
          alt={meal.dishName}
          className="size-12 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <SpiceIcon className="size-5" />
        </span>
      )}

      <div className={cn("flex-1", action ? "min-w-36 sm:min-w-0" : "min-w-0")}>
        <div className="flex items-center gap-1.5">
          <p className="truncate font-medium">{meal.dishName}</p>
          {meal.isSouthAsian && (
            <SpiceIcon className="size-3.5 shrink-0 text-orange-600" />
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {time}
          {meal.servingSummary ? ` · ${meal.servingSummary}` : ""}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>P {Math.round(meal.protein)}g</span>
          <span>C {Math.round(meal.carbs)}g</span>
          <span>F {Math.round(meal.fat)}g</span>
          <span>Fiber {Math.round(meal.fiber)}g</span>
          <span>Sugar {Math.round(meal.sugar)}g</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-lg font-bold leading-none tracking-tight">
          {Math.round(meal.calories).toLocaleString()}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">kcal</p>
      </div>

      {action && <div className="ml-auto shrink-0 sm:ml-0">{action}</div>}
    </div>
  );
}
