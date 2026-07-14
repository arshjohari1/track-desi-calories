import { NextResponse } from "next/server";
import { describeAiError } from "~/lib/ai/errors";
import { analyzeFoodImage } from "~/lib/ai/food";
import { analyzeRequestSchema } from "~/lib/ai/scan-request";
import { createClient } from "~/lib/supabase/server";

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

  try {
    const analysis = await analyzeFoodImage(parsed.data.image);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[scan/analyze]", err);
    const { status, message } = describeAiError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
