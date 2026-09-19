// Instant skeleton for the Kitchen grid while saved dishes load.
export default function KitchenLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-28 rounded bg-muted" />
        <div className="h-4 w-56 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {["a", "b", "c", "d"].map((k) => (
          <div key={k} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="size-12 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
              </div>
            </div>
            <div className="mt-4 h-9 rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
