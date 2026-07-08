import { signout } from "~/app/auth/actions";
import { CalendarIcon, ChevronDownIcon, SearchIcon, UploadIcon } from "./icons";

export function DashboardTopbar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-18 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
      {/* Date pill (static for now) */}
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        <CalendarIcon className="size-4 text-muted-foreground" />
        <span>Today</span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Search"
          className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <SearchIcon className="size-5" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          <UploadIcon className="size-4" />
          <span className="hidden sm:inline">Upload Photo</span>
        </button>

        <div className="flex items-center gap-2 border-l border-border pl-3">
          <span
            className="flex size-9 items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white"
            title={email}
          >
            {initial}
          </span>
          <form action={signout}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
