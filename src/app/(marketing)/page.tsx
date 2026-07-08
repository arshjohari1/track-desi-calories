import Image from "next/image";
import { InteractiveLanding } from "~/components/interactive-landing";
import { RotatingPhrase } from "~/components/rotating-phrase";

function MealMockup() {
  return (
    <div className="w-full">
      <div className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">←</span>
            <span className="font-semibold text-sm">Dinner log</span>
          </div>
          <span className="text-muted-foreground tracking-widest">···</span>
        </div>

        {/* Body */}
        <div className="flex">
          {/* Photo */}
          <div className="w-[38%] border-r border-border flex-shrink-0">
            <div className="aspect-[3/4] overflow-hidden">
              <Image
                src="/chicken-curry.jpg"
                alt="Chicken curry with basmati rice"
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Cooking details */}
          <div className="w-[38%] border-r border-border flex-shrink-0 p-4">
            <p className="text-xs font-semibold mb-3">Cooking details</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">
                  What oil was used?
                </p>
                <div className="flex items-center justify-between rounded border border-border bg-muted px-2 py-1.5 text-xs">
                  <span>Mustard oil</span>
                  <span className="text-muted-foreground">↓</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">
                  How many servings?
                </p>
                <div className="rounded border border-border bg-background px-2 py-1.5 text-xs">
                  1.5 servings
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">
                  Ghee added after cooking?
                </p>
                <div className="rounded border border-border bg-background px-2 py-1.5 text-xs">
                  Yes, 1 tsp
                </div>
              </div>
            </div>
          </div>

          {/* Calorie estimate */}
          <div className="flex-1 p-4 flex flex-col">
            <p className="text-[10px] text-muted-foreground mb-2">
              Estimated calories
            </p>
            <div className="text-4xl font-bold text-orange-600 leading-none">
              612
            </div>
            <div className="text-xs font-semibold text-orange-600 mb-2">
              kcal
            </div>
            <div className="flex items-start gap-1 mb-auto">
              <span className="text-teal-600 text-xs leading-none mt-px">
                ✓
              </span>
              <span className="text-[10px] text-teal-600 leading-tight">
                Calibrated for home-style prep
              </span>
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-orange-600 text-white py-2 text-xs font-semibold"
            >
              Save meal
            </button>
            <button
              type="button"
              className="mt-1.5 w-full rounded-lg border border-border py-2 text-xs text-foreground"
            >
              Restart
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/40">
          <p className="font-medium text-sm">Chicken curry with basmati rice</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-bold text-orange-600">612 kcal</span>
            <span className="text-muted-foreground text-xs">
              · Saved to Kitchen: Mom's Chicken Curry Recipe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-orange-50 min-h-screen">
      {/* Hero */}
      <section className="px-6 py-20 lg:px-16 xl:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 items-center">
          {/* Left */}
          <div className="flex flex-col gap-6">
            <span className="text-sm font-semibold text-teal-700">
              Made for South Asian home cooking
            </span>
            <RotatingPhrase />
            <p className="text-lg text-muted-foreground max-w-md">
              Upload a meal photo, answer a few cooking questions, and get an
              accurate calorie count for real desi food — from dal tadka to
              chicken curry to aloo paratha.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#how-it-works"
                className="rounded-lg border border-border bg-background px-6 py-3 font-semibold text-foreground hover:bg-muted transition-colors"
              >
                See how it works
              </a>
              <a
                href="/signup"
                className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 transition-colors"
              >
                Get started
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for South Asian fitness enthusiasts who need calorie counts
              they can actually trust.
            </p>
          </div>

          {/* Right — mockup */}
          <MealMockup />
        </div>
      </section>

      <InteractiveLanding />

      {/* CTA */}
      <section className="bg-background py-24 text-center">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Ready to track your desi meals?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Stop guessing calories for dal, roti, and sabzi. Get accurate counts
            built around how South Asian food is actually cooked.
          </p>
          <a
            href="/signup"
            className="rounded-lg bg-orange-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-orange-700"
          >
            Get started free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold">
            <span>🍛</span>
            <span>TrackDesiCalories</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Desi food, accurately counted.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
