import Link from "next/link";
import { CheckIcon } from "~/components/dashboard/icons";
import {
  FREE_DAILY_SCANS,
  FREE_HISTORY_DAYS,
  FREE_KITCHEN_DISHES,
  PLANS,
} from "~/lib/billing/constants";

/**
 * Pricing section for the marketing landing page: the Free-vs-Premium columns,
 * with the same numbers the full /pricing page and the app enforce (via the
 * shared billing constants, so they can't drift). Links out to /pricing for the
 * complete comparison table.
 */
function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <CheckIcon className="mt-0.5 size-4 shrink-0 text-orange-600" />
      <span className="text-foreground">{children}</span>
    </li>
  );
}

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="border-t border-border bg-background py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Start free with {FREE_DAILY_SCANS} AI scans a day. Go Premium when
            you want unlimited scans, your full history, trends and export.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold">Free</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything you need to log your day.
            </p>
            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">$0</span>
              <span className="text-sm text-muted-foreground">forever</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              <Feature>{FREE_DAILY_SCANS} AI scans per day</Feature>
              <Feature>Unlimited manual entry</Feature>
              <Feature>
                Up to {FREE_KITCHEN_DISHES} saved Kitchen dishes
              </Feature>
              <Feature>
                Today + last {FREE_HISTORY_DAYS} days of history
              </Feature>
            </ul>
            <Link
              href="/signup"
              className="mt-8 flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Get started free
            </Link>
          </div>

          {/* Premium */}
          <div className="relative flex flex-col rounded-2xl border-2 border-orange-600 bg-card p-6 shadow-lg sm:p-8">
            <span className="absolute -top-3 left-6 rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white">
              Most popular
            </span>
            <h3 className="text-lg font-semibold">Premium</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Unlimited tracking, with the full picture.
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
            <ul className="mt-6 flex flex-1 flex-col gap-3">
              <Feature>Unlimited AI scans</Feature>
              <Feature>Unlimited saved Kitchen dishes</Feature>
              <Feature>Full history — every day you&apos;ve logged</Feature>
              <Feature>Trends &amp; CSV export</Feature>
            </ul>
            <Link
              href="/signup"
              className="mt-8 flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              Get started
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link
            href="/pricing"
            className="font-semibold text-orange-600 underline-offset-4 transition-colors hover:text-orange-700 hover:underline"
          >
            See the full plan comparison →
          </Link>
        </p>
      </div>
    </section>
  );
}
