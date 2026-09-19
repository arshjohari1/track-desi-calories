import Link from "next/link";
import { LabelIcon, PlusIcon, ScanIcon } from "~/components/dashboard/icons";
import { cn } from "~/lib/utils";
import { LabelFlow } from "./label-flow";
import { ManualFlow } from "./manual-flow";
import { ScanFlow } from "./scan-flow";

type Mode = "photo" | "label" | "manual";

const HEADINGS: Record<Mode, { title: string; subtitle: string }> = {
  photo: {
    title: "Scan Meal",
    subtitle:
      "Upload a photo and let AI estimate the macros — with a special focus on South Asian home cooking.",
  },
  label: {
    title: "Add Packaged Food",
    subtitle:
      "Snap the nutrition label on the package and we'll read the macros straight off it.",
  },
  manual: {
    title: "Add Meal Manually",
    subtitle:
      "Type in a food and its macros yourself — no photo, no AI, and it never uses a scan.",
  },
};

const TABS: Array<{
  mode: Mode;
  href: string;
  label: string;
  icon: typeof ScanIcon;
}> = [
  { mode: "photo", href: "/scan", label: "Meal photo", icon: ScanIcon },
  {
    mode: "label",
    href: "/scan?mode=label",
    label: "Nutrition label",
    icon: LabelIcon,
  },
  {
    mode: "manual",
    href: "/scan?mode=manual",
    label: "Manual",
    icon: PlusIcon,
  },
];

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const active: Mode =
    mode === "label" ? "label" : mode === "manual" ? "manual" : "photo";
  const heading = HEADINGS[active];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{heading.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{heading.subtitle}</p>
      </div>

      {/* Full-width split on phones so each tab is a comfortable target; hugs
          its content again from `sm` up. */}
      <div className="mb-6 flex rounded-lg border border-border bg-card p-1 sm:inline-flex">
        {TABS.map((tab) => {
          const isActive = tab.mode === active;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.mode}
              href={tab.href}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors sm:h-10 sm:flex-none sm:px-4",
                isActive
                  ? "bg-orange-600 text-white"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {active === "label" ? (
        <LabelFlow />
      ) : active === "manual" ? (
        <ManualFlow />
      ) : (
        <ScanFlow />
      )}
    </div>
  );
}
