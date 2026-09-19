"use client";

import { useActionState, useState } from "react";
import { ThemeToggle } from "~/components/theme-toggle";
import type { Units } from "~/lib/units";
import { cn } from "~/lib/utils";
import { type AccountState, updateFullName } from "./actions";
import { ProfileForm, type ProfileValues } from "./profile-form";

const tabs = [
  { key: "account", label: "Account", icon: "👤" },
  { key: "profile", label: "Profile", icon: "📝" },
  { key: "billing", label: "Billing", icon: "💳" },
] as const;

type Tab = (typeof tabs)[number]["key"];

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500";

function AccountTab({ fullName, email }: { fullName: string; email: string }) {
  const [state, formAction, isPending] = useActionState<AccountState, FormData>(
    updateFullName,
    {},
  );
  // Controlled so the Clear button can empty it instantly.
  const [name, setName] = useState(fullName);

  return (
    <div className="space-y-8">
      {/* Account details */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">Account details</h2>
        <form action={formAction}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="account-full-name"
                className="text-sm text-muted-foreground"
              >
                Full name
              </label>
              <input
                id="account-full-name"
                name="fullName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={80}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="account-email"
                className="text-sm text-muted-foreground"
              >
                Email address
              </label>
              <input
                id="account-email"
                type="email"
                value={email}
                readOnly
                aria-readonly="true"
                className="w-full cursor-not-allowed rounded-lg border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Your login email can&apos;t be changed here.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setName("")}
              className="rounded-lg border border-border px-5 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Clear
            </button>
            {state.success && (
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Saved
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

      {/* Appearance */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">Appearance</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Choose how TrackDesiCalories looks. Applies instantly and is
          remembered on this device.
        </p>
        <ThemeToggle />
      </section>
    </div>
  );
}

export function SettingsClient({
  profile,
  defaultUnits,
  fullName,
  email,
}: {
  profile: ProfileValues;
  defaultUnits: Units;
  fullName: string;
  email: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("account");

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account and profile.
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
          {activeTab === "account" && (
            <AccountTab fullName={fullName} email={email} />
          )}
          {activeTab === "profile" && (
            <ProfileForm profile={profile} defaultUnits={defaultUnits} />
          )}
          {activeTab !== "account" && activeTab !== "profile" && (
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
