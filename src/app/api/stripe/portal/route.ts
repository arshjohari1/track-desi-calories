import { NextResponse } from "next/server";
import { fetchSubscription } from "~/lib/billing/subscription";
import { getStripe } from "~/lib/stripe";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Open the Stripe Billing Portal so a premium user can update their card, switch
 * plans, or cancel. Returns the portal URL for the client to redirect to.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Billing isn't available just yet.", code: "not_configured" },
      { status: 503 },
    );
  }

  const subscription = await fetchSubscription(supabase, user.id);
  if (!subscription.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found for this user." },
      { status: 400 },
    );
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${origin}/settings`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json(
      { error: "Couldn't open the billing portal. Please try again." },
      { status: 500 },
    );
  }
}
