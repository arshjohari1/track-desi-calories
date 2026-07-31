import { NextResponse } from "next/server";
import { describeAiError } from "~/lib/ai/errors";
import { estimateMacros } from "~/lib/ai/food";
import { estimateRequestSchema } from "~/lib/ai/scan-request";
import { createClient } from "~/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Step 2: combine the photo + the user's answers into final macros. */
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

  const parsed = estimateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const macros = await estimateMacros(
      parsed.data.image,
      parsed.data.analysis,
      parsed.data.answers,
    );
    return NextResponse.json({ macros });
  } catch (err) {
    console.error("[scan/estimate]", err);
    const { status, message, reason } = describeAiError(err);
    console.error("[scan/estimate] reason:", reason);
    return NextResponse.json({ error: message }, { status });
  }
}
