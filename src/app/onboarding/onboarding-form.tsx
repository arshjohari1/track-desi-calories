"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  ACTIVITY_LEVELS,
  type ActivityLevel,
  calculateDailyCalorieTarget,
  feetInchesToCm,
  GOALS,
  type Goal,
  lbToKg,
  SEXES,
  type Sex,
} from "~/lib/onboarding";
import { rememberUnits, type Units } from "~/lib/units";
import { cn } from "~/lib/utils";
import { completeOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState<
    OnboardingState,
    FormData
  >(completeOnboarding, {});

  const [fullName, setFullName] = useState("");
  const [goal, setGoal] = useState<Goal | "">("");
  const [sex, setSex] = useState<Sex | "">("");
  const [age, setAge] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");

  const [units, setUnits] = useState<Units>("metric");
  const [heightCmInput, setHeightCmInput] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightKgInput, setWeightKgInput] = useState("");
  const [weightLbInput, setWeightLbInput] = useState("");

  // Normalise everything to metric for submission and the live estimate.
  const heightCm = useMemo(() => {
    if (units === "metric") return Number(heightCmInput);
    if (!heightFt && !heightIn) return Number.NaN;
    return feetInchesToCm(Number(heightFt) || 0, Number(heightIn) || 0);
  }, [units, heightCmInput, heightFt, heightIn]);

  const weightKg = useMemo(() => {
    if (units === "metric") return Number(weightKgInput);
    if (!weightLbInput) return Number.NaN;
    return lbToKg(Number(weightLbInput));
  }, [units, weightKgInput, weightLbInput]);

  const ageNum = Number(age);

  // App-styled age validation so we show our own inline message instead of the
  // browser's native "Value must be greater than or equal to 18" tooltip. The
  // wording mirrors the server's so the field and banner never disagree.
  const ageError =
    age === "" || !Number.isFinite(ageNum)
      ? null
      : ageNum < 18
        ? "You must be 18 or older to use the app."
        : ageNum > 120
          ? "Please enter a valid age."
          : null;

  // Enough valid input to show a live estimate. NOT used to gate submission —
  // the server is the source of truth and returns field-specific errors.
  const canEstimate =
    goal !== "" &&
    sex !== "" &&
    activityLevel !== "" &&
    Number.isFinite(ageNum) &&
    ageNum >= 18 &&
    ageNum <= 120 &&
    Number.isFinite(heightCm) &&
    heightCm >= 50 &&
    Number.isFinite(weightKg) &&
    weightKg >= 20;

  const estimate = useMemo(() => {
    if (!canEstimate) return null;
    return calculateDailyCalorieTarget({
      goal: goal as Goal,
      sex: sex as Sex,
      age: ageNum,
      heightCm,
      weightKg,
      activityLevel: activityLevel as ActivityLevel,
    });
  }, [canEstimate, goal, sex, ageNum, heightCm, weightKg, activityLevel]);

  // After a rejected submit, highlight exactly which required fields are still
  // empty so it's obvious the user needs to enter them (placeholders alone read
  // as pre-filled values).
  const showErrors = Boolean(state.error);
  const missing = {
    name: fullName.trim() === "",
    goal: goal === "",
    sex: sex === "",
    age: age === "" || !Number.isFinite(ageNum),
    height: !Number.isFinite(heightCm) || heightCm <= 0,
    weight: !Number.isFinite(weightKg) || weightKg <= 0,
    activity: activityLevel === "",
  };

  // Human-readable names of the still-missing fields, in form order — used to
  // name them in the banner so the user isn't hunting for an off-screen field.
  const missingLabels = [
    missing.name && "name",
    missing.goal && "goal",
    missing.sex && "biological sex",
    missing.age && "age",
    missing.height && "height",
    missing.weight && "weight",
    missing.activity && "activity level",
  ].filter((v): v is string => Boolean(v));

  // On a rejected submit, jump to the first field that needs attention (it's
  // often below the fold). Keyed on `state` so it runs once per submit.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.error) return;
    const target = formRef.current?.querySelector<HTMLElement>(
      "[data-invalid='true']",
    );
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  const field = (hasError: boolean) =>
    cn(
      "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 placeholder:italic focus:outline-none focus:ring-2",
      hasError
        ? "border-red-500 focus:ring-red-500"
        : "border-input focus:ring-orange-500",
    );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-7 rounded-xl border border-border bg-card p-6"
    >
      {/* Normalised hidden values consumed by the server action. */}
      <input type="hidden" name="goal" value={goal} />
      <input type="hidden" name="sex" value={sex} />
      <input type="hidden" name="activityLevel" value={activityLevel} />
      <input
        type="hidden"
        name="heightCm"
        value={Number.isFinite(heightCm) ? heightCm : ""}
      />
      <input
        type="hidden"
        name="weightKg"
        value={Number.isFinite(weightKg) ? weightKg : ""}
      />

      {showErrors && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {missingLabels.length > 0
            ? `Please fill in your ${missingLabels.join(", ")}.`
            : state.error}
        </p>
      )}

      {/* Full name */}
      <div
        className="space-y-1.5"
        data-invalid={showErrors && missing.name ? "true" : undefined}
      >
        <label htmlFor="onboarding-name" className="text-sm font-medium">
          Full name
        </label>
        <input
          id="onboarding-name"
          name="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Priya Sharma"
          maxLength={80}
          className={field(showErrors && missing.name)}
        />
        {showErrors && missing.name && (
          <p className="text-xs text-red-600">Please enter your name.</p>
        )}
      </div>

      {/* Goal */}
      <fieldset
        className="space-y-2"
        data-invalid={showErrors && missing.goal ? "true" : undefined}
      >
        <legend className="mb-2 text-sm font-medium">
          What&apos;s your goal?
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGoal(g.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-xs font-medium transition-colors",
                goal === g.value
                  ? "border-orange-600 bg-orange-600/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <span className="text-lg">{g.emoji}</span>
              {g.label}
            </button>
          ))}
        </div>
        {showErrors && missing.goal && (
          <p className="text-xs text-red-600">Please choose a goal.</p>
        )}
      </fieldset>

      {/* Sex */}
      <fieldset
        className="space-y-2"
        data-invalid={showErrors && missing.sex ? "true" : undefined}
      >
        <legend className="mb-2 text-sm font-medium">Biological sex</legend>
        <div className="grid grid-cols-2 gap-2">
          {SEXES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSex(s.value)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                sex === s.value
                  ? "border-orange-600 bg-orange-600/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        {showErrors && missing.sex ? (
          <p className="text-xs text-red-600">
            Please select your biological sex.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Used only to calculate your metabolic rate.
          </p>
        )}
      </fieldset>

      {/* Age */}
      <div
        className="space-y-1.5"
        data-invalid={
          (showErrors && missing.age) || ageError ? "true" : undefined
        }
      >
        <label htmlFor="age" className="text-sm font-medium">
          Age
        </label>
        <input
          id="age"
          name="age"
          type="number"
          inputMode="numeric"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="e.g. 28"
          className={field((showErrors && missing.age) || Boolean(ageError))}
        />
        {showErrors && missing.age ? (
          <p className="text-xs text-red-600">Please enter your age.</p>
        ) : ageError ? (
          <p className="text-xs text-red-600">{ageError}</p>
        ) : null}
      </div>

      {/* Units toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Units</span>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                setUnits(u);
                rememberUnits(u);
              }}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                units === u
                  ? "bg-orange-600 text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Height + weight */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          className="space-y-1.5"
          data-invalid={showErrors && missing.height ? "true" : undefined}
        >
          <span className="text-sm font-medium">Height</span>
          {units === "metric" ? (
            <div className="relative">
              <input
                type="number"
                min={50}
                max={275}
                step="0.1"
                inputMode="decimal"
                value={heightCmInput}
                onChange={(e) => setHeightCmInput(e.target.value)}
                placeholder="e.g. 170"
                className={field(showErrors && missing.height)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                cm
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={8}
                  inputMode="numeric"
                  value={heightFt}
                  onChange={(e) => setHeightFt(e.target.value)}
                  placeholder="e.g. 5"
                  className={field(showErrors && missing.height)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  ft
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={11}
                  inputMode="numeric"
                  value={heightIn}
                  onChange={(e) => setHeightIn(e.target.value)}
                  placeholder="e.g. 9"
                  className={field(showErrors && missing.height)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  in
                </span>
              </div>
            </div>
          )}
          {showErrors && missing.height && (
            <p className="text-xs text-red-600">Please enter your height.</p>
          )}
        </div>

        <div
          className="space-y-1.5"
          data-invalid={showErrors && missing.weight ? "true" : undefined}
        >
          <span className="text-sm font-medium">Current weight</span>
          <div className="relative">
            <input
              type="number"
              min={units === "metric" ? 20 : 44}
              max={units === "metric" ? 500 : 1100}
              step="0.1"
              inputMode="decimal"
              value={units === "metric" ? weightKgInput : weightLbInput}
              onChange={(e) =>
                units === "metric"
                  ? setWeightKgInput(e.target.value)
                  : setWeightLbInput(e.target.value)
              }
              placeholder={units === "metric" ? "e.g. 70" : "e.g. 154"}
              className={field(showErrors && missing.weight)}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {units === "metric" ? "kg" : "lb"}
            </span>
          </div>
          {showErrors && missing.weight && (
            <p className="text-xs text-red-600">
              Please enter your current weight.
            </p>
          )}
        </div>
      </div>

      {/* Activity level */}
      <fieldset
        className="space-y-2"
        data-invalid={showErrors && missing.activity ? "true" : undefined}
      >
        <legend className="mb-2 text-sm font-medium">Activity level</legend>
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setActivityLevel(a.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                activityLevel === a.value
                  ? "border-orange-600 bg-orange-600/10"
                  : "border-border hover:bg-muted",
              )}
            >
              <span className="font-medium">{a.label}</span>
              <span className="text-xs text-muted-foreground">{a.hint}</span>
            </button>
          ))}
        </div>
        {showErrors && missing.activity && (
          <p className="text-xs text-red-600">
            Please select your activity level.
          </p>
        )}
      </fieldset>

      {/* Live estimate */}
      {estimate && (
        <div className="rounded-lg border border-orange-600/30 bg-orange-600/5 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Your estimated daily goal
          </p>
          <p className="text-2xl font-bold text-orange-600">
            {estimate.toLocaleString()}{" "}
            <span className="text-sm font-medium">kcal</span>
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Finish setup"}
      </button>
    </form>
  );
}
