"use client";

import { useId, useState } from "react";
import { cn } from "~/lib/utils";

const tabs = [
  { key: "account", label: "Account", icon: "👤" },
  { key: "profile", label: "Profile", icon: "📝" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
  { key: "privacy", label: "Privacy", icon: "🛡️" },
  { key: "billing", label: "Billing", icon: "💳" },
  { key: "kitchen", label: "Kitchen", icon: "🍳" },
  { key: "data-export", label: "Data Export", icon: "📦" },
] as const;

type Tab = (typeof tabs)[number]["key"];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        checked
          ? "bg-teal-600"
          : "bg-muted-foreground/30 dark:bg-muted-foreground/40",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: string[];
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        defaultValue={value}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({
  label,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

function AccountTab() {
  const [useMetric, setUseMetric] = useState(true);
  const [showCalories, setShowCalories] = useState(true);
  const [saPortions, setSaPortions] = useState(true);
  const [privateLogs, setPrivateLogs] = useState(true);
  const [anonImprovement, setAnonImprovement] = useState(false);
  const [savePhotos, setSavePhotos] = useState(true);

  return (
    <div className="space-y-8">
      {/* Account details */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">Account details</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <InputField label="Full name" placeholder="Your name" />
          <InputField
            label="Email address"
            type="email"
            placeholder="you@example.com"
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Password</span>
            <button
              type="button"
              className="w-fit rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Change password
            </button>
          </div>
          <SelectField
            label="Time zone"
            value="Asia/Kolkata"
            options={[
              "Asia/Kolkata",
              "America/New_York",
              "America/Chicago",
              "America/Los_Angeles",
              "Europe/London",
              "Asia/Dubai",
            ]}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            Save changes
          </button>
          <button
            type="button"
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </section>

      {/* Diet preferences */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">Diet preferences</h2>
        <div className="grid gap-x-12 gap-y-5 sm:grid-cols-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Use metric units</span>
            <Toggle checked={useMetric} onChange={setUseMetric} />
          </div>
          <SelectField
            label="Activity level"
            value="Moderate"
            options={["Sedentary", "Lightly active", "Moderate", "Very active"]}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm">Show calories on meal cards</span>
            <Toggle checked={showCalories} onChange={setShowCalories} />
          </div>
          <SelectField
            label="Daily calorie goal"
            value="Not set"
            options={[
              "Not set",
              "1,500 kcal",
              "1,800 kcal",
              "2,000 kcal",
              "2,100 kcal",
              "2,500 kcal",
              "3,000 kcal",
            ]}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm">Default to South Asian portions</span>
            <Toggle checked={saPortions} onChange={setSaPortions} />
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Used to calibrate recipe estimates and daily totals.
        </p>
      </section>

      {/* Kitchen defaults */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">Kitchen defaults</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField
            label="Default oil"
            value="Mustard oil"
            options={[
              "Mustard oil",
              "Ghee",
              "Coconut oil",
              "Sunflower oil",
              "Olive oil",
              "Vegetable oil",
            ]}
          />
          <SelectField
            label="Finishing fat"
            value="Ghee"
            options={["Ghee", "Butter", "None", "Cream"]}
          />
          <SelectField
            label="Typical serving style"
            value="Home-cooked shared plate"
            options={[
              "Home-cooked shared plate",
              "Individual portion",
              "Restaurant style",
              "Tiffin / lunchbox",
            ]}
          />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Applied to future analyses for faster recipe calibration.
        </p>
      </section>

      {/* Privacy */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">Privacy</h2>
        <div className="grid gap-x-12 gap-y-5 sm:grid-cols-2">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm">Make meal logs private</span>
              <Toggle checked={privateLogs} onChange={setPrivateLogs} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Allow anonymized model improvement
              </span>
              <Toggle checked={anonImprovement} onChange={setAnonImprovement} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Save meal photos with logs</span>
              <Toggle checked={savePhotos} onChange={setSavePhotos} />
            </div>
          </div>
          <div className="flex items-start">
            <p className="text-sm text-muted-foreground">
              Control how your meals and photos are stored.
            </p>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/30 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Danger zone</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="w-fit rounded-lg border border-destructive px-5 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete account
          </button>
          <p className="text-sm text-muted-foreground">
            Permanently remove your account, meal history, and Kitchen recipes.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account, food preferences, and Kitchen defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        {/* Settings sidebar */}
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-orange-600 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div>
          {activeTab === "account" && <AccountTab />}
          {activeTab !== "account" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-24 text-center">
              <span className="text-4xl">
                {tabs.find((t) => t.key === activeTab)?.icon}
              </span>
              <h2 className="text-lg font-semibold">
                {tabs.find((t) => t.key === activeTab)?.label}
              </h2>
              <p className="text-sm text-muted-foreground">
                This section is coming soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
