/**
 * Competitor comparison section.
 *
 * Two deliberate choices about how the claims are written:
 *
 * 1. The paired rows compare *architectures* — a database lookup versus a
 *    photo plus questions — rather than asserting a grid of feature ticks for
 *    four companies whose feature sets change without telling us. Structural
 *    claims stay true; a checkmark table goes stale and turns into a false
 *    advertising problem.
 * 2. Every named app is credited with what it's actually better at. Conceding
 *    the real strengths is what makes the rest of the section believable, and it
 *    keeps us honest about the one case we're built for.
 *
 * If you edit this, keep both properties. Never add a claim about another
 * product that you haven't checked is currently true.
 */

import { cn } from "~/lib/utils";

const CONTRASTS: Array<{ others: string; ours: string }> = [
  {
    others:
      "You search a dish by name and pick an entry — often several conflicting ones for the same food.",
    ours: "You photograph the plate. It identifies the dish, then asks about the meal in front of you.",
  },
  {
    others:
      "One number per entry, whether it was cooked in ghee, in oil, or in nothing at all.",
    ours: "Cooking fat, gravy richness and frying each move the estimate before it's final.",
  },
  {
    others:
      'Standardised servings — "1 cup", "100 g" — that rarely match a home-served plate.',
    ours: "Portion is always asked, in terms you can eyeball on your own thali.",
  },
  {
    others: "A number, with nothing showing where it came from.",
    ours: "Every estimate lists the assumptions behind it and carries a confidence rating.",
  },
];

const RIVALS: Array<{ name: string; good: string; gap: string }> = [
  {
    name: "MyFitnessPal",
    good: "The largest food database there is, and hard to beat for packaged and restaurant food.",
    gap: "Entries are crowd-sourced, so one dish can have a dozen conflicting versions — and none of them know whether your rajma had cream in it.",
  },
  {
    name: "HealthifyMe",
    good: "Genuinely good Indian food coverage, which most Western trackers simply don't have.",
    gap: "Logging is still a lookup: you pick a dish and take the number attached to it, rather than describing how yours was cooked.",
  },
  {
    name: "Cronometer",
    good: "The best of these for data quality — lab-verified entries and serious micronutrient depth.",
    gap: 'Verified data for a generic "chicken curry" still can\'t account for the two tablespoons of ghee that went into yours.',
  },
  {
    name: "Lose It!",
    good: "Photo logging isn't unique to us — Snap It, like MyFitnessPal's Meal Scan, will read a plate.",
    gap: "The difference is what happens next. They map the photo to a database entry; we ask how it was cooked before committing to a number.",
  },
];

export function Comparison() {
  return (
    <section id="comparison" className="bg-background py-16 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why TrackDesiCalories works better than the others
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            An alternative to MyFitnessPal, HealthifyMe, Cronometer and Lose It!
            for anyone eating South Asian home cooking — where a database entry
            was never going to be enough.
          </p>
        </div>

        {/* The structural argument, side by side. One 2-column grid *per row*
            rather than one big grid: it keeps each pair's cells equal height and
            makes the dividing borders index-driven instead of relying on
            positional selectors.

            Below `sm` the pairs stack instead. Two columns at 320px left each
            side about 143px — enough to render a sentence six lines tall and
            thin. Stacked, each side gets the full width and carries its own
            label, so the shared header row is only needed from `sm` up. */}
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="hidden border-b border-border sm:grid sm:grid-cols-2">
            <h3 className="border-r border-border bg-muted/40 px-4 py-3 text-sm font-semibold text-muted-foreground sm:px-6">
              Most calorie trackers
            </h3>
            <h3 className="bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 sm:px-6 dark:bg-orange-950/20 dark:text-orange-400">
              TrackDesiCalories
            </h3>
          </div>

          {CONTRASTS.map((row, i) => (
            <div
              key={row.ours}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2",
                i < CONTRASTS.length - 1 && "border-b border-border",
              )}
            >
              <div className="border-b border-border px-4 py-4 sm:border-r sm:border-b-0 sm:px-6">
                <span className="mb-1 block text-xs font-semibold text-muted-foreground sm:hidden">
                  Most calorie trackers
                </span>
                <p className="text-sm text-muted-foreground">{row.others}</p>
              </div>
              <div className="bg-orange-50/40 px-4 py-4 sm:bg-transparent sm:px-6 dark:bg-orange-950/10 dark:sm:bg-transparent">
                <span className="mb-1 block text-xs font-semibold text-orange-700 sm:hidden dark:text-orange-400">
                  TrackDesiCalories
                </span>
                <p className="text-sm text-foreground">{row.ours}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Named, with credit where it's due */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RIVALS.map((r) => (
            <div
              key={r.name}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold">vs {r.name}</h3>
              <p className="text-sm text-muted-foreground">{r.good}</p>
              <p className="border-t border-border pt-3 text-sm text-foreground">
                {r.gap}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
          If you mostly eat packaged or restaurant food, a big database may
          serve you better. This is built for the meals those apps handle worst
          — the ones cooked in a South Asian kitchen, where the ghee is
          invisible and the portion is whatever fit on the plate.
        </p>
      </div>
    </section>
  );
}
