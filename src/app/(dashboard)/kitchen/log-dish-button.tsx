"use client";

import { useState, useTransition } from "react";
import { CheckIcon, PlusIcon } from "~/components/dashboard/icons";
import { cn } from "~/lib/utils";
import { logKitchenDish } from "./actions";

/**
 * One-tap re-log for a saved dish. The label spells out the portion being
 * recorded ("Log · 1 medium bowl") rather than just "Log", because a saved dish
 * is a snapshot of one scan — if today's serving is nowhere near that, the user
 * should see it and scan instead.
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
          size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
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
          size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
        )}
      >
        <PlusIcon className={size === "sm" ? "size-3.5" : "size-4"} />
        <span className="truncate">
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
