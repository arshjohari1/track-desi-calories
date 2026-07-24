import Link from "next/link";
import { LabelIcon, ScanIcon } from "~/components/dashboard/icons";
import { cn } from "~/lib/utils";
import { LabelFlow } from "./label-flow";
import { ScanFlow } from "./scan-flow";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const isLabel = mode === "label";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {isLabel ? "Add Packaged Food" : "Scan Meal"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLabel
            ? "Snap the nutrition label on the package and we'll read the macros straight off it."
            : "Upload a photo and let AI estimate the macros — with a special focus on South Asian home cooking."}
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-lg border border-border bg-card p-1">
        <Link
          href="/scan"
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            isLabel
              ? "text-muted-foreground hover:bg-muted"
              : "bg-orange-600 text-white",
          )}
        >
          <ScanIcon className="size-4" />
          Meal photo
        </Link>
        <Link
          href="/scan?mode=label"
          className={cn(
            "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            isLabel
              ? "bg-orange-600 text-white"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <LabelIcon className="size-4" />
          Nutrition label
        </Link>
      </div>

      {isLabel ? <LabelFlow /> : <ScanFlow />}
    </div>
  );
}
