"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { signout } from "~/app/auth/actions";
import { CloseIcon, MenuIcon } from "~/components/dashboard/icons";

/**
 * The #how-it-works / #features anchors only exist on the landing page — on
 * /login and /signup they'd scroll nowhere. The marketing layout renders one
 * Navbar for all three routes and server components can't read the pathname, so
 * the check lives here on the client instead of being threaded through as a prop.
 */
function useOnLandingPage() {
  return usePathname() === "/";
}

/** Section anchors for the desktop navbar. */
export function MarketingSectionLinks() {
  if (!useOnLandingPage()) return null;

  return (
    <>
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
    </>
  );
}

/**
 * Mobile menu for the marketing navbar, shown below `md`.
 *
 * It carries the section anchors — previously `hidden md:flex`, so unreachable
 * on a phone — plus the auth actions, which don't fit alongside the wordmark at
 * narrow widths.
 *
 * `isSignedIn` / `isAdmin` are resolved by the server component that renders
 * this, so the menu never has to fetch anything itself.
 */
export function MarketingMenu({
  isSignedIn,
  isAdmin,
}: {
  isSignedIn: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const showSectionLinks = useOnLandingPage();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const itemClass =
    "flex items-center rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={panelId}
        className="-mr-1 flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MenuIcon className="size-6" />
      </button>

      {/* Portalled to <body> for the same reason as the dashboard drawer: a
          `backdrop-filter` (or transform/filter) anywhere up the tree would make
          that ancestor the containing block for these fixed elements and collapse
          the panel to the navbar's height. The marketing navbar has no blur today,
          but the overlay shouldn't depend on that staying true. */}
      {open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="animate-fade-in fixed inset-0 z-50 bg-black/40 dark:bg-black/60"
            />

            <div
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="animate-slide-in-right fixed inset-y-0 right-0 z-50 flex w-[17rem] max-w-[85vw] flex-col border-l border-border bg-card"
            >
              <div className="flex h-18 shrink-0 items-center justify-end border-b border-border px-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <CloseIcon className="size-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {showSectionLinks && (
                  <>
                    {/* Genuine fragment links — they scroll to a real section and
                      work with JS off. The handler only dismisses the overlay
                      that would otherwise cover the section being jumped to, so
                      an anchor is the correct element here, not a button. */}
                    {/* biome-ignore lint/a11y/useValidAnchor: real #fragment target; onClick only closes the drawer */}
                    <a
                      href="#how-it-works"
                      onClick={() => setOpen(false)}
                      className={itemClass}
                    >
                      How it Works
                    </a>
                    {/* biome-ignore lint/a11y/useValidAnchor: real #fragment target; onClick only closes the drawer */}
                    <a
                      href="#features"
                      onClick={() => setOpen(false)}
                      className={itemClass}
                    >
                      Features
                    </a>
                    <span className="my-2 border-t border-border" />
                  </>
                )}

                {isSignedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className={itemClass}
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className={itemClass}
                      >
                        Admin
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className={itemClass}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="mt-1 flex items-center justify-center rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </nav>

              {isSignedIn && (
                <div className="shrink-0 border-t border-border p-3">
                  <form action={signout}>
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
