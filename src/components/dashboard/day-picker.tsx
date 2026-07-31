"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatDayLabel, parseDateParam } from "~/lib/date";
import type { MealDaySummary } from "~/lib/meals";
import { cn } from "~/lib/utils";
import { CalendarIcon, ChevronDownIcon } from "./icons";

/**
 * Topbar day switcher. Lists the days the user has logged meals; picking one
 * scopes the dashboard to that day via `?date=YYYY-MM-DD`. The button label
 * reflects the day currently shown (only the dashboard is date-scoped, so it
 * reads "Today" everywhere else).
 */
export function DayPicker({
  days,
  timeZone,
}: {
  days: MealDaySummary[];
  timeZone: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDashboard = pathname === "/dashboard";
  const dateParam = onDashboard ? searchParams.get("date") : null;
  const selected = parseDateParam(dateParam, timeZone);
  const activeParam = selected ? dateParam : null;
  const label = selected ? formatDayLabel(selected, timeZone) : "Today";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Always offer "Today", even on days with nothing logged yet, so the user can
  // get back to the current day from any past selection.
  const hasToday = days.some((d) => d.label === "Today");
  const items: MealDaySummary[] = hasToday
    ? days
    : [{ date: "", label: "Today", count: 0, total: 0 }, ...days];

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted sm:h-10"
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{label}</span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 max-h-80 w-[min(16rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-lg">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
            Jump to a day
          </p>
          {items.map((day) => {
            const isTodayItem = day.label === "Today";
            const href = isTodayItem
              ? "/dashboard"
              : `/dashboard?date=${day.date}`;
            const active = isTodayItem
              ? !activeParam
              : activeParam === day.date;
            return (
              <Link
                key={day.date || "today"}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                  active && "bg-muted",
                )}
              >
                <span className="font-medium">{day.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {day.count > 0
                    ? `${day.count} ${day.count === 1 ? "meal" : "meals"} · ${day.total.toLocaleString()} kcal`
                    : "No meals yet"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
