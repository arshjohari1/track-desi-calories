"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  type SaveDishInput,
  saveDishToKitchen,
  saveMealToKitchen,
} from "~/app/(dashboard)/kitchen/actions";
import { BookmarkIcon, CheckIcon } from "~/components/dashboard/icons";
import { cn } from "~/lib/utils";

/**
 * "Add to Kitchen" for a dish the user just scanned, or a meal already in their
 * logs. Clicking opens an inline name field (prefilled, editable) because the
 * name is the one thing worth fixing at save time — "Chicken curry" from the AI
 * might be "Amma's chicken curry" to them, and it's the only handle the Kitchen
 * has. There's no rename later, so this is the moment.
 *
 * `variant="icon"` is the compact form for a logs row's action slot; the
 * default is a full-width-ish button for the scan result screen.
 */
type Props = {
  defaultName: string;
  variant?: "button" | "icon";
} & (
  | { dish: Omit<SaveDishInput, "name">; mealId?: never }
  | { mealId: string; dish?: never }
);

export function SaveToKitchenButton({
  defaultName,
  variant = "button",
  dish,
  mealId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(defaultName.slice(0, 200));
  const [error, setError] = useState<string | null>(null);
  // Whether the last failure was the free Kitchen limit, so we can offer upgrade.
  const [limitHit, setLimitHit] = useState(false);
  const [pending, startTransition] = useTransition();

  // Re-seed the field when the caller's name changes. The label flow lets the
  // user correct a misread product name, and without this the save form would
  // keep offering the AI's original guess — which then sticks, since dishes
  // can't be renamed afterwards.
  //
  // Only while the form is closed and unsaved, so it can never overwrite what
  // the user is currently typing. This is React's documented way to adjust
  // state on a prop change; an effect would render once with a stale value.
  const [lastDefault, setLastDefault] = useState(defaultName);
  if (defaultName !== lastDefault && !open && !saved) {
    setLastDefault(defaultName);
    setName(defaultName.slice(0, 200));
  }

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give this dish a name.");
      return;
    }
    setError(null);
    setLimitHit(false);
    startTransition(async () => {
      const result = mealId
        ? await saveMealToKitchen(mealId, trimmed)
        : await saveDishToKitchen({
            ...(dish as SaveDishInput),
            name: trimmed,
          });
      if (result.ok) {
        setSaved(true);
        setOpen(false);
      } else {
        setError(result.error);
        setLimitHit(result.code === "limit");
      }
    });
  };

  if (saved) {
    return (
      <span
        className={cn(
          "flex items-center gap-1.5 text-green-700 dark:text-green-400",
          variant === "icon"
            ? "px-2 text-xs font-medium"
            : "rounded-lg border border-green-600/30 bg-green-600/5 px-4 py-2.5 text-sm font-semibold",
        )}
      >
        <CheckIcon className="size-4" />
        {variant === "icon" ? "Saved" : "Saved to Kitchen"}
      </span>
    );
  }

  if (open) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setOpen(false);
            }}
            maxLength={200}
            placeholder="Name this dish…"
            // biome-ignore lint/a11y/noAutofocus: the field only exists because the user just asked to name a dish
            autoFocus
            className="w-44 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:w-56"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            disabled={pending}
            className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {error}
            {limitHit && (
              <>
                {" "}
                <Link
                  href="/pricing"
                  className="font-semibold text-orange-600 underline underline-offset-2 hover:text-orange-700"
                >
                  See Premium
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Save ${defaultName} to Kitchen`}
        title={error ?? `Save ${defaultName} to Kitchen`}
        className={cn(
          // Finger-sized on touch screens, compact again once there's a cursor.
          "flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-orange-50 hover:text-orange-600 sm:size-8 dark:hover:bg-orange-950/40",
          error && "text-red-600",
        )}
      >
        <BookmarkIcon className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
    >
      <BookmarkIcon className="size-4" />
      Add to Kitchen
    </button>
  );
}
