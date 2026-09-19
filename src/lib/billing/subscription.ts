import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanId } from "./constants";

/**
 * A user's subscription state, read from the profiles billing columns. Those
 * columns are written only by the Stripe webhook (service_role) and pinned
 * against user writes by a trigger — see the billing-columns migration — so this
 * is a trustworthy source for gating.
 */
export type Subscription = {
  isPremium: boolean;
  status: string | null;
  plan: PlanId | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
};

const FREE: Subscription = {
  isPremium: false,
  status: null,
  plan: null,
  currentPeriodEnd: null,
  stripeCustomerId: null,
};

/**
 * Fetch a user's subscription. Fails safe to the free tier on any error or
 * missing row so a billing-read hiccup never accidentally unlocks premium.
 */
export async function fetchSubscription(
  supabase: SupabaseClient,
  userId: string,
): Promise<Subscription> {
  if (!userId) return FREE;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "is_premium, subscription_status, plan, current_period_end, stripe_customer_id",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return FREE;

  return {
    isPremium: Boolean(data.is_premium),
    status: data.subscription_status ?? null,
    plan: (data.plan as PlanId | null) ?? null,
    currentPeriodEnd: data.current_period_end ?? null,
    stripeCustomerId: data.stripe_customer_id ?? null,
  };
}
