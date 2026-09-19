// Instant skeleton for the logs list while meals load.
export default function LogsLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      <div className="mb-6 h-7 w-24 rounded bg-muted" />
      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4">
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {["a", "b", "c", "d"].map((k) => (
            <div key={k} className="flex items-center gap-3 px-4 py-4">
              <div className="size-12 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-6 w-12 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
