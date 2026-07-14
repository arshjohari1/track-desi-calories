import Link from "next/link";
import {
  GoalsIcon,
  KitchenIcon,
  LogsIcon,
  PlusIcon,
  RestartIcon,
  UploadIcon,
} from "~/components/dashboard/icons";
import { GOALS } from "~/lib/onboarding";
import { createClient } from "~/lib/supabase/server";
import { cn } from "~/lib/utils";

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
        "rounded-xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      {children}
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("daily_calorie_target, goal")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const target: number | null = profile?.daily_calorie_target ?? null;
  // No meals logged yet, so consumed is 0 for now.
  const consumed = 0;
  const remaining = target !== null ? target - consumed : null;
  const goalLabel = GOALS.find((g) => g.value === profile?.goal)?.label ?? null;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          {/* Today's calories — no goal set yet */}
          <Card>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Today&apos;s Calories
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
                <p className="mt-1 text-sm text-muted-foreground">
                  {target !== null
                    ? `Daily goal: ${target.toLocaleString()} kcal${goalLabel ? ` · ${goalLabel}` : ""}`
                    : "No daily goal set yet"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/scan"
                  className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                >
                  <UploadIcon className="size-4" />
                  Upload Photo
                </Link>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <PlusIcon className="size-4" />
                  Add Meal
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <RestartIcon className="size-4" />
                  Restart Scan
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x divide-border border-t border-border pt-5">
              <div className="px-2 text-center sm:px-4 sm:text-left">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p
                  className={cn(
                    "mt-0.5 text-lg font-bold",
                    remaining === null && "text-muted-foreground",
                  )}
                >
                  {remaining !== null ? remaining.toLocaleString() : "—"}
                </p>
              </div>
              <div className="px-2 text-center sm:px-4 sm:text-left">
                <p className="text-xs text-muted-foreground">Logged meals</p>
                <p className="mt-0.5 text-lg font-bold">0</p>
              </div>
              <div className="px-2 text-center sm:px-4 sm:text-left">
                <p className="text-xs text-muted-foreground">Saved recipes</p>
                <p className="mt-0.5 text-lg font-bold">0</p>
              </div>
            </div>
          </Card>

          {/* Recent meals */}
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Recent meals</h2>
            </div>
            <EmptyState
              icon={LogsIcon}
              title="No meals logged yet"
              hint="Upload a photo of your meal to log your first entry."
            />
          </Card>

          {/* Today's meals */}
          <Card className="p-0">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold">Today&apos;s meals</h2>
            </div>
            <EmptyState
              icon={KitchenIcon}
              title="Nothing logged today"
              hint="Your breakfast, lunch, snacks, and dinner will show up here."
            />
            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-5 py-4">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-sm font-bold">0 kcal</span>
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-6">
          {/* Daily goal */}
          <Card>
            <h2 className="font-semibold">Daily goal</h2>
            {target !== null ? (
              <div className="flex flex-col items-center gap-1 py-8 text-center">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-bold tracking-tight text-orange-600">
                    {target.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    kcal
                  </span>
                </span>
                <p className="text-sm text-muted-foreground">
                  {goalLabel
                    ? `Personalized for your goal to ${goalLabel.toLowerCase()}`
                    : "Your personalized daily target"}
                </p>
                <Link
                  href="/settings"
                  className="mt-3 rounded-lg border border-border px-4 py-2 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Adjust in Settings
                </Link>
              </div>
            ) : (
              <EmptyState
                icon={GoalsIcon}
                title="No goal set"
                hint="Set a daily calorie target in your settings to track progress."
                action={
                  <Link
                    href="/settings"
                    className="mt-1 rounded-lg border border-orange-600 px-4 py-2 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-50 dark:hover:bg-orange-950/40"
                  >
                    Go to Settings
                  </Link>
                }
                className="px-0 py-8"
              />
            )}
          </Card>

          {/* Kitchen */}
          <Card>
            <h2 className="font-semibold">Kitchen</h2>
            <EmptyState
              icon={KitchenIcon}
              title="Your Kitchen is empty"
              hint="Save a recipe and it will show up here for faster logging."
              className="px-0 py-8"
            />
          </Card>

          {/* Repeat dishes */}
          <Card>
            <h2 className="font-semibold">Repeat dishes</h2>
            <EmptyState
              icon={RestartIcon}
              title="No repeat dishes yet"
              hint="Meals you log often will appear here."
              className="px-0 py-8"
            />
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
