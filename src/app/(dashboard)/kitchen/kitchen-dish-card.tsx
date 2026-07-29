import { SpiceIcon } from "~/components/dashboard/icons";
import type { KitchenDish } from "~/lib/kitchen";
import { DeleteDishButton } from "./delete-dish-button";
import { LogDishButton } from "./log-dish-button";

/**
 * One saved dish: the snapshot as it was scanned, plus a one-tap re-log.
 *
 * Both kinds of context are read-only — they explain *why* these numbers are
 * what they are, they aren't controls. Changing one would mean re-estimating,
 * which is what "Scan instead" is for.
 *
 * They render differently because they read differently. Prep answers are short
 * fragments ("Ghee", "2 rotis") that scan well as chips. Assumptions — all a
 * dish saved from the logs view has — are full sentences that wrap to three
 * lines inside a pill, so they get a bulleted list instead.
 */
export function KitchenDishCard({ dish }: { dish: KitchenDish }) {
  const prepAnswers = dish.prepAnswers.filter(
    (a) => a.answer.trim().length > 0,
  );
  const assumptions = prepAnswers.length === 0 ? dish.assumptions : [];

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {dish.thumbUrl ? (
          // biome-ignore lint/performance/noImgElement: stored data URL, not a remote asset
          <img
            src={dish.thumbUrl}
            alt={dish.name}
            className="size-14 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <SpiceIcon className="size-6" />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate font-semibold leading-tight">
              {dish.name}
            </h2>
            {dish.isSouthAsian && (
              <SpiceIcon className="size-3.5 shrink-0 text-orange-600" />
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {dish.servingSummary ?? "1 serving"}
          </p>
          <p className="mt-1 text-sm">
            <span className="font-bold tracking-tight">
              {Math.round(dish.calories).toLocaleString()}
            </span>
            <span className="text-muted-foreground"> kcal</span>
          </p>
        </div>

        <DeleteDishButton dishId={dish.id} name={dish.name} />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>P {Math.round(dish.protein)}g</span>
        <span>C {Math.round(dish.carbs)}g</span>
        <span>F {Math.round(dish.fat)}g</span>
        <span>Fiber {Math.round(dish.fiber)}g</span>
        <span>Sugar {Math.round(dish.sugar)}g</span>
      </div>

      {prepAnswers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {prepAnswers.slice(0, 4).map((answer) => (
            <span
              key={answer.question}
              title={`${answer.question} — ${answer.answer}`}
              className="max-w-full truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {answer.answer}
            </span>
          ))}
        </div>
      )}

      {assumptions.length > 0 && (
        <ul className="flex flex-col gap-1">
          {assumptions.slice(0, 2).map((assumption) => (
            <li
              key={assumption}
              title={assumption}
              className="flex gap-1.5 text-xs text-muted-foreground"
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange-600" />
              <span className="line-clamp-2">{assumption}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-1">
        <LogDishButton dishId={dish.id} servingSummary={dish.servingSummary} />
      </div>

      {dish.timesLogged > 0 && (
        <p className="text-xs text-muted-foreground">
          Logged {dish.timesLogged} {dish.timesLogged === 1 ? "time" : "times"}
        </p>
      )}
    </article>
  );
}
