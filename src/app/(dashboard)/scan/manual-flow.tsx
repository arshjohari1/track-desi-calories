"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, LogsIcon, PlusIcon } from "~/components/dashboard/icons";
import { logMeal } from "./actions";

type LogState = "idle" | "saving" | "saved";

const MACRO_KEYS = ["protein", "carbs", "fat", "fiber", "sugar"] as const;
type MacroKey = (typeof MACRO_KEYS)[number];

const MACRO_LABELS: Record<MacroKey, string> = {
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
  fiber: "Fiber",
  sugar: "Sugar",
};

type Fields = Record<MacroKey, string>;

const EMPTY_FIELDS: Fields = {
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sugar: "",
};

/** Parse a user-entered numeric string; never negative, never NaN. */
function toNum(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Block "e"/sign keys that <input type="number"> otherwise accepts. */
function blockNonNumericKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
}

function limitDecimals(value: string, places = 2): string {
  const dot = value.indexOf(".");
  if (dot === -1) return value;
  return value.slice(0, dot + 1 + places);
}

/**
 * Manual meal entry: type a food and its macros, no photo and no AI. This is one
 * of the two zero-cost logging paths (the other is re-logging from the Kitchen),
 * so it never touches the daily scan limit — it makes no AI call.
 */
export function ManualFlow() {
  const [name, setName] = useState("");
  const [servingSummary, setServingSummary] = useState("");
  const [calories, setCalories] = useState("");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [logState, setLogState] = useState<LogState>("idle");
  const [error, setError] = useState<string | null>(null);

  const caloriesNum = toNum(calories);
  const canLog =
    name.trim().length > 0 && caloriesNum > 0 && logState !== "saving";

  const reset = () => {
    setName("");
    setServingSummary("");
    setCalories("");
    setFields(EMPTY_FIELDS);
    setLogState("idle");
    setError(null);
  };

  const handleLog = async () => {
    if (!canLog) return;
    setError(null);
    setLogState("saving");
    const result = await logMeal({
      image: null,
      dishName: name.trim().slice(0, 200),
      servingSummary: servingSummary.trim() || null,
      cuisine: null,
      isSouthAsian: false,
      calories: caloriesNum,
      protein: toNum(fields.protein),
      carbs: toNum(fields.carbs),
      fat: toNum(fields.fat),
      fiber: toNum(fields.fiber),
      sugar: toNum(fields.sugar),
      // The user typed these numbers themselves — no estimation uncertainty.
      confidence: "high",
      assumptions: [],
      tip: null,
    });
    if (result.ok) {
      setLogState("saved");
    } else {
      setLogState("idle");
      setError(result.error);
    }
  };

  if (logState === "saved") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-green-600/30 bg-green-600/5 p-5">
        <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
          <CheckIcon className="size-5" />
          Logged to your day
        </div>
        <p className="text-sm text-muted-foreground">
          {Math.round(caloriesNum).toLocaleString()} kcal added to today&apos;s
          total. It&apos;s in your recent meals and logs now.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/dashboard"
            className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            View dashboard
          </Link>
          <Link
            href="/logs"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <LogsIcon className="size-4" />
            Open logs
          </Link>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <PlusIcon className="size-4" />
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="manual-name"
            className="text-xs font-medium text-muted-foreground"
          >
            Food name
          </label>
          <input
            id="manual-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            placeholder="e.g. Handful of almonds"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="manual-serving"
            className="text-xs font-medium text-muted-foreground"
          >
            Portion <span className="text-muted-foreground/70">(optional)</span>
          </label>
          <input
            id="manual-serving"
            type="text"
            value={servingSummary}
            onChange={(e) => setServingSummary(e.target.value)}
            maxLength={200}
            placeholder="e.g. 1 small bowl, 30 g"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="manual-calories"
            className="text-xs font-medium text-muted-foreground"
          >
            Calories
          </label>
          <div className="relative w-40">
            <input
              id="manual-calories"
              type="number"
              min={0}
              inputMode="decimal"
              value={calories}
              onKeyDown={blockNonNumericKeys}
              onChange={(e) => setCalories(limitDecimals(e.target.value))}
              placeholder="0"
              className="w-full rounded-lg border border-input bg-background py-2 pl-3 pr-12 text-sm tabular-nums placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
              kcal
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">
            Macros{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {MACRO_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <label
                  htmlFor={`manual-${key}`}
                  className="text-xs text-muted-foreground"
                >
                  {MACRO_LABELS[key]}
                </label>
                <div className="relative">
                  <input
                    id={`manual-${key}`}
                    type="number"
                    min={0}
                    inputMode="decimal"
                    value={fields[key]}
                    onKeyDown={blockNonNumericKeys}
                    onChange={(e) =>
                      setFields((prev) => ({
                        ...prev,
                        [key]: limitDecimals(e.target.value),
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-input bg-background py-2 pl-2.5 pr-7 text-sm tabular-nums placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                    g
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleLog}
          disabled={!canLog}
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {logState === "saving" ? (
            <>
              <span
                className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              Logging…
            </>
          ) : (
            <>
              <PlusIcon className="size-4" />
              Log this meal
            </>
          )}
        </button>
        {!canLog && logState !== "saving" && (
          <span className="text-xs text-muted-foreground">
            Add a name and calories to log.
          </span>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Manual entry is always free — it doesn&apos;t use an AI scan.
      </p>
    </div>
  );
}
