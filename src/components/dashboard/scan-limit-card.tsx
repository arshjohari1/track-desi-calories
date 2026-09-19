import Link from "next/link";
import { KitchenIcon, PlusIcon, ScanIcon } from "~/components/dashboard/icons";

/**
 * Shown in the scan flows when a free user has spent their daily AI scans.
 * It doesn't dead-end them: the two zero-cost logging paths (Kitchen re-logs,
 * manual entry) are right here, alongside the upgrade CTA.
 */
export function ScanLimitCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-orange-600/30 bg-orange-600/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-600/10 text-orange-600">
          <ScanIcon className="size-5" />
        </span>
        <div>
          <h3 className="font-semibold">That's your free scans for today</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/pricing"
          className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          Go Premium — unlimited scans
        </Link>
        <Link
          href="/kitchen"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <KitchenIcon className="size-4" />
          Log from Kitchen
        </Link>
        <Link
          href="/scan?mode=manual"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          <PlusIcon className="size-4" />
          Enter manually
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        Kitchen re-logs and manual entries are always free and unlimited — they
        don't use an AI scan.
      </p>
    </div>
  );
}
