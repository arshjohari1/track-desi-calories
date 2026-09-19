import Link from "next/link";
import {
  DownloadIcon,
  LockIcon,
  TrendsIcon,
} from "~/components/dashboard/icons";
import { fetchSubscription } from "~/lib/billing/subscription";
import { startOfDay, toDateParam } from "~/lib/date";
import { fetchMeals, type Meal } from "~/lib/meals";
import { createClient } from "~/lib/supabase/server";
import { getUserTimeZone } from "~/lib/timezone";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;

type DayPoint = { key: string; calories: number };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function MacroAvg({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-center">
      <p className="text-xl font-bold tracking-tight">{Math.round(value)}g</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function TrendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? "";
  const subscription = await fetchSubscription(supabase, userId);

  // Locked state for free users — the whole point of the upgrade.
  if (!subscription.isPremium) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See how your calories and macros move over time.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-orange-600/30 bg-orange-600/5 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-orange-600/10 text-orange-600">
            <LockIcon className="size-7" />
          </span>
          <h2 className="text-lg font-semibold">
            Trends are a Premium feature
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Unlock a 30-day calorie chart, your average daily macros, and CSV
            export of your full history — all included with Premium.
          </p>
          <Link
            href="/pricing"
            className="mt-1 flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            Go Premium
          </Link>
        </div>
      </div>
    );
  }

  const timeZone = await getUserTimeZone();
  const now = Date.now();
  const since = startOfDay(
    timeZone,
    new Date(now - (WINDOW_DAYS - 1) * DAY_MS),
  );
  const meals = await fetchMeals(supabase, userId, { since, limit: 2000 });

  // Aggregate per calendar day in the user's timezone.
  type Agg = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    count: number;
  };
  const byDay = new Map<string, Agg>();
  for (const m of meals as Meal[]) {
    const key = toDateParam(new Date(m.eatenAt), timeZone);
    const a = byDay.get(key) ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      count: 0,
    };
    a.calories += m.calories;
    a.protein += m.protein;
    a.carbs += m.carbs;
    a.fat += m.fat;
    a.fiber += m.fiber;
    a.sugar += m.sugar;
    a.count += 1;
    byDay.set(key, a);
  }

  // Ordered oldest → newest across the whole window, so gaps show as empty bars.
  const series: DayPoint[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const key = toDateParam(new Date(now - i * DAY_MS), timeZone);
    series.push({ key, calories: Math.round(byDay.get(key)?.calories ?? 0) });
  }

  const loggedDays = [...byDay.values()];
  const daysLogged = loggedDays.length;
  const totalMeals = meals.length;
  const maxCalories = Math.max(1, ...series.map((d) => d.calories));

  const avg = (pick: (a: Agg) => number) =>
    daysLogged === 0
      ? 0
      : loggedDays.reduce((sum, a) => sum + pick(a), 0) / daysLogged;

  const avgCalories = Math.round(avg((a) => a.calories));

  if (totalMeals === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your last {WINDOW_DAYS} days at a glance.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-16 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <TrendsIcon className="size-5" />
          </span>
          <p className="text-sm font-medium">Nothing to chart yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Log a few meals and your trends will build up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your last {WINDOW_DAYS} days at a glance.
          </p>
        </div>
        <a
          href="/api/export/meals"
          className="flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted sm:h-10"
        >
          <DownloadIcon className="size-4" />
          Export CSV
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Avg calories / day" value={avgCalories.toLocaleString()} />
        <Stat label="Days logged" value={`${daysLogged} / ${WINDOW_DAYS}`} />
        <Stat label="Meals logged" value={totalMeals.toLocaleString()} />
      </div>

      {/* Daily calories chart */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Daily calories</h2>
          <span className="text-xs text-muted-foreground">
            peak {maxCalories.toLocaleString()} kcal
          </span>
        </div>
        <div className="mt-4 flex h-44 items-end gap-[3px]">
          {series.map((d) => (
            <div
              key={d.key}
              title={`${d.key}: ${d.calories.toLocaleString()} kcal`}
              className="group flex-1"
            >
              <div
                className="w-full rounded-t-sm bg-orange-600/80 transition-colors group-hover:bg-orange-600"
                style={{
                  height: `${Math.max(d.calories === 0 ? 0 : 4, (d.calories / maxCalories) * 100)}%`,
                }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Oldest to newest · hover a bar for the day&apos;s total
        </p>
      </div>

      {/* Average macros */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 className="font-semibold">Average macros per logged day</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <MacroAvg label="Protein" value={avg((a) => a.protein)} />
          <MacroAvg label="Carbs" value={avg((a) => a.carbs)} />
          <MacroAvg label="Fat" value={avg((a) => a.fat)} />
          <MacroAvg label="Fiber" value={avg((a) => a.fiber)} />
          <MacroAvg label="Sugar" value={avg((a) => a.sugar)} />
        </div>
      </div>
    </div>
  );
}
