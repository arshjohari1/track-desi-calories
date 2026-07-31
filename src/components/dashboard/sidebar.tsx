"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import { ShieldIcon } from "./icons";
import { NAV_ITEMS } from "./nav-items";

/**
 * `isAdmin` comes from the layout, which already resolves the user server-side.
 * It only decides whether the link is *shown* — /admin re-checks the role on the
 * server and redirects, so hiding this is convenience, not the access control.
 *
 * Hidden below `lg`, where DashboardMobileNav takes over with the same items.
 */
export function DashboardSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <Link
        href="/"
        className="flex h-18 items-center gap-2.5 border-b border-border px-6 font-bold tracking-tight"
      >
        <span className="text-2xl">🍛</span>
        <span className="text-lg">TrackDesiCalories</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5",
                  active ? "text-orange-600 dark:text-orange-400" : "",
                )}
              />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            {/* Kept below a divider: it's an operator tool, not part of the
                everyday app nav. */}
            <span className="my-2 border-t border-border" />
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === "/admin"
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <ShieldIcon
                className={cn(
                  "size-5",
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

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">
          Accurate for South Asian home-cooked meals.
        </p>
      </div>
    </aside>
  );
}
