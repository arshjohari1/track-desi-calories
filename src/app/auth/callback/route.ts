import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  // Never turn the post-login destination into an external URL.
  let next = "/dashboard";
  try {
    const destination = new URL(requestedNext, origin);
    if (destination.origin === origin && requestedNext.startsWith("/")) {
      next = `${destination.pathname}${destination.search}`;
    }
  } catch {
    // Malformed redirect input must not prevent a valid sign-in.
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("Could not sign in with Google. Please try again.")}`,
  );
}
