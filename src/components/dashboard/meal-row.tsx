import type { ReactNode } from "react";
import type { Meal } from "~/lib/meals";
import { cn } from "~/lib/utils";
import { SpiceIcon } from "./icons";

const CONFIDENCE_STYLES: Record<NonNullable<Meal["confidence"]>, string> = {
  high: "text-green-700 dark:text-green-400",
  medium: "text-orange-700 dark:text-orange-400",
  low: "text-red-700 dark:text-red-400",
};

/** A single logged meal: thumbnail, name + portion, macro breakdown, calories.
 * Pass `action` to render a trailing control (e.g. a delete button in Logs). */
export function MealRow({ meal, action }: { meal: Meal; action?: ReactNode }) {
  const time = new Date(meal.eatenAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 px-5 py-3">
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

      <div className="min-w-0 flex-1">
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
        {meal.confidence && (
          <p
            className={cn(
              "mt-0.5 text-[10px] font-medium capitalize",
              CONFIDENCE_STYLES[meal.confidence],
            )}
          >
            {meal.confidence}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
