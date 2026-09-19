import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "~/env";
import type { PlanId } from "~/lib/billing/constants";
import {
  getStripe,
  isActiveStatus,
  planFromSubscription,
  subscriptionPeriodEnd,
} from "~/lib/stripe";
import { createAdminClient } from "~/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Stripe webhook: the only writer of the profiles billing columns. It runs as
 * the service_role (bypassing RLS and the billing-column guard trigger), so it
 * is the single trusted path that flips is_premium.
 *
 * The raw request body is required for signature verification — read it with
 * req.text(), never req.json().
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured." },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId =
          session.client_reference_id ?? session.metadata?.userId ?? null;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer?.id ?? null);
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription?.id ?? null);

        let status = "active";
        let periodEnd: string | null = null;
        let plan: PlanId | null =
          (session.metadata?.plan as PlanId | undefined) ?? null;

        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          status = subscription.status;
          periodEnd = subscriptionPeriodEnd(subscription);
          plan = plan ?? planFromSubscription(subscription);
        }

        if (userId) {
          const { error } = await admin
            .from("profiles")
            .update({
              is_premium: isActiveStatus(status),
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: status,
              current_period_end: periodEnd,
              plan,
            })
            .eq("id", userId);
          if (error) console.error("[stripe/webhook] profile update", error);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        const status = subscription.status;
        const active =
          event.type === "customer.subscription.deleted"
            ? false
            : isActiveStatus(status);

        const { error } = await admin
          .from("profiles")
          .update({
            is_premium: active,
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            current_period_end: subscriptionPeriodEnd(subscription),
            plan: planFromSubscription(subscription),
          })
          .eq("stripe_customer_id", customerId);
        if (error) console.error("[stripe/webhook] profile update", error);
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error", err);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
