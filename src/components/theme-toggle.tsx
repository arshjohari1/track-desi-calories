"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "~/components/dashboard/icons";
import { cn } from "~/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

/**
 * Light / Dark / System segmented control.
 *
 * Built on real radio inputs rather than buttons so the group gets native
 * arrow-key navigation and announces itself correctly; the inputs are visually
 * hidden and the labels carry the styling.
 *
 * The active option can only be known on the client — the server has no idea
 * what the browser or OS prefers — so nothing is marked selected until after
 * mount. The controls still render at their final size on the server pass, so
 * settling in doesn't shift the surrounding layout.
 */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const name = useId();

  useEffect(() => setMounted(true), []);

  const selected = mounted ? (theme ?? "system") : null;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Colour theme</legend>

      <div className="inline-flex w-fit rounded-lg border border-border p-0.5">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = selected === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-500",
                active
                  ? "bg-orange-600 text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={active}
                onChange={() => setTheme(opt.value)}
                className="sr-only"
              />
              <Icon className="size-4" />
              {opt.label}
            </label>
          );
        })}
      </div>

      {/* Non-breaking space holds the line's height before mount. */}
      <p className="text-xs text-muted-foreground">
        {!mounted
          ? " "
          : selected === "system"
            ? `Following your device — currently ${resolvedTheme ?? "light"}.`
            : `Always ${selected}, regardless of your device setting.`}
      </p>
    </fieldset>
  );
}
