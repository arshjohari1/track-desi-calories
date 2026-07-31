"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Dashboard error boundary. Renders inside the dashboard layout, so the sidebar
 * and topbar survive — the user stays in the app and can navigate elsewhere
 * instead of being dropped onto a full-page error screen.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-2xl">
        ⚠️
      </span>
      <h1 className="text-2xl font-bold tracking-tight">
        Couldn&apos;t load this page
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Something went wrong fetching your data. Your logged meals are safe —
        try again in a moment.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
