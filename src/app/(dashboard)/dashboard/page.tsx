import Link from "next/link";
import { LogDishButton } from "~/app/(dashboard)/kitchen/log-dish-button";
import {
  KitchenIcon,
  LogsIcon,
  PlusIcon,
  UploadIcon,
} from "~/components/dashboard/icons";
import { MealRow } from "~/components/dashboard/meal-row";
import { FREE_DAILY_SCANS } from "~/lib/billing/constants";
import { countScansToday } from "~/lib/billing/scan-metering";
import { fetchSubscription } from "~/lib/billing/subscription";
import {
  endOfDay,
  formatDayLabel,
  parseDateParam,
  startOfDay,
} from "~/lib/date";
import { getCalorieStatus } from "~/lib/goal-status";
import { fetchKitchenDishCount, fetchKitchenDishes } from "~/lib/kitchen";
import { fetchMeals, sumCalories, sumMacros } from "~/lib/meals";
import { GOALS, type Goal } from "~/lib/onboarding";
import { createClient } from "~/lib/supabase/server";
import { getUserTimeZone } from "~/lib/timezone";
import { cn } from "~/lib/utils";

// Status highlights use the app's brand orange in every state — no green.
const STATUS_ACCENT = "text-orange-700 dark:text-orange-400";

function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

function MacroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-center">
      <p className="text-xl font-bold tracking-tight">{Math.round(value)}g</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-5 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
      {action}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; upgraded?: string }>;
}) {
  const { date, upgraded } = await searchParams;
  const timeZone = await getUserTimeZone();
  const selectedDay = parseDateParam(date, timeZone) ?? startOfDay(timeZone);
  const dayEnd = endOfDay(timeZone, selectedDay);
  const isToday = selectedDay.getTime() === startOfDay(timeZone).getTime();
  const dayLabel = formatDayLabel(selectedDay, timeZone);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? "";
  // Display name from Auth user_metadata; greet with just the first name.
  const fullName =
    typeof user?.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : "";
  const firstName = fullName.trim().split(/\s+/)[0] ?? "";

  const [
    { data: profile },
    dayMeals,
    recentMeals,
    topDishes,
    savedDishCount,
    subscription,
    scansUsedToday,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("daily_calorie_target, goal")
      .eq("id", userId)
      .maybeSingle(),
    fetchMeals(supabase, userId, { since: selectedDay, until: dayEnd }),
    fetchMeals(supabase, userId, { limit: 5 }),
    // The rail is the point of the Kitchen: repeat logging happens here, not
    // on a page the user has to navigate to.
    fetchKitchenDishes(supabase, userId, { limit: 3 }),
    fetchKitchenDishCount(supabase, userId),
    fetchSubscription(supabase, userId),
    countScansToday(supabase, userId, timeZone),
  ]);

  const scansLeft = Math.max(0, FREE_DAILY_SCANS - scansUsedToday);

  const target: number | null = profile?.daily_calorie_target ?? null;
  const consumed = Math.round(sumCalories(dayMeals));
  const macros = sumMacros(dayMeals);
  const remaining = target !== null ? target - consumed : null;
  const goalLabel = GOALS.find((g) => g.value === profile?.goal)?.label ?? null;

  // Goal-aware status once there's something logged; drives the message and the
  // Remaining tile (so going over reads as "Over by X", not a scary "-X").
  const status =
    target !== null && dayMeals.length > 0
      ? getCalorieStatus(
          (profile?.goal as Goal | null) ?? null,
          target,
          consumed,
        )
      : null;

  const remainingDisplay =
    target === null
      ? "—"
      : status?.state === "on-target"
        ? "On target"
        : status?.state === "over"
          ? status.diff.toLocaleString()
          : (remaining ?? 0).toLocaleString();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        {firstName ? (
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hey, {firstName}!
          </h1>
        ) : (
          <span />
        )}
        {/* Plan indicator — always visible so users know which tier they're on. */}
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            subscription.isPremium
              ? "bg-orange-600/10 text-orange-700 dark:text-orange-400"
              : "border border-border text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              subscription.isPremium ? "bg-orange-600" : "bg-muted-foreground",
            )}
          />
          {subscription.isPremium ? "Premium plan" : "Free plan"}
        </span>
      </div>

      {upgraded === "1" && (
        <div className="mb-6 rounded-lg border border-green-600/30 bg-green-600/5 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-400">
          🎉 Thanks for upgrading! Your Premium features are unlocking now — if
          anything still looks locked, refresh in a moment.
        </div>
      )}

      {/* Free-tier meter: reinforces the daily allowance and offers the upgrade
          path. Hidden for premium, who have no daily cap. */}
      {!subscription.isPremium && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{scansLeft}</span>{" "}
            of {FREE_DAILY_SCANS} free AI scans left today
            {scansLeft === 0 && " · resets at midnight"}
          </p>
          <Link
            href="/pricing"
            className="text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
          >
            Go Premium →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          {/* Today's calories — no goal set yet */}
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isToday ? "Today's Calories" : `Calories · ${dayLabel}`}
                </p>
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight">
                    {consumed.toLocaleString()}
                  </span>
                  {target !== null && (
                    <span className="text-lg font-medium text-muted-foreground">
                      / {target.toLocaleString()}
                    </span>
                  )}
                  <span className="text-lg font-semibold text-orange-600">
                    kcal
                  </span>
                </p>
              </div>

              {/* Equal-width on phones so the pair reads as one control group
                  and each half is a comfortable tap target. */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
                <Link
                  href="/scan"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700 sm:h-10 sm:px-4"
                >
                  <UploadIcon className="size-4 shrink-0" />
                  Upload Photo
                </Link>
                <Link
                  href="/scan?mode=manual"
                  className="flex h-11 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted sm:h-10 sm:px-4"
                >
                  <PlusIcon className="size-4 shrink-0" />
                  Add Meal
                </Link>
              </div>
            </div>

            {/* Goal status on its own full-width line so it can wrap freely
                without ever shifting the action buttons above it. */}
            {status && isToday ? (
              <p className={cn("mt-3 text-sm font-medium", STATUS_ACCENT)}>
                {status.message}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                {target !== null
                  ? `Daily goal: ${target.toLocaleString()} kcal${goalLabel ? ` · ${goalLabel}` : ""}`
                  : "No daily goal set yet"}
              </p>
            )}

            <div className="mt-6 grid grid-cols-3 divide-x divide-border border-t border-border pt-5">
              <div className="px-2 text-center sm:px-4 sm:text-left">
                <p className="text-xs text-muted-foreground">
                  {status?.state === "over" ? "Over goal" : "Remaining"}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-lg font-bold",
                    target === null && "text-muted-foreground",
                    (status?.state === "over" ||
                      status?.state === "on-target") &&
                      STATUS_ACCENT,
                  )}
                >
                  {remainingDisplay}
                </p>
              </div>
              <div className="px-2 text-center sm:px-4 sm:text-left">
                <p className="text-xs text-muted-foreground">Logged meals</p>
                <p className="mt-0.5 text-lg font-bold">{dayMeals.length}</p>
              </div>
              <div className="px-2 text-center sm:px-4 sm:text-left">
                <p className="text-xs text-muted-foreground">Saved dishes</p>
                <p className="mt-0.5 text-lg font-bold">{savedDishCount}</p>
              </div>
            </div>
          </Card>

          {/* Macros for the selected day */}
          {dayMeals.length > 0 && (
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {isToday ? "Macros today" : `Macros · ${dayLabel}`}
                </h2>
                <span className="text-xs text-muted-foreground">grams</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <MacroStat label="Protein" value={macros.protein} />
                <MacroStat label="Carbs" value={macros.carbs} />
                <MacroStat label="Fat" value={macros.fat} />
                <MacroStat label="Fiber" value={macros.fiber} />
                <MacroStat label="Sugar" value={macros.sugar} />
              </div>
            </Card>
          )}

          {/* Selected day's meals — the day in view is what matters most, so it
              sits above the rolling recent list. */}
          <Card className="p-0">
            <div className="border-b border-border px-4 py-4 sm:px-5">
              <h2 className="font-semibold">
                {isToday ? "Today's meals" : `Meals · ${dayLabel}`}
              </h2>
            </div>
            {dayMeals.length > 0 ? (
              <div className="divide-y divide-border">
                {dayMeals.map((meal) => (
                  <MealRow key={meal.id} meal={meal} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={KitchenIcon}
                title={
                  isToday ? "Nothing logged today" : `No meals on ${dayLabel}`
                }
                hint={
                  isToday
                    ? "Your breakfast, lunch, snacks, and dinner will show up here."
                    : undefined
                }
              />
            )}
            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-4 sm:px-5">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold">
                {consumed.toLocaleString()} kcal
              </span>
            </div>
          </Card>

          {/* Recent meals */}
          <Card className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <h2 className="font-semibold">Recent meals</h2>
              {recentMeals.length > 0 && (
                // Negative margin keeps the visual position while giving the
                // link a 40px tap target on touch screens.
                <Link
                  href="/logs"
                  className="-my-2.5 inline-flex shrink-0 items-center py-2.5 text-sm font-medium text-orange-600 transition-colors hover:text-orange-700"
                >
                  View all
                </Link>
              )}
            </div>
            {recentMeals.length > 0 ? (
              <div className="divide-y divide-border">
                {recentMeals.map((meal) => (
                  <MealRow key={meal.id} meal={meal} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={LogsIcon}
                title="No meals logged yet"
                hint="Upload a photo of your meal to log your first entry."
                action={
                  <Link
                    href="/scan"
                    className="mt-1 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                  >
                    <UploadIcon className="size-4" />
                    Scan a meal
                  </Link>
                }
              />
            )}
          </Card>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-6">
          {/* Kitchen */}
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Kitchen</h2>
              {topDishes.length > 0 && (
                <Link
                  href="/kitchen"
                  className="-my-3 inline-flex shrink-0 items-center py-3 text-xs font-medium text-orange-600 transition-colors hover:text-orange-700"
                >
                  View all
                </Link>
              )}
            </div>
            {topDishes.length > 0 ? (
              <div className="mt-3 flex flex-col gap-3">
                {topDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    {dish.thumbUrl ? (
                      // biome-ignore lint/performance/noImgElement: stored data URL, not a remote asset
                      <img
                        src={dish.thumbUrl}
                        alt={dish.name}
                        className="size-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <KitchenIcon className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {dish.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {Math.round(dish.calories).toLocaleString()} kcal
                        {dish.servingSummary ? ` · ${dish.servingSummary}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <LogDishButton
                        dishId={dish.id}
                        servingSummary={null}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={KitchenIcon}
                title="Your Kitchen is empty"
                hint="Save a dish after a scan and it will show up here for one-tap logging."
                action={
                  <Link
                    href="/scan"
                    className="mt-1 rounded-lg border border-orange-600 px-4 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/40"
                  >
                    Scan a meal
                  </Link>
                }
                className="px-0 py-8"
              />
            )}
          </Card>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Accurate for South Asian home-cooked meals. Save once, log faster next
        time.
      </p>
    </div>
  );
}
