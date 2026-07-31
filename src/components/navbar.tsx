import Link from "next/link";
import { signout } from "~/app/auth/actions";
import {
  MarketingMenu,
  MarketingSectionLinks,
} from "~/components/marketing-menu";
import { createClient } from "~/lib/supabase/server";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.app_metadata?.role === "admin";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background">
      {/* Flex below `md` so the wordmark can take the width it needs; the
          three-column grid returns at `md`, where it's needed to optically
          centre the section links. A fixed 3-col grid at phone widths gave the
          logo a third of ~320px and pushed the auth buttons off-screen. */}
      <div className="flex h-18 items-center justify-between gap-2 px-4 md:grid md:grid-cols-3 md:px-6 lg:px-16">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-bold tracking-tight sm:gap-2.5"
        >
          <span className="shrink-0 text-xl sm:text-2xl">🍛</span>
          <span className="truncate text-base sm:text-lg lg:text-xl">
            TrackDesiCalories
          </span>
        </Link>

        {/* Nav links — perfectly centered */}
        <div className="hidden items-center justify-center gap-8 md:flex">
          <MarketingSectionLinks />
        </div>

        {/* Right — auth buttons on md+, drawer below */}
        <div className="hidden items-center justify-end gap-4 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Admin
                </Link>
              )}
              <form action={signout}>
                <button
                  type="submit"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <MarketingMenu isSignedIn={Boolean(user)} isAdmin={isAdmin} />
      </div>
    </nav>
  );
}
