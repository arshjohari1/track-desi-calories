import Link from "next/link";

/**
 * Root 404. Renders outside both route groups, so it carries its own minimal
 * chrome rather than inheriting the marketing navbar or dashboard sidebar.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-bold tracking-tight"
      >
        <span className="text-2xl">🍛</span>
        <span className="text-lg">TrackDesiCalories</span>
      </Link>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold text-orange-600">404</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          This page doesn&apos;t exist
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The link may be out of date, or the page may have moved. Your logged
          meals are safe.
        </p>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          Go to dashboard
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
