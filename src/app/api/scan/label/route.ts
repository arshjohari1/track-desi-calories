import { NextResponse } from "next/server";
import { describeAiError } from "~/lib/ai/errors";
import { readNutritionLabel } from "~/lib/ai/food";
import { labelRequestSchema } from "~/lib/ai/scan-request";
import { gateScan, recordScan, refundScan } from "~/lib/billing/scan-metering";
import { createClient } from "~/lib/supabase/server";
import { getUserTimeZone } from "~/lib/timezone";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Read a packaged food's nutrition label into per-serving macros. */
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

  const parsed = labelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  // Meter the free tier before the AI call. A label scan is a single call and
  // counts once.
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

  const eventId = await recordScan(supabase, user.id, "label");

  try {
    const label = await readNutritionLabel(parsed.data.image);
    return NextResponse.json({ label });
  } catch (err) {
    if (eventId) await refundScan(eventId);
    console.error("[scan/label]", err);
    const { status, message, reason } = describeAiError(err);
    console.error("[scan/label] reason:", reason);
    return NextResponse.json({ error: message }, { status });
  }
}
