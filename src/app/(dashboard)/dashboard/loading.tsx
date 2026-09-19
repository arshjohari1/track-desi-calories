// Instant skeleton shown while the dashboard's Supabase queries resolve, so
// navigation never hangs on the previous page. Mirrors the real layout.
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse">
      <div className="mb-6 h-8 w-40 rounded bg-muted" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="mt-3 h-10 w-48 rounded bg-muted" />
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
              <div className="h-10 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-4 space-y-3">
              <div className="h-14 rounded-lg bg-muted" />
              <div className="h-14 rounded-lg bg-muted" />
              <div className="h-14 rounded-lg bg-muted" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="mt-4 space-y-3">
            <div className="h-16 rounded-lg bg-muted" />
            <div className="h-16 rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
