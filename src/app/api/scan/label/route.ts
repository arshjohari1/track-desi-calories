import { NextResponse } from "next/server";
import { describeAiError } from "~/lib/ai/errors";
import { readNutritionLabel } from "~/lib/ai/food";
import { labelRequestSchema } from "~/lib/ai/scan-request";
import { createClient } from "~/lib/supabase/server";

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

  try {
    const label = await readNutritionLabel(parsed.data.image);
    return NextResponse.json({ label });
  } catch (err) {
    console.error("[scan/label]", err);
    const { status, message, reason } = describeAiError(err);
    console.error("[scan/label] reason:", reason);
    return NextResponse.json({ error: message }, { status });
  }
}
