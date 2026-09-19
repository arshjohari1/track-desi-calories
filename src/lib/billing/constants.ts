/**
 * Freemium plan constants — the single source of truth for every limit the app
 * enforces and every number the pricing page shows. Kept free of "server-only"
 * so client components (pricing page, paywall cards) can render the same values
 * the server gates on.
 *
 * The economics behind these numbers live in the billing spec: 1.3¢/scan, a
 * 2-scan/day free tier funded at ~5% conversion, $70/yr as the steered plan.
 */

/** AI scans (photo or label) a free user gets per day, reset at their local midnight. */
export const FREE_DAILY_SCANS = 2;

/** Saved Kitchen dishes a free user may keep. Premium is unlimited. */
export const FREE_KITCHEN_DISHES = 3;

/** How far back a free user's history (logs, day-picker) reaches. */
export const FREE_HISTORY_DAYS = 14;

/**
 * Premium fair-use backstop over a rolling 30 days. This never hard-blocks a
 * paying user — it only flags a runaway/abusive account for review, set well
 * above any real usage (~10/day).
 */
export const PREMIUM_FAIR_USE_SCANS_PER_MONTH = 300;

export type PlanId = "monthly" | "annual";

/** Display metadata for the two paid billing periods. */
export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    price: number;
    priceLabel: string;
    period: string;
    blurb: string;
  }
> = {
  monthly: {
    id: "monthly",
    price: 10,
    priceLabel: "$10",
    period: "/month",
    blurb: "Billed monthly. Cancel anytime.",
  },
  annual: {
    id: "annual",
    price: 70,
    priceLabel: "$70",
    period: "/year",
    blurb: "Billed yearly — works out to under $6/month.",
  },
};
