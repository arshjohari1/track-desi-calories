"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { signout } from "~/app/auth/actions";
import { cn } from "~/lib/utils";
import { CloseIcon, MenuIcon, ShieldIcon } from "./icons";
import { NAV_ITEMS } from "./nav-items";

/**
 * Drawer navigation for widths below `lg`, where DashboardSidebar is hidden.
 * Without this there is no way to reach Settings (or anything else) on a phone.
 *
 * The overlay is portalled to <body>, and that is load-bearing rather than
 * stylistic. This component renders inside DashboardTopbar, which carries
 * `backdrop-blur`; a non-none `backdrop-filter` makes an element the containing
 * block for its fixed-position descendants. Rendered in place, the drawer's
 * `inset-y-0` therefore resolved against the 72px topbar instead of the
 * viewport: the panel became 71px tall, the nav collapsed to 24px with ~260px of
 * links hidden inside its own overflow, the footer spilled onto the page, and
 * the backdrop dimmed only the header strip. The portal moves it out of that
 * containing block while leaving the blur intact.
 *
 * The drawer is conditionally rendered and animates via a CSS keyframe rather
 * than a transition driven from JS state — nothing about opening or closing
 * depends on an animation frame actually running, so it still works in a
 * background tab.
 */
export function DashboardMobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Close on navigation — otherwise tapping a link leaves the drawer covering
  // the page it just opened. `pathname` is the trigger rather than something the
  // effect reads, which is exactly what the exhaustive-deps rule flags.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the intended trigger, not a read dependency
  useEffect(() => setOpen(false), [pathname]);

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

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
      pathname === href
        ? "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls={panelId}
        className="-ml-1 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
      >
        <MenuIcon className="size-6" />
      </button>

      {open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="animate-fade-in fixed inset-0 z-50 bg-black/40 lg:hidden dark:bg-black/60"
            />

            <div
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="animate-slide-in-left fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col border-r border-border bg-card lg:hidden"
            >
              <div className="flex h-18 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
                <Link
                  href="/"
                  className="flex min-w-0 items-center gap-2 font-bold tracking-tight"
                >
                  <span className="text-xl">🍛</span>
                  <span className="truncate text-base">TrackDesiCalories</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation menu"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <CloseIcon className="size-5" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={linkClass(item.href)}
                    >
                      <Icon
                        className={cn(
                          "size-5 shrink-0",
                          active ? "text-orange-600 dark:text-orange-400" : "",
                        )}
                      />
                      {item.label}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <>
                    <span className="my-2 border-t border-border" />
                    <Link href="/admin" className={linkClass("/admin")}>
                      <ShieldIcon
                        className={cn(
                          "size-5 shrink-0",
                          pathname === "/admin"
                            ? "text-orange-600 dark:text-orange-400"
                            : "",
                        )}
                      />
                      Admin
                    </Link>
                  </>
                )}
              </nav>

              {/* Sign out lives here on mobile — the topbar drops it for space. */}
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
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
