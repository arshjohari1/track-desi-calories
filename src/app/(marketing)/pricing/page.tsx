import type { Metadata } from "next";
import Link from "next/link";
import { UpgradeButton } from "~/components/billing/upgrade-button";
import { CheckIcon } from "~/components/dashboard/icons";
import {
  FREE_DAILY_SCANS,
  FREE_HISTORY_DAYS,
  FREE_KITCHEN_DISHES,
  PLANS,
} from "~/lib/billing/constants";
import { fetchSubscription } from "~/lib/billing/subscription";
import { createClient } from "~/lib/supabase/server";
import { cn } from "~/lib/utils";

export const metadata: Metadata = {
  title: "Pricing · TrackDesiCalories",
  description:
    "Start free with 2 AI scans a day. Go Premium for unlimited scans, full history, trends and export — $10/mo or $70/yr.",
};

type Row = { label: string; free: string; premium: string };

const FEATURES: Row[] = [
  {
    label: "AI meal & label scans",
    free: `${FREE_DAILY_SCANS} per day`,
    premium: "Unlimited*",
  },
  {
    label: "Kitchen — saved dishes",
    free: `Up to ${FREE_KITCHEN_DISHES}`,
    premium: "Unlimited",
  },
  { label: "Manual entry", free: "Unlimited", premium: "Unlimited" },
  {
    label: "Daily dashboard & recent history",
    free: `Today + last ${FREE_HISTORY_DAYS} days`,
    premium: "Full history",
  },
  { label: "Trends & data export", free: "—", premium: "Included" },
];

/** A single plan's bullet list on its card. */
function Bullet({ children, on }: { children: React.ReactNode; on: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      {on ? (
        <CheckIcon className="mt-0.5 size-4 shrink-0 text-orange-600" />
      ) : (
        <span className="mt-0.5 size-4 shrink-0 text-center text-muted-foreground">
          —
        </span>
      )}
      <span className={on ? "text-foreground" : "text-muted-foreground"}>
        {children}
      </span>
    </li>
  );
}

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const subscription = user ? await fetchSubscription(supabase, user.id) : null;
  const isPremium = subscription?.isPremium ?? false;

  return (
    <div className="bg-background">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
            Pricing
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Track free. Go deeper for less than a coffee a month.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            The free plan is genuinely useful — {FREE_DAILY_SCANS} AI scans
            every day, plus unlimited manual entry and Kitchen re-logs. Premium
            removes the scan cap and unlocks your full history, trends and
            export.
          </p>
        </div>

        {/* Plan cards */}
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Free</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you need to log your day.
            </p>
            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">$0</span>
              <span className="text-sm text-muted-foreground">forever</span>
            </p>
            {user ? (
              <Link
                href="/dashboard"
                className="mt-6 flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Go to dashboard
              </Link>
            ) : (
              <Link
                href="/signup"
                className="mt-6 flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Get started free
              </Link>
            )}
            <ul className="mt-6 flex flex-col gap-3">
              <Bullet on>{FREE_DAILY_SCANS} AI scans per day</Bullet>
              <Bullet on>Unlimited manual entry</Bullet>
              <Bullet on>
                Up to {FREE_KITCHEN_DISHES} saved Kitchen dishes
              </Bullet>
              <Bullet on>
                Today + last {FREE_HISTORY_DAYS} days of history
              </Bullet>
              <Bullet on={false}>Trends & data export</Bullet>
            </ul>
          </div>

          {/* Premium */}
          <div className="relative flex flex-col rounded-2xl border-2 border-orange-600 bg-card p-6 shadow-lg sm:p-8">
            <span className="absolute -top-3 left-6 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
              Most popular
            </span>
            <h2 className="text-lg font-semibold">Premium</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For serious tracking, without limits.
            </p>
            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">
                {PLANS.annual.priceLabel}
              </span>
              <span className="text-sm text-muted-foreground">
                {PLANS.annual.period}
              </span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or {PLANS.monthly.priceLabel}
              {PLANS.monthly.period} · cancel anytime
            </p>

            {/* CTA depends on auth + current plan */}
            <div className="mt-6">
              {isPremium ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-orange-600/30 bg-orange-600/5 px-4 py-2.5 text-sm font-semibold text-orange-700 dark:text-orange-400">
                  <CheckIcon className="size-4" />
                  You&apos;re on Premium
                </div>
              ) : user ? (
                <>
                  <UpgradeButton
                    plan="annual"
                    className="flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
                  >
                    Go Premium — {PLANS.annual.priceLabel}/yr
                  </UpgradeButton>
                  <div className="mt-2 text-center">
                    <UpgradeButton
                      plan="monthly"
                      className="text-xs font-medium text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-60"
                      loadingLabel="Starting…"
                    >
                      or pay monthly ({PLANS.monthly.priceLabel}/mo)
                    </UpgradeButton>
                  </div>
                </>
              ) : (
                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                >
                  Get started
                </Link>
              )}
            </div>

            <ul className="mt-6 flex flex-col gap-3">
              <Bullet on>Unlimited AI scans*</Bullet>
              <Bullet on>Unlimited manual entry</Bullet>
              <Bullet on>Unlimited saved Kitchen dishes</Bullet>
              <Bullet on>Full history — every day you&apos;ve logged</Bullet>
              <Bullet on>Trends & CSV export</Bullet>
            </ul>
          </div>
        </div>

        {/* Detailed comparison */}
        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Compare plans
          </h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="bg-muted/40 px-4 py-3 text-left font-semibold text-muted-foreground sm:px-6">
                    Feature
                  </th>
                  <th className="bg-muted/40 px-4 py-3 text-center font-semibold text-muted-foreground sm:px-6">
                    Free
                  </th>
                  <th className="bg-orange-50 px-4 py-3 text-center font-semibold text-orange-700 sm:px-6 dark:bg-orange-950/20 dark:text-orange-400">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row, i) => (
                  <tr
                    key={row.label}
                    className={cn(
                      i < FEATURES.length - 1 && "border-b border-border",
                    )}
                  >
                    <td className="px-4 py-3.5 font-medium sm:px-6">
                      {row.label}
                    </td>
                    <td className="px-4 py-3.5 text-center text-muted-foreground sm:px-6">
                      {row.free}
                    </td>
                    <td className="bg-orange-50/40 px-4 py-3.5 text-center font-medium sm:px-6 dark:bg-orange-950/10">
                      {row.premium}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td className="px-4 py-3.5 font-medium sm:px-6">Price</td>
                  <td className="px-4 py-3.5 text-center text-muted-foreground sm:px-6">
                    Free
                  </td>
                  <td className="bg-orange-50/40 px-4 py-3.5 text-center font-semibold sm:px-6 dark:bg-orange-950/10">
                    {PLANS.monthly.priceLabel}/mo · {PLANS.annual.priceLabel}/yr
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-muted-foreground">
            *Premium has a generous fair-use limit set well above everyday use
            (~10 scans/day) to guard against abuse — it slows, never blocks, a
            real account. Manual entry and Kitchen re-logs never count as scans.
          </p>
        </div>
      </section>
    </div>
  );
}
