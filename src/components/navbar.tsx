import Link from "next/link";
import { signout } from "~/app/auth/actions";
import { createClient } from "~/lib/supabase/server";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="grid h-18 grid-cols-3 items-center px-6 lg:px-16">
        {/* Logo — hard left */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold tracking-tight"
        >
          <span className="text-2xl">🍛</span>
          <span className="text-xl">TrackDesiCalories</span>
        </Link>

        {/* Nav links — perfectly centered */}
        <div className="hidden md:flex items-center justify-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground decoration-orange-600 underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            How it Works
          </a>
          <a
            href="#features"
            className="text-sm text-muted-foreground decoration-orange-600 underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Features
          </a>
        </div>

        {/* Right — auth buttons */}
        <div className="flex items-center justify-end gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Dashboard
              </Link>
              {user.app_metadata?.role === "admin" && (
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
      </div>
    </nav>
  );
}
