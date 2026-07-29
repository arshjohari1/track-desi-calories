"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "~/components/dashboard/icons";
import { cn } from "~/lib/utils";
import { deleteKitchenDish } from "./actions";

/**
 * Remove a saved dish, with the same inline confirm as the logs delete button
 * so a stray tap can't wipe one. Meals already logged from the dish stay put.
 */
export function DeleteDishButton({
  dishId,
  name,
}: {
  dishId: string;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteKitchenDish(dishId);
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
      }
      // On success the server revalidates /kitchen and this card disappears.
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
          {pending ? "Removing…" : "Remove"}
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
      aria-label={`Remove ${name} from your Kitchen`}
      title={error ?? `Remove ${name} from your Kitchen`}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40",
        error && "text-red-600",
      )}
    >
      <TrashIcon className="size-4" />
    </button>
  );
}
