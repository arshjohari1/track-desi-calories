"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "~/components/dashboard/icons";
import { cn } from "~/lib/utils";
import { deleteMeal } from "./actions";

/**
 * Trash button for a logged meal. Clicking it asks for confirmation inline
 * (so a stray tap doesn't nuke a meal), then removes it via the server action.
 * On success `revalidatePath` re-renders the list without this row.
 */
export function DeleteMealButton({
  mealId,
  dishName,
}: {
  mealId: string;
  dishName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteMeal(mealId);
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
      }
      // On success the server revalidates /logs and this row disappears.
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${dishName}`}
      title={error ?? `Delete ${dishName}`}
      className={cn(
        // Finger-sized on touch screens, compact again once there's a cursor.
        "flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 sm:size-8 dark:hover:bg-red-950/40",
        error && "text-red-600",
      )}
    >
      <TrashIcon className="size-4" />
    </button>
  );
}
