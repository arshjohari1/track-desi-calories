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
import { type ProfileState, updateProfile } from "./actions";

/** Canonical (metric) profile values loaded from the DB to pre-fill the form. */
export type ProfileValues = {
  goal: Goal;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
};

export function ProfileForm({
  profile,
  defaultUnits,
}: {
  profile: ProfileValues;
  defaultUnits: Units;
}) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {},
  );

  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [sex, setSex] = useState<Sex>(profile.sex);
  const [age, setAge] = useState(String(profile.age));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile.activityLevel,
  );

  // Default to the unit system the user last saved (remembered in a cookie);
  // falls back to metric. Metric is the source of truth (that's how the DB
  // stores it), so the metric inputs start with the exact stored values —
  // untouched, they submit unchanged with no conversion round-trip. The imperial
  // inputs are pre-derived so the toggle shows sensible values immediately.
  const [units, setUnits] = useState<Units>(defaultUnits);
  const [heightCmInput, setHeightCmInput] = useState(String(profile.heightCm));
  const initialImperial = useMemo(() => {
    const totalInches = profile.heightCm / 2.54;
    const ft = Math.floor(totalInches / 12);
    const inch = Math.round(totalInches - ft * 12);
    return { ft: String(ft), inch: String(inch) };
  }, [profile.heightCm]);
  const [heightFt, setHeightFt] = useState(initialImperial.ft);
  const [heightIn, setHeightIn] = useState(initialImperial.inch);
  const [weightKgInput, setWeightKgInput] = useState(String(profile.weightKg));
  const [weightLbInput, setWeightLbInput] = useState(
    String(Math.round(profile.weightKg * 2.2046226218)),
  );

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

  // Inline age check shown right under the field, live as the user types, with
  // wording that mirrors the server's so the field and the save error agree.
  // Catches non-integers up front (the DB stores age as a whole number).
  const ageError =
    age === "" || !Number.isFinite(ageNum)
      ? null
      : !Number.isInteger(ageNum)
        ? "Age must be a whole number."
        : ageNum < 18
          ? "You must be 18 or older to use the app."
          : ageNum > 120
            ? "Please enter a valid age."
            : null;

  const canEstimate =
    Number.isFinite(ageNum) &&
    ageNum >= 18 &&
    ageNum <= 120 &&
    Number.isFinite(heightCm) &&
    heightCm >= 50 &&
    Number.isFinite(weightKg) &&
    weightKg >= 20;

  // Live preview of the derived goal — the whole point of the screen is that
  // this number (and the dashboard's) moves with the inputs.
  const estimate = useMemo(() => {
    if (!canEstimate) return null;
    return calculateDailyCalorieTarget({
      goal,
      sex,
      age: ageNum,
      heightCm,
      weightKg,
      activityLevel,
    });
  }, [canEstimate, goal, sex, ageNum, heightCm, weightKg, activityLevel]);

  // On a rejected save, scroll to the first flagged field (often below the fold).
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
      "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2",
      hasError
        ? "border-red-500 focus:ring-red-500"
        : "border-input focus:ring-orange-500",
    );

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Your profile &amp; goal</h2>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Update the details from your onboarding. Changing your goal or any body
        metric recalculates your daily calorie target and updates your
        dashboard.
      </p>

      <form ref={formRef} action={formAction} className="space-y-7">
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

        {/* Errors surface inline next to the Save button (below), not in a
            heavy banner up here — see the button row. */}
        {state.success && (
          <p className="rounded-lg border border-orange-600/30 bg-orange-600/5 px-4 py-3 text-sm font-medium text-orange-700 dark:text-orange-400">
            Saved
            {typeof state.dailyCalorieTarget === "number"
              ? ` — your daily goal is now ${state.dailyCalorieTarget.toLocaleString()} kcal. Your dashboard is updated.`
              : "."}
          </p>
        )}

        {/* Goal */}
        <fieldset className="space-y-2">
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
        </fieldset>

        {/* Sex */}
        <fieldset className="space-y-2">
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
          <p className="text-xs text-muted-foreground">
            Used only to calculate your metabolic rate.
          </p>
        </fieldset>

        {/* Age */}
        <div
          className="space-y-1.5"
          data-invalid={ageError ? "true" : undefined}
        >
          <label htmlFor="settings-age" className="text-sm font-medium">
            Age
          </label>
          <input
            id="settings-age"
            name="age"
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 28"
            className={field(Boolean(ageError))}
          />
          {ageError && <p className="text-xs text-red-600">{ageError}</p>}
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
          <div className="space-y-1.5">
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
                  className={field(false)}
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
                    className={field(false)}
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
                    className={field(false)}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    in
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
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
                className={field(false)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {units === "metric" ? "kg" : "lb"}
              </span>
            </div>
          </div>
        </div>

        {/* Activity level */}
        <fieldset className="space-y-2">
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

        {/* Confirmation sits next to the button too, so it's visible without
            scrolling back up to the banner. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
          {state.success && (
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Saved
              {typeof state.dailyCalorieTarget === "number"
                ? ` — new daily goal ${state.dailyCalorieTarget.toLocaleString()} kcal`
                : ""}
            </p>
          )}
          {state.error && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {state.error}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
