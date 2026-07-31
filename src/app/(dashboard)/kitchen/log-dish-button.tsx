"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckIcon, PlusIcon } from "~/components/dashboard/icons";
import { cn } from "~/lib/utils";
import { logKitchenDish } from "./actions";

/** How long the green "Logged" confirmation stays before the button returns. */
const CONFIRMATION_MS = 2000;

/**
 * One-tap re-log for a saved dish. The label spells out the portion being
 * recorded ("Log · 1 medium bowl") rather than just "Log", because a saved dish
 * is a snapshot of one scan — if today's serving is nowhere near that, the user
 * should see it and scan instead.
 *
 * The confirmation is transient. It used to latch on forever, so logging the same
 * dish twice — two rotis, a second bowl — meant reloading the page to get the
 * button back. Kitchen dishes are the ones people repeat most, so the control has
 * to come back on its own.
 */
export function LogDishButton({
  dishId,
  servingSummary,
  size = "default",
}: {
  dishId: string;
  servingSummary: string | null;
  size?: "default" | "sm";
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Revert to the button after the confirmation has been on screen long enough
  // to read. Cleanup covers unmount and a re-log landing mid-timer.
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), CONFIRMATION_MS);
    return () => clearTimeout(id);
  }, [done]);

  const handleLog = () => {
    setError(null);
    startTransition(async () => {
      const result = await logKitchenDish(dishId);
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  };

  if (done) {
    return (
      <span
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg border border-green-600/30 bg-green-600/5 font-semibold text-green-700 dark:text-green-400",
          // The `sm` variant still needs a finger-sized target on touch
          // screens, so it keeps its compact text but gets a min height.
          size === "sm"
            ? "min-h-9 px-2.5 py-1.5 text-xs sm:min-h-0"
            : "min-h-11 px-4 py-2.5 text-sm sm:min-h-0",
        )}
      >
        <CheckIcon className={size === "sm" ? "size-3.5" : "size-4"} />
        Logged
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleLog}
        disabled={pending}
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60",
          // The `sm` variant still needs a finger-sized target on touch
          // screens, so it keeps its compact text but gets a min height.
          // `w-full` on the default size matters: the label can be a long
          // serving summary, and a content-sized button grew the Kitchen card to
          // 513px and pushed the whole page into horizontal scroll at 320px.
          size === "sm"
            ? "min-h-10 px-2.5 py-1.5 text-xs sm:min-h-0"
            : "min-h-11 w-full px-4 py-2.5 text-sm sm:min-h-0",
        )}
      >
        <PlusIcon
          className={cn("shrink-0", size === "sm" ? "size-3.5" : "size-4")}
        />
        {/* min-w-0 lets the flex item shrink so `truncate` can actually
            ellipsize instead of forcing the button wider. */}
        <span className="min-w-0 truncate">
          {pending
            ? "Logging…"
            : servingSummary
              ? `Log · ${servingSummary}`
              : "Log this dish"}
        </span>
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
