import Link from "next/link";
import { CheckIcon } from "~/components/dashboard/icons";

const features = [
  "Unlimited AI meal and nutrition-label scans",
  "Cooking and portion questions tailored to your meal",
  "Unlimited saved Kitchen dishes and quick re-logging",
  "Full meal history, 30-day trends, and CSV export",
];

export function ChallengeAccess() {
  return (
    <section
      id="pricing"
      className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
          Congressional App Challenge edition
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Every feature. Free to explore.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Explore the full app during judging, with no daily scan limit and no
          payment details needed. Create your own account to keep your meals
          private.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-orange-600" />
              {feature}
            </li>
          ))}
        </ul>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
        >
          Explore the app
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          For adults 18 and older. Photo-based nutrition values are estimates.
        </p>
      </div>
    </section>
  );
}
