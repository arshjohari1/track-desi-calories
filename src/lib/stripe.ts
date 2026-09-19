import "server-only";

import Stripe from "stripe";
import { env } from "~/env";
import type { PlanId } from "~/lib/billing/constants";

/**
 * Lazily-built Stripe client. Returns null when STRIPE_SECRET_KEY isn't set, so
 * the app runs (and the rest of billing is testable) before Stripe is wired up.
 * The API version is the one pinned by the installed SDK — don't override it.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!cached) {
    cached = new Stripe(env.STRIPE_SECRET_KEY, {
      appInfo: { name: "track-desi-calories" },
    });
  }
  return cached;
}

/** The configured Stripe Price id for a plan, or null if not set. */
export function priceIdForPlan(plan: PlanId): string | null {
  return plan === "monthly"
    ? (env.STRIPE_PRICE_MONTHLY ?? null)
    : (env.STRIPE_PRICE_ANNUAL ?? null);
}

/** Whether a Stripe status counts as "premium unlocked". */
export function isActiveStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/**
 * The subscription's period end, resilient to Stripe API versions: the Basil
 * API (SDK v18+) moved current_period_end onto subscription items, but older
 * versions keep it on the subscription. Try the item first, then the top level.
 */
export function subscriptionPeriodEnd(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0] as
    | { current_period_end?: number }
    | undefined;
  const ts =
    item?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  return typeof ts === "number" ? new Date(ts * 1000).toISOString() : null;
}

/** Infer the plan from the subscription's billing interval. */
export function planFromSubscription(sub: Stripe.Subscription): PlanId | null {
  const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "year") return "annual";
  if (interval === "month") return "monthly";
  return null;
}
