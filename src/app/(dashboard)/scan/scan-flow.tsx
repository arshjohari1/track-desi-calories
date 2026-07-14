"use client";

import { useCallback, useRef, useState } from "react";
import { ScanIcon, SpiceIcon, UploadIcon } from "~/components/dashboard/icons";
import type { FoodAnalysis, FoodMacros } from "~/lib/ai/food";
import { cn } from "~/lib/utils";

type Step = "upload" | "analyzing" | "questions" | "estimating" | "result";

/**
 * Shrinks a photo to a max dimension and re-encodes as JPEG so the upload stays
 * small (phone photos are often several MB). Falls back to the original data URL
 * if the browser can't decode/redraw it.
 */
async function fileToCompressedDataUrl(
  file: File,
  maxDim = 1024,
  quality = 0.85,
): Promise<string> {
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not load that image."));
      image.src = originalDataUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return originalDataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return originalDataUrl;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<T> & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

const CONFIDENCE_STYLES: Record<FoodMacros["confidence"], string> = {
  high: "bg-green-600/10 text-green-700 dark:text-green-400",
  medium: "bg-orange-600/10 text-orange-700 dark:text-orange-400",
  low: "bg-red-600/10 text-red-700 dark:text-red-400",
};

export function ScanFlow() {
  const [step, setStep] = useState<Step>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [macros, setMacros] = useState<FoodMacros | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setImageUrl(null);
    setAnalysis(null);
    setAnswers({});
    setMacros(null);
    setError(null);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setMacros(null);
    setAnalysis(null);
    setAnswers({});

    let dataUrl: string;
    try {
      dataUrl = await fileToCompressedDataUrl(file);
    } catch {
      setError("Couldn't read that photo. Try a different one.");
      return;
    }
    setImageUrl(dataUrl);
    setStep("analyzing");

    try {
      const { analysis: result } = await postJson<{ analysis: FoodAnalysis }>(
        "/api/scan/analyze",
        { image: dataUrl },
      );
      setAnalysis(result);
      setStep("questions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
      setStep("upload");
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // Allow re-selecting the same file later.
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const allAnswered =
    analysis?.questions.every((q) => (answers[q.id] ?? "").trim().length > 0) ??
    false;

  const submitAnswers = async () => {
    if (!analysis || !imageUrl) return;
    setError(null);
    setStep("estimating");
    try {
      const { macros: result } = await postJson<{ macros: FoodMacros }>(
        "/api/scan/estimate",
        {
          image: imageUrl,
          analysis: {
            dishName: analysis.dishName,
            cuisine: analysis.cuisine,
            isSouthAsian: analysis.isSouthAsian,
          },
          answers: analysis.questions.map((q) => ({
            question: q.label,
            answer: answers[q.id] ?? "",
          })),
        },
      );
      setMacros(result);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Estimate failed.");
      setStep("questions");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Hidden file input drives every "choose a photo" affordance. */}
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
            <ScanIcon className="size-7" />
          </span>
          <div>
            <p className="font-semibold">Upload a photo of your meal</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Our AI estimates the macros — tuned for South Asian home cooking
              (ghee, oil, rich gravies) as well as everything else.
            </p>
          </div>
          <span className="mt-1 flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700">
            <UploadIcon className="size-4" />
            Upload Photo
          </span>
          <p className="text-xs text-muted-foreground">
            or drag &amp; drop · JPG, PNG, or WebP
          </p>
        </button>
      )}

      {(step === "analyzing" || step === "estimating") && (
        <div className="flex flex-col items-center gap-5 rounded-xl border border-border bg-card px-6 py-16 text-center">
          {imageUrl && (
            // biome-ignore lint/performance/noImgElement: transient local data URL, not a remote asset
            <img
              src={imageUrl}
              alt="Your meal"
              className="size-28 rounded-xl object-cover shadow-sm"
            />
          )}
          <div className="flex items-center gap-3">
            <Spinner />
            <p className="text-sm font-medium">
              {step === "analyzing"
                ? "Identifying your dish…"
                : "Crunching the macros…"}
            </p>
          </div>
          <p className="max-w-xs text-xs text-muted-foreground">
            {step === "analyzing"
              ? "Looking at what's on your plate."
              : "Factoring in your answers about portion and cooking fats."}
          </p>
        </div>
      )}

      {step === "questions" && analysis && (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          {/* Left: what the AI saw */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
            {imageUrl && (
              // biome-ignore lint/performance/noImgElement: transient local data URL, not a remote asset
              <img
                src={imageUrl}
                alt="Your meal"
                className="aspect-square w-full rounded-lg object-cover"
              />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="font-semibold leading-tight">
                  {analysis.dishName}
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {analysis.cuisine}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {analysis.isSouthAsian && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-600/10 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                  <SpiceIcon className="size-3" />
                  South Asian
                </span>
              )}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                {analysis.confidence} confidence
              </span>
            </div>
            {analysis.description && (
              <p className="text-xs text-muted-foreground">
                {analysis.description}
              </p>
            )}
          </div>

          {/* Right: follow-up questions */}
          <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
            <div>
              <h3 className="font-semibold">A few quick questions</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {analysis.isSouthAsian
                  ? "Ghee, oil, and portion make a huge difference — help us nail the numbers."
                  : "Portion and prep make a big difference — a couple of details sharpen the estimate."}
              </p>
            </div>

            {analysis.questions.map((q, i) => (
              <fieldset key={q.id} className="space-y-2">
                <legend className="text-sm font-medium">
                  <span className="text-muted-foreground">{i + 1}. </span>
                  {q.label}
                </legend>
                {q.helpText && (
                  <p className="text-xs text-muted-foreground">{q.helpText}</p>
                )}
                {q.type === "single" && q.options.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                          }
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            selected
                              ? "border-orange-600 bg-orange-600/10 text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value,
                      }))
                    }
                    placeholder="Type your answer…"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                )}
              </fieldset>
            ))}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={submitAnswers}
                disabled={!allAnswered}
                className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Calculate macros
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Start over
              </button>
              {!allAnswered && (
                <span className="text-xs text-muted-foreground">
                  Answer all questions to continue.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "result" && macros && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            {/* Calories headline */}
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-orange-600/30 bg-orange-600/5 p-5 text-center">
              {imageUrl && (
                // biome-ignore lint/performance/noImgElement: transient local data URL, not a remote asset
                <img
                  src={imageUrl}
                  alt="Your meal"
                  className="mb-2 size-20 rounded-xl object-cover shadow-sm"
                />
              )}
              <span className="text-4xl font-bold tracking-tight text-orange-600">
                {Math.round(macros.calories).toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-muted-foreground">
                kcal
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                {macros.servingSummary}
              </p>
            </div>

            {/* Macro tiles */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold leading-tight">
                    {macros.dishName}
                  </h2>
                  <p className="text-xs text-muted-foreground">Per portion</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    CONFIDENCE_STYLES[macros.confidence],
                  )}
                >
                  {macros.confidence} confidence
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MacroTile label="Protein" value={macros.protein} />
                <MacroTile label="Carbs" value={macros.carbs} />
                <MacroTile label="Fat" value={macros.fat} />
                <MacroTile label="Fiber" value={macros.fiber} />
              </div>
            </div>
          </div>

          {(macros.assumptions.length > 0 || macros.tip) && (
            <div className="rounded-xl border border-border bg-card p-5">
              {macros.assumptions.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold">What we assumed</h3>
                  <ul className="mt-2 space-y-1.5">
                    {macros.assumptions.map((a) => (
                      <li
                        key={a}
                        className="flex gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-orange-600" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {macros.tip && (
                <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  💡 {macros.tip}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              <UploadIcon className="size-4" />
              Scan another meal
            </button>
            <button
              type="button"
              onClick={() => {
                setMacros(null);
                setStep("questions");
              }}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Adjust answers
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            AI estimate — actual values vary with ingredients and preparation.
          </p>
        </div>
      )}
    </div>
  );
}

function MacroTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-center">
      <p className="text-xl font-bold tracking-tight">{Math.round(value)}g</p>
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
