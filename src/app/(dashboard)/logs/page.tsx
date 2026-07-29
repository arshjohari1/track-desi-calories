import Link from "next/link";
import { LogsIcon, UploadIcon } from "~/components/dashboard/icons";
import { MealRow } from "~/components/dashboard/meal-row";
import { SaveToKitchenButton } from "~/components/dashboard/save-to-kitchen-button";
import { fetchMeals, groupMealsByDay } from "~/lib/meals";
import { createClient } from "~/lib/supabase/server";
import { getUserTimeZone } from "~/lib/timezone";
import { DeleteMealButton } from "./delete-meal-button";

const PAGE_SIZE = 20;
const MAX_LIMIT = 200;

/**
 * "Load older meals" bumps `?limit=` and re-fetches from the top rather than
 * paging with a cursor. Slightly wasteful, but it needs no client state and
 * every row carries a base64 thumbnail, so the ceiling matters more than the
 * redundancy: without one, a long history would pull megabytes per view.
 */
function parseLimit(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < PAGE_SIZE) return PAGE_SIZE;
  return Math.min(n, MAX_LIMIT);
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const limit = parseLimit((await searchParams).limit);
  const timeZone = await getUserTimeZone();
  const meals = await fetchMeals(supabase, user?.id ?? "", { limit });
  const days = groupMealsByDay(meals, timeZone);
  // A full page back means there are probably older meals still unfetched.
  const hasMore = meals.length >= limit && limit < MAX_LIMIT;

  if (days.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LogsIcon className="size-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your meal history and daily totals will appear here once you start
          logging.
        </p>
        <Link
          href="/scan"
          className="mt-1 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          <UploadIcon className="size-4" />
          Scan your first meal
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every meal you&apos;ve logged, grouped by day with daily totals.
          </p>
        </div>
        <Link
          href="/scan"
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          <UploadIcon className="size-4" />
          Log a meal
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {days.map((day) => (
          <section
            key={day.key}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="font-semibold">{day.label}</h2>
              <span className="text-sm text-muted-foreground">
                {day.meals.length} {day.meals.length === 1 ? "meal" : "meals"} ·{" "}
                <span className="font-semibold text-foreground">
                  {Math.round(day.total).toLocaleString()} kcal
                </span>
              </span>
            </div>
            <div className="divide-y divide-border">
              {day.meals.map((meal) => (
                <MealRow
                  key={meal.id}
                  meal={meal}
                  action={
                    <div className="flex items-center gap-0.5">
                      <SaveToKitchenButton
                        variant="icon"
                        defaultName={meal.dishName}
                        mealId={meal.id}
                      />
                      <DeleteMealButton
                        mealId={meal.id}
                        dishName={meal.dishName}
                      />
                    </div>
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Link
            href={`/logs?limit=${Math.min(limit + PAGE_SIZE, MAX_LIMIT)}`}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            Load older meals
          </Link>
        </div>
      )}
    </div>
  );
}
