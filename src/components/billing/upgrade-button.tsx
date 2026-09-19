"use client";

import { useState } from "react";
import type { PlanId } from "~/lib/billing/constants";

/**
 * Kicks off a billing redirect: POSTs to a Stripe route, then sends the browser
 * to the returned URL (Checkout or the Billing Portal). Shared by the Upgrade
 * and Manage-billing buttons.
 */
function useBillingRedirect(url: string, body?: unknown) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return { go, loading, error };
}

export function UpgradeButton({
  plan = "annual",
  className,
  children,
  loadingLabel = "Starting…",
}: {
  plan?: PlanId;
  className?: string;
  children: React.ReactNode;
  loadingLabel?: string;
}) {
  const { go, loading, error } = useBillingRedirect("/api/stripe/checkout", {
    plan,
  });

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className={className}
      >
        {loading ? loadingLabel : children}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function ManageBillingButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { go, loading, error } = useBillingRedirect("/api/stripe/portal");

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className={className}
      >
        {loading ? "Opening…" : children}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
