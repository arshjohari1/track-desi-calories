import Image from "next/image";
import { Comparison } from "~/components/comparison";
import { ContactMenu } from "~/components/contact-menu";
import { InteractiveLanding } from "~/components/interactive-landing";
import { RotatingPhrase } from "~/components/rotating-phrase";

/**
 * The hero shot: a real result screen, not a mockup.
 *
 * This replaced a hand-built fake card showing invented numbers for a dish the
 * app had never analysed. A genuine screenshot is a stronger claim and can't
 * drift away from what the product actually renders.
 *
 * `priority` because it's the largest above-the-fold image — without it Next
 * lazy-loads it and it arrives after first paint.
 */
function HeroScreenshot() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border shadow-2xl">
      <Image
        src="/screens/macros.png"
        alt="A finished scan in TrackDesiCalories: rajma chawal at 550 kcal with protein, carbs, fat, fiber and sugar, a high-confidence badge, and the assumptions behind the estimate"
        width={1132}
        height={763}
        priority
        className="h-auto w-full"
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-orange-50 dark:bg-orange-950/20 min-h-screen">
      {/* Hero */}
      <section className="px-4 py-12 sm:px-6 sm:py-20 lg:px-16 xl:px-24">
        {/* Capped so the hero stops stretching on ultra-wide displays, where it
            was running to ~1700px while every other section caps at max-w-6xl.
            Viewports up to ~1470px are unaffected. */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[2fr_3fr] lg:gap-12">
          {/* Left */}
          <div className="flex flex-col gap-6">
            {/* Brand orange. `orange-700` rather than the `orange-600` used for
                buttons: 600 sits too close to the warm section background to
                read as an accent. */}
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
              Made for South Asian home cooking
            </span>
            <RotatingPhrase />
            <p className="text-lg text-muted-foreground max-w-md">
              Upload a meal photo, answer a few cooking questions, and get an
              accurate calorie count for real desi food — from dal tadka to
              chicken curry to aloo paratha.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <a
                href="#how-it-works"
                className="rounded-lg border border-border bg-background px-6 py-3 text-center font-semibold text-foreground transition-colors hover:bg-muted"
              >
                See how it works
              </a>
              <a
                href="/signup"
                className="rounded-lg bg-orange-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Get started
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for South Asian fitness enthusiasts who need calorie counts
              they can actually trust.
            </p>
          </div>

          {/* Right — real result screen */}
          <HeroScreenshot />
        </div>
      </section>

      <InteractiveLanding />

      <Comparison />

      {/* CTA — warm tint keeps the section colours alternating: hero (warm),
          how it works (plain), features (warm), comparison (plain), this (warm).
          No border-t needed now; the colour change is the separator. */}
      <section className="bg-orange-50 py-16 text-center sm:py-24 dark:bg-orange-950/20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to track your desi meals?
          </h2>
          <p className="mb-8 text-base text-muted-foreground sm:mb-10 sm:text-lg">
            Stop guessing calories for dal, roti, and sabzi. Get accurate counts
            built around how South Asian food is actually cooked.
          </p>
          <a
            href="/signup"
            className="inline-block rounded-lg bg-orange-600 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-orange-700 sm:text-lg"
          >
            Get started free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:px-6 md:flex-row md:text-left">
          <div className="flex items-center gap-2 font-bold">
            <span>🍛</span>
            <span>TrackDesiCalories</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Desi food, accurately counted.
          </p>
          {/* Privacy and Terms were plain <span>s with nothing behind them —
              they looked like links and did nothing, so they're gone until
              there are real pages to point at. */}
          <ContactMenu />
        </div>
      </footer>
    </div>
  );
}
