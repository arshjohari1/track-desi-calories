// Instant skeleton for Settings while the profile loads.
export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-row gap-2 lg:flex-col">
          {["a", "b", "c"].map((k) => (
            <div key={k} className="h-10 w-28 rounded-lg bg-muted lg:w-full" />
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="h-16 rounded bg-muted" />
            <div className="h-16 rounded bg-muted" />
          </div>
          <div className="mt-6 h-9 w-32 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
