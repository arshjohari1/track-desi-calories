import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { PlanId } from "~/lib/billing/constants";
import { fetchSubscription } from "~/lib/billing/subscription";
import { getStripe, priceIdForPlan } from "~/lib/stripe";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Start a Stripe Checkout session for a Premium subscription and return its URL
 * for the client to redirect to. Annual is the default (the steered plan).
 *
 * Until Stripe is configured (secret key + price ids), this returns 503 with a
 * "not_configured" code so the UI can show "launching soon" instead of failing.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let plan: PlanId = "annual";
  try {
    const body = (await req.json()) as { plan?: string };
    if (body?.plan === "monthly") plan = "monthly";
  } catch {
    // No/invalid body — fall back to the annual default.
  }

  const stripe = getStripe();
  const priceId = priceIdForPlan(plan);
  if (!stripe || !priceId) {
    return NextResponse.json(
      {
        error: "Premium isn't available just yet — check back soon.",
        code: "not_configured",
      },
      { status: 503 },
    );
  }

  const subscription = await fetchSubscription(supabase, user.id);
  if (subscription.isPremium) {
    return NextResponse.json(
      { error: "You're already on Premium.", code: "already_premium" },
      { status: 400 },
    );
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=1`,
    cancel_url: `${origin}/pricing`,
    client_reference_id: user.id,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
    allow_promotion_codes: true,
  };

  // Reuse the existing Stripe customer if we have one; otherwise seed the email.
  if (subscription.stripeCustomerId) {
    params.customer = subscription.stripeCustomerId;
  } else if (user.email) {
    params.customer_email = user.email;
  }

  try {
    const session = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Please try again." },
      { status: 500 },
    );
  }
}
