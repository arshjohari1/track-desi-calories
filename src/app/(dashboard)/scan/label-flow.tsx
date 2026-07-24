"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  CheckIcon,
  LabelIcon,
  LogsIcon,
  PlusIcon,
  UploadIcon,
} from "~/components/dashboard/icons";
import {
  type AmountInput,
  type AmountMode,
  computeFactor,
  deriveWholePack,
  formatAmountEaten,
  type LabelReading,
  type PerServingMacros,
  scaleMacros,
} from "~/lib/label";
import { fileToCompressedDataUrl, postJson } from "~/lib/scan-client";
import { cn } from "~/lib/utils";
import { logMeal } from "./actions";

type Step = "upload" | "reading" | "result";
type LogState = "idle" | "saving" | "saved";

const CONFIDENCE_STYLES: Record<LabelReading["confidence"], string> = {
  high: "bg-green-600/10 text-green-700 dark:text-green-400",
  medium: "bg-orange-600/10 text-orange-700 dark:text-orange-400",
  low: "bg-red-600/10 text-red-700 dark:text-red-400",
};

const MACRO_KEYS = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
] as const;
type MacroKey = (typeof MACRO_KEYS)[number];

const MACRO_META: Record<MacroKey, { label: string; unit: string }> = {
  calories: { label: "Calories", unit: "kcal" },
  protein: { label: "Protein", unit: "g" },
  carbs: { label: "Carbs", unit: "g" },
  fat: { label: "Fat", unit: "g" },
  fiber: { label: "Fiber", unit: "g" },
  sugar: { label: "Sugar", unit: "g" },
};

type Fields = Record<MacroKey, string>;

const EMPTY_FIELDS: Fields = {
  calories: "",
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

/**
 * `<input type="number">` still lets you type "e" (scientific notation) and
 * the sign keys, which look like accepted letters. Block them so the field
 * only takes digits and a decimal point.
 */
function blockNonNumericKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
}

/** Trim a numeric string to at most `places` digits after the decimal point. */
function limitDecimals(value: string, places = 2): string {
  const dot = value.indexOf(".");
  if (dot === -1) return value;
  return value.slice(0, dot + 1 + places);
}

export function LabelFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [reading, setReading] = useState<LabelReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Editable per-serving values (strings so the fields can be cleared/typed).
  const [productName, setProductName] = useState("");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);

  // How much the user ate.
  const [amountMode, setAmountMode] = useState<AmountMode>("servings");
  const [servingsStr, setServingsStr] = useState("1");
  const [gramsStr, setGramsStr] = useState("");
  // Set when the label doesn't tell us the pack size but the user asked to log
  // the whole thing, so we prompt them for the total.
  const [needTotal, setNeedTotal] = useState(false);
  // Set when the user picked "Custom" so the amount box reads as free entry.
  const [customActive, setCustomActive] = useState(false);

  const [logState, setLogState] = useState<LogState>("idle");
  const [logError, setLogError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("upload");
    setImageUrl(null);
    setReading(null);
    setError(null);
    setProductName("");
    setFields(EMPTY_FIELDS);
    setAmountMode("servings");
    setServingsStr("1");
    setGramsStr("");
    setNeedTotal(false);
    setCustomActive(false);
    setLogState("idle");
    setLogError(null);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setReading(null);

    let dataUrl: string;
    try {
      // Labels need finer detail than plates so the small print stays legible.
      dataUrl = await fileToCompressedDataUrl(file, 1600, 0.9);
    } catch {
      setError("Couldn't read that photo. Try a different one.");
      return;
    }
    setImageUrl(dataUrl);
    setStep("reading");

    try {
      const { label } = await postJson<{ label: LabelReading }>(
        "/api/scan/label",
        { image: dataUrl },
      );
      setReading(label);
      // Pre-fill the AI's best-effort name (specific or descriptive). The field
      // stays editable, so the user can refine it if they care.
      setProductName(label.productName.trim());
      setNeedTotal(false);
      setCustomActive(false);
      setFields({
        calories: String(label.perServing.calories),
        protein: String(label.perServing.protein),
        carbs: String(label.perServing.carbs),
        fat: String(label.perServing.fat),
        fiber: String(label.perServing.fiber),
        sugar: String(label.perServing.sugar),
      });
      setServingsStr("1");
      setGramsStr(
        label.servingSizeGrams != null ? String(label.servingSizeGrams) : "",
      );
      setAmountMode("servings");
      setStep("result");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't read that label.",
      );
      setStep("upload");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const servingSizeGrams = reading?.servingSizeGrams ?? null;
  const perServing: PerServingMacros = {
    calories: toNum(fields.calories),
    protein: toNum(fields.protein),
    carbs: toNum(fields.carbs),
    fat: toNum(fields.fat),
    fiber: toNum(fields.fiber),
    sugar: toNum(fields.sugar),
  };
  const amount: AmountInput = {
    mode: amountMode,
    servings: toNum(servingsStr),
    grams: toNum(gramsStr),
    servingSizeGrams,
  };
  const factor = computeFactor(amount);
  const scaled = scaleMacros(perServing, factor);

  // "Whole pack" amount derived from the label, or null when the label doesn't
  // say how big the pack is (then we ask the user for the total).
  const wholePack = reading
    ? deriveWholePack({
        servingsPerContainer: reading.servingsPerContainer,
        netWeightGrams: reading.netWeightGrams,
        servingSizeGrams,
      })
    : null;
  const wholePackLabel = wholePack
    ? wholePack.mode === "servings"
      ? `Whole pack (${wholePack.servings})`
      : `Whole pack (${wholePack.grams} g)`
    : "The whole thing";
  const wholePackActive = wholePack
    ? wholePack.mode === "servings"
      ? amountMode === "servings" && servingsStr === String(wholePack.servings)
      : amountMode === "grams" && gramsStr === String(wholePack.grams)
    : needTotal;

  const applyWholePack = () => {
    setCustomActive(false);
    if (wholePack) {
      setAmountMode(wholePack.mode);
      if (wholePack.mode === "servings") {
        setServingsStr(String(wholePack.servings));
      } else {
        setGramsStr(String(wholePack.grams));
      }
      setNeedTotal(false);
      return;
    }
    // The label didn't give us a pack size — switch to the most natural unit
    // and ask the user to type the total for the whole thing.
    if (servingSizeGrams != null) {
      setAmountMode("grams");
      setGramsStr("");
    } else {
      setAmountMode("servings");
      setServingsStr("");
    }
    setNeedTotal(true);
  };

  // "Custom" clears the amount box and highlights it so it's obvious the user
  // can type any value, not only the suggested chips.
  const startCustom = () => {
    if (amountMode === "grams") {
      setGramsStr("");
    } else {
      setServingsStr("");
    }
    setNeedTotal(false);
    setCustomActive(true);
    amountInputRef.current?.focus();
  };

  const handleLog = async () => {
    setLogError(null);
    setLogState("saving");
    const result = await logMeal({
      image: imageUrl,
      dishName: (productName.trim() || "Packaged food").slice(0, 200),
      servingSummary: formatAmountEaten(amount),
      cuisine: null,
      isSouthAsian: false,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      fiber: scaled.fiber,
      sugar: scaled.sugar,
      confidence: reading?.isLabel ? reading.confidence : "low",
      assumptions: [
        ...(reading?.notes ?? []),
        `Logged ${formatAmountEaten(amount)} from label values (${
          reading?.servingSizeText ?? "1 serving"
        }).`,
      ].slice(0, 20),
      tip: null,
    });
    if (result.ok) {
      setLogState("saved");
    } else {
      setLogState("idle");
      setLogError(result.error);
    }
  };

  const servingChips = ["0.5", "1", "2"];

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onInputChange}
        className="hidden"
      />

      {step === "upload" && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-card px-6 py-16 text-center transition-colors",
            dragActive
              ? "border-orange-600 bg-orange-600/5"
              : "border-border hover:border-orange-600/60 hover:bg-muted/40",
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-orange-600/10 text-orange-600">
            <LabelIcon className="size-7" />
          </span>
          <div>
            <p className="font-semibold">Snap the nutrition label</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Point at the nutrition facts panel on the package. We read the
              macros straight off it — then you tell us how much you ate.
            </p>
          </div>
          <span className="mt-1 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700">
            <UploadIcon className="size-4" />
            Upload Label
          </span>
          <p className="text-xs text-muted-foreground">
            or drag &amp; drop · JPG, PNG, or WebP
          </p>
        </button>
      )}

      {step === "reading" && (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-card px-6 py-16 text-center">
          {imageUrl && (
            // biome-ignore lint/performance/noImgElement: transient local data URL, not a remote asset
            <img
              src={imageUrl}
              alt="Nutrition label"
              className="size-28 rounded-xl object-cover shadow-sm"
            />
          )}
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="text-sm font-medium">Reading the label…</p>
          </div>
          <p className="max-w-xs text-xs text-muted-foreground">
            Pulling calories and macros off the nutrition facts panel.
          </p>
        </div>
      )}

      {step === "result" && reading && (
        <div className="flex flex-col gap-4">
          {!reading.isLabel && (
            <p className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-400">
              That didn&apos;t look like a nutrition label. Double-check the
              numbers below (or type them in yourself) before logging.
            </p>
          )}

          {/* Product + editable per-serving values */}
          <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 text-center">
              {imageUrl && (
                // biome-ignore lint/performance/noImgElement: transient local data URL, not a remote asset
                <img
                  src={imageUrl}
                  alt="Nutrition label"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              )}
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                  CONFIDENCE_STYLES[reading.confidence],
                )}
              >
                {reading.confidence} confidence
              </span>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="label-product"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Food name
                </label>
                <input
                  id="label-product"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Oreo Original biscuits"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <p className="text-sm font-semibold">Nutrition per serving</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  One serving = {reading.servingSizeText}. Tap any value to fix
                  a misread.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {MACRO_KEYS.map((key) => (
                    <div key={key} className="flex flex-col gap-1">
                      <label
                        htmlFor={`label-${key}`}
                        className="text-xs text-muted-foreground"
                      >
                        {MACRO_META[key].label}
                      </label>
                      <div className="relative">
                        <input
                          id={`label-${key}`}
                          type="number"
                          min={0}
                          inputMode="decimal"
                          value={fields[key]}
                          onKeyDown={blockNonNumericKeys}
                          onChange={(e) =>
                            setFields((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-input bg-background py-2 pl-2.5 pr-7 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                          {MACRO_META[key].unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* How much did you eat? */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">How much did you eat?</h3>
              {servingSizeGrams != null && (
                <div className="inline-flex rounded-lg border border-border p-0.5 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setAmountMode("servings");
                      setNeedTotal(false);
                      setCustomActive(false);
                    }}
                    className={cn(
                      "rounded-md px-3 py-1 font-medium transition-colors",
                      amountMode === "servings"
                        ? "bg-orange-600 text-white"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    Servings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAmountMode("grams");
                      setNeedTotal(false);
                      setCustomActive(false);
                    }}
                    className={cn(
                      "rounded-md px-3 py-1 font-medium transition-colors",
                      amountMode === "grams"
                        ? "bg-orange-600 text-white"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    Grams
                  </button>
                </div>
              )}
            </div>

            {/* Quick amounts — serving chips (servings mode) + a whole-pack shortcut */}
            <div className="flex flex-wrap items-center gap-2">
              {amountMode === "servings" &&
                servingChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setServingsStr(chip);
                      setNeedTotal(false);
                      setCustomActive(false);
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      !needTotal && !customActive && servingsStr === chip
                        ? "border-orange-600 bg-orange-600/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {chip === "0.5" ? "½" : chip}
                  </button>
                ))}
              <button
                type="button"
                onClick={applyWholePack}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  wholePackActive && !customActive
                    ? "border-orange-600 bg-orange-600/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {wholePackLabel}
              </button>
              <button
                type="button"
                onClick={startCustom}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  customActive
                    ? "border-orange-600 bg-orange-600/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                Custom
              </button>
            </div>

            {amountMode === "servings" ? (
              <div className="flex items-center gap-2">
                <input
                  ref={amountInputRef}
                  type="number"
                  min={0}
                  step={0.25}
                  inputMode="decimal"
                  value={servingsStr}
                  onKeyDown={blockNonNumericKeys}
                  onChange={(e) =>
                    setServingsStr(limitDecimals(e.target.value))
                  }
                  className={cn(
                    "w-28 rounded-lg border bg-background px-3 py-2 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-500",
                    customActive
                      ? "border-orange-500 ring-2 ring-orange-500"
                      : "border-input",
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  serving{toNum(servingsStr) === 1 ? "" : "s"}
                  {servingSizeGrams != null && (
                    <> · one serving = {reading.servingSizeText}</>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative w-32">
                  <input
                    ref={amountInputRef}
                    type="number"
                    min={0}
                    step={1}
                    inputMode="decimal"
                    value={gramsStr}
                    onKeyDown={blockNonNumericKeys}
                    onChange={(e) => setGramsStr(limitDecimals(e.target.value))}
                    className={cn(
                      "w-full rounded-lg border bg-background py-2 pl-3 pr-7 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-500",
                      customActive
                        ? "border-orange-500 ring-2 ring-orange-500"
                        : "border-input",
                    )}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
                    g
                  </span>
                </div>
                {servingSizeGrams != null && (
                  <span className="text-sm text-muted-foreground">
                    of {servingSizeGrams} g per serving
                  </span>
                )}
              </div>
            )}

            {needTotal && (
              <p className="text-xs text-orange-700 dark:text-orange-400">
                {amountMode === "grams"
                  ? 'This label doesn’t list the pack size — check the packaging for the net weight (e.g. "Net Wt. 137 g") and type it above.'
                  : "This label doesn’t list the pack size — enter how many servings the whole pack holds (often printed as “servings per pack”)."}
              </p>
            )}
          </div>

          {/* What will be logged */}
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-orange-600/30 bg-orange-600/5 p-5 text-center">
              <span className="text-4xl font-bold tracking-tight text-orange-600">
                {scaled.calories.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                kcal
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatAmountEaten(amount)}
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
              <div>
                <p className="text-sm font-semibold">
                  Total you&apos;re logging
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatAmountEaten(amount)} × the per-serving values above
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <MacroTile label="Protein" value={scaled.protein} />
                <MacroTile label="Carbs" value={scaled.carbs} />
                <MacroTile label="Fat" value={scaled.fat} />
                <MacroTile label="Fiber" value={scaled.fiber} />
                <MacroTile label="Sugar" value={scaled.sugar} />
              </div>
            </div>
          </div>

          {reading.notes.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">What we read</h3>
              <ul className="mt-2 space-y-1.5">
                {reading.notes.map((note) => (
                  <li
                    key={note}
                    className="flex gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-orange-600" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {logError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {logError}
            </p>
          )}

          {logState === "saved" ? (
            <div className="flex flex-col gap-3 rounded-xl border border-green-600/30 bg-green-600/5 p-5">
              <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
                <CheckIcon className="size-5" />
                Logged to your day
              </div>
              <p className="text-sm text-muted-foreground">
                {scaled.calories.toLocaleString()} kcal added to today&apos;s
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
                  <LabelIcon className="size-4" />
                  Add another
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLog}
                disabled={logState === "saving" || scaled.calories <= 0}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logState === "saving" ? (
                  <>
                    <Spinner />
                    Logging…
                  </>
                ) : (
                  <>
                    <PlusIcon className="size-4" />
                    Log this meal
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <UploadIcon className="size-4" />
                Scan another label
              </button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Read from the package label — double-check the numbers if the print
            was hard to see.
          </p>
        </div>
      )}
    </div>
  );
}

function MacroTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-center">
      <p className="text-xl font-bold tracking-tight">{value}g</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="size-5 animate-spin rounded-full border-2 border-orange-600 border-t-transparent"
      aria-hidden="true"
    />
  );
}
