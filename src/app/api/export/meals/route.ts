import { NextResponse } from "next/server";
import { fetchSubscription } from "~/lib/billing/subscription";
import { toDateParam } from "~/lib/date";
import { fetchMeals } from "~/lib/meals";
import { createClient } from "~/lib/supabase/server";
import { getUserTimeZone } from "~/lib/timezone";

export const runtime = "nodejs";

/** Quote a CSV cell only when it contains a comma, quote, or newline. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Export the signed-in user's meal history as CSV. Premium-only — it's part of
 * the paid analytics/history tier.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await fetchSubscription(supabase, user.id);
  if (!subscription.isPremium) {
    return NextResponse.json(
      { error: "Data export is a Premium feature." },
      { status: 403 },
    );
  }

  const timeZone = await getUserTimeZone();
  const meals = await fetchMeals(supabase, user.id, { limit: 10000 });

  const header = [
    "eaten_at",
    "dish_name",
    "serving",
    "cuisine",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "confidence",
  ];

  const lines = [header.map(csvCell).join(",")];
  for (const m of meals) {
    lines.push(
      [
        m.eatenAt,
        m.dishName,
        m.servingSummary ?? "",
        m.cuisine ?? "",
        Math.round(m.calories),
        m.protein,
        m.carbs,
        m.fat,
        m.fiber,
        m.sugar,
        m.confidence ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  const csv = lines.join("\r\n");
  const today = toDateParam(new Date(), timeZone);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trackdesi-meals-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
