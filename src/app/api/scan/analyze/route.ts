import { NextResponse } from "next/server";
import { describeAiError } from "~/lib/ai/errors";
import { analyzeFoodImage } from "~/lib/ai/food";
import { analyzeRequestSchema } from "~/lib/ai/scan-request";
import { gateScan, recordScan, refundScan } from "~/lib/billing/scan-metering";
import { createClient } from "~/lib/supabase/server";
import { getUserTimeZone } from "~/lib/timezone";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Step 1: identify the dish and return follow-up questions. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  // Meter the free tier before the expensive AI call. A photo scan is metered
  // here at analyze — the estimate follow-up in this same scan is never counted
  // again.
  const timeZone = await getUserTimeZone();
  const gate = await gateScan(supabase, user.id, timeZone);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        error: `You've used your ${gate.limit} free scans for today. They reset at midnight — or go Premium for unlimited scans.`,
        code: "scan_limit",
        used: gate.usedToday,
        limit: gate.limit,
      },
      { status: 402 },
    );
  }

  // Record the scan now (analyze-start) so two requests can't both slip past the
  // check; refunded below if the AI call itself fails.
  const eventId = await recordScan(supabase, user.id, "meal");

  try {
    const analysis = await analyzeFoodImage(parsed.data.image);
    return NextResponse.json({ analysis });
  } catch (err) {
    if (eventId) await refundScan(eventId);
    console.error("[scan/analyze]", err);
    const { status, message, reason } = describeAiError(err);
    console.error("[scan/analyze] reason:", reason);
    return NextResponse.json({ error: message }, { status });
  }
}
