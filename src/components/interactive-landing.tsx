"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type ContentSection = {
  heading?: string;
  body?: string;
  items?: string[];
};

/** A real app screenshot shown at the top of a panel. */
type SidebarImage = {
  src: string;
  alt: string;
  /** Intrinsic pixel size of the file, so Next can reserve the space. */
  width: number;
  height: number;
  /** Shown above the image. Used to label the halves of a before/after pair. */
  caption?: string;
};

type SidebarData = {
  label: string;
  title: string;
  subtitle: string;
  /**
   * Stacked, not side by side. The panel is 500px wide, so two screenshots in a
   * row would leave each about 215px — the kcal figure would survive but the
   * macro tiles and assumptions would not.
   */
  images?: SidebarImage[];
  sections: ContentSection[];
};

type StepItem = {
  n: string;
  title: string;
  desc: string;
  sidebar: SidebarData;
};

type FeatureItem = {
  icon: string;
  title: string;
  desc: string;
  sidebar: SidebarData;
};

/**
 * Panel copy is deliberately written against what the app actually does.
 *
 * The previous version claimed things that were never built (editing a saved
 * Kitchen dish, logging streaks) and presented the follow-up questions as a fixed
 * four-row table when they're generated per dish — so a visitor who read it and
 * then used the app saw something different. It also only ever mentioned
 * calories, while the app returns a full macro breakdown, and never mentioned
 * nutrition-label scanning at all.
 *
 * Rule of thumb when editing: describe the *kind* of thing the model asks and
 * why it varies. Naming exact questions goes stale the moment the prompt changes.
 */
const steps: StepItem[] = [
  {
    n: "1",
    title: "Upload a food photo",
    desc: "Take a photo of your meal — dal, roti, sabzi, whatever's on the plate. Packaged food? Scan the label instead.",
    sidebar: {
      label: "STEP 1",
      title: "Upload a food photo",
      subtitle: "Or scan a nutrition label for anything packaged",
      images: [
        {
          src: "/screens/identify.png",
          alt: "The scan screen reading a photo of rajma chawal, with the status 'Identifying your dish'",
          width: 1118,
          height: 599,
        },
      ],
      sections: [
        {
          body: "Take a photo of your plate and the app identifies the dish, works out whether it's South Asian, and tells you how confident it is in that match. For packaged food, switch to the Nutrition label tab — it reads the macros straight off the panel instead of estimating them.",
        },
        {
          heading: "What comes back straight away",
          items: [
            "The dish name and cuisine, plus a line describing what it sees on the plate",
            "A dish-match confidence rating, so you know whether to trust the identification",
            "Follow-up questions picked for that specific dish",
            "JPG, PNG or WebP — drag and drop, or choose a file",
          ],
        },
      ],
    },
  },
  {
    n: "2",
    title: "Answer cooking questions",
    desc: "A few taps about oil, ghee and portion — the things generic apps ignore that actually change the count.",
    sidebar: {
      label: "STEP 2",
      title: "Answer cooking questions",
      subtitle: "Multiple choice, three to six of them, different every dish",
      images: [
        {
          src: "/screens/questions.png",
          alt: "Four multiple-choice questions about the rajma chawal: serving size, cooking fat, gravy richness, and how the rice was prepared",
          width: 1103,
          height: 850,
        },
      ],
      sections: [
        {
          body: "A calorie database assumes a restaurant recipe. These questions are generated for the dish in your photo, so it only asks about things that genuinely move this meal's numbers — never more than six. Every question is multiple choice, so it's a few taps rather than a form to fill in.",
        },
        {
          heading: "The kind of thing it asks about",
          items: [
            "Portion — always asked, in terms you can eyeball on your own plate",
            "Which cooking fat and how much: ghee, oil, butter, or none at all",
            "How rich the gravy is — cream, malai, cashew or almond paste, yogurt, or just tomato",
            "Whether it was deep-fried, shallow-fried, or not fried",
            "Added sugar, for sweets and chai",
            'Typing only if you pick "Other (please specify)"',
          ],
        },
        {
          heading: "It changes with the dish",
          body: "Rajma chawal gets asked about the rice and how rich the gravy was. Instant noodles gets asked how many blocks, what went in with them, and how much liquid was left. Nothing irrelevant to what's actually on your plate.",
        },
      ],
    },
  },
  {
    n: "3",
    title: "Get macros and save",
    desc: "Calories plus protein, carbs, fat, fiber and sugar — with the assumptions behind them shown.",
    sidebar: {
      label: "STEP 3",
      title: "Get macros and save",
      subtitle: "Calories and the full breakdown, with its reasoning shown",
      images: [
        {
          src: "/screens/compare-lean.png",
          alt: "Result for rajma chawal: 380 kcal with protein, carbs, fat, fiber and sugar, a confidence badge, and the list of assumptions behind the estimate",
          width: 1100,
          height: 755,
        },
      ],
      sections: [
        {
          body: "You get calories plus protein, carbs, fat, fiber and sugar for the portion you described — not per 100 g. Each estimate carries a confidence rating and the list of assumptions behind it, so you can see why the number is what it is instead of taking it on trust.",
        },
        {
          heading: "What you get",
          items: [
            "Calories and five macros: protein, carbs, fat, fiber and sugar",
            'The portion it actually priced, written out — "1.5 cups rice with 1 cup rajma"',
            "A confidence rating for the numbers themselves",
            '"What we assumed" — the specific calls it made about fat, portion and prep',
          ],
        },
        {
          heading: "If something looks off",
          body: "Adjust answers re-runs the estimate with different answers and no new photo. Log this meal writes it to your day, and Add to Kitchen keeps the dish for one-tap logging later.",
        },
      ],
    },
  },
];

const features: FeatureItem[] = [
  {
    icon: "🎯",
    title: "Built for how your kitchen cooks",
    desc: "The same dish swings hundreds of calories on fat, richness and portion. Those are exactly what it asks you about.",
    sidebar: {
      label: "FEATURE",
      title: "Built for how your kitchen cooks",
      subtitle:
        "Your ghee, your portions, your gravy — not a restaurant average",
      // Two real results for the same dish at the same portion, differing only
      // in the cooking-fat answers. This is the one panel where the screenshots
      // prove the claim rather than illustrating it, so both halves are shown
      // and each caption names the fat it was given.
      images: [
        {
          src: "/screens/compare-lean.png",
          alt: "Rajma chawal at 380 kcal — one cup of rice with half a cup of curry, cooked with very little fat and no cream",
          width: 1100,
          height: 755,
          caption: "Barely any cooking fat, no cream — about 3 g of fat",
        },
        {
          src: "/screens/compare-rich.png",
          alt: "The same dish and portion at 490 kcal — a moderate oil sheen with cream added, about 20 g of fat",
          width: 1106,
          height: 771,
          caption: "Moderate oil and a little cream — about 20 g of fat",
        },
      ],
      sections: [
        {
          body: "A calorie database gives you one number for 'rajma chawal'. But whether the rajma was cooked in ghee or no fat at all, whether the gravy had cream in it, and how much rice is on the plate all move that number a long way. Those are the things you get asked before it commits to an estimate.",
        },
        {
          heading: "Same plate, different ghee",
          // This pair is genuinely controlled — identical portion answers, only
          // the fat questions changed — so the copy can attribute the gap to the
          // fat. Don't reuse this wording if the screenshots are ever swapped for
          // a pair whose portions differ.
          body: "Both screenshots above are the same dish at the same portion: one cup of rice with half a cup of rajma. The only thing that changed is the answers about cooking fat — barely any in the first, a moderate oil sheen with a little cream in the second. 380 kcal against 490. A single database entry for 'rajma chawal' would have handed you one number for both.",
        },
        {
          heading: "What moves the number most",
          items: [
            "Cooking fat — ghee and oil are the biggest hidden calorie source in home cooking",
            "Gravy richness — cream, malai and nut pastes shift fat and calories sharply",
            "Frying — deep-fried, shallow-fried, or not fried at all",
            "Portion — home servings rarely match a database's idea of one serving",
          ],
        },
        {
          heading: "And it shows its work",
          body: "Every result lists the assumptions it made. If one of them is wrong for your kitchen, Adjust answers re-runs the estimate — you're never stuck with a number you can't interrogate.",
        },
      ],
    },
  },
  {
    icon: "🍳",
    title: "Save your Kitchen",
    desc: "Keep the dishes you eat again and again, then log them next time in a single tap — no photo, no questions.",
    sidebar: {
      label: "FEATURE",
      title: "Save your Kitchen",
      subtitle: "One tap to log the meals you eat all the time",
      images: [
        {
          src: "/screens/kitchen.png",
          alt: "The Kitchen page with three saved dishes — rajma chawal, paneer bhurji and Maggi noodles — each showing its macros and a one-tap log button",
          width: 1155,
          height: 526,
        },
      ],
      sections: [
        {
          body: "Save a dish after a scan — or from any row in your logs — and it lands in your Kitchen with its macros, its portion and the answers you gave. Next time you eat it, logging takes one tap: no photo, no questions.",
        },
        {
          heading: "How it works",
          items: [
            "Scan a meal, tap Add to Kitchen, and give it a name",
            "The dish keeps its macros, portion, prep answers and assumptions",
            "Tap Log on the dish to add it to today — from the Kitchen page or straight off your dashboard",
            "It tracks how many times you've logged it",
          ],
        },
        {
          heading: "One thing to know",
          body: "A saved dish is a snapshot of one scan, for the portion shown, and there's no editing it afterwards. If today's serving is much bigger or smaller, scan it fresh instead — and delete the saved one if it's no longer how you cook it.",
        },
      ],
    },
  },
  {
    icon: "📊",
    title: "Track full days",
    desc: "Day totals, macro breakdowns and every day you've logged, kept straight in your own time zone.",
    sidebar: {
      label: "FEATURE",
      title: "Track full days",
      subtitle: "Day totals, macro breakdowns, and your whole history",
      images: [
        {
          src: "/screens/logs.png",
          alt: "The Logs page grouped by day — Today, Yesterday and Wednesday — each with its meal count and calorie total",
          width: 959,
          height: 783,
        },
      ],
      sections: [
        {
          body: "Your dashboard shows today's calories against your target, the macros you've eaten so far, and the meals behind them. Logs keeps the full history grouped by day, each with its own total.",
        },
        {
          heading: "What you can see",
          items: [
            "Today's calories against the daily target from your setup",
            "The day's macros — protein, carbs, fat, fiber and sugar",
            "Every meal in the day with its time, portion and macros",
            "Past days, grouped with per-day totals, from the date picker or Logs",
          ],
        },
        {
          heading: "Kept straight across time zones",
          body: "Days start and end in your time zone, so a late dinner counts toward the right day even when the server sits somewhere else.",
        },
      ],
    },
  },
];

function SidebarPanel({
  data,
  onClose,
}: {
  data: SidebarData;
  onClose: () => void;
}) {
  const [entered, setEntered] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setEntered(false);
      setTimeout(() => onCloseRef.current(), 300);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    if (!entered) return;
    setEntered(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60"
        aria-hidden="true"
        style={{
          opacity: entered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        // `dark:bg-card` matters: on a dark page the panel and the dimmed page
        // behind it are the same near-black, so without the raised card tone the
        // only thing separating them is the 1px left border.
        className="fixed right-0 top-0 z-50 h-full w-full max-w-[500px] overflow-y-auto border-l border-border bg-background shadow-2xl dark:bg-card"
        style={{
          transform: entered ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={data.title}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between border-b border-border bg-background p-5 sm:p-6 dark:bg-card">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-widest text-muted-foreground">
              {data.label}
            </p>
            <h2 className="text-2xl font-bold leading-tight text-foreground">
              {data.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="ml-4 mt-1 shrink-0 text-xl text-muted-foreground transition-colors hover:text-foreground"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-5 sm:p-6">
          {data.images?.map((img) => (
            // Framed rather than bare: these are light-mode captures, so on a
            // dark page an unbordered screenshot reads as a glowing rectangle.
            <figure key={img.src} className="flex flex-col gap-2">
              {img.caption && (
                <figcaption className="text-xs font-medium text-muted-foreground">
                  {img.caption}
                </figcaption>
              )}
              <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  // Eager, not lazy. The panel only mounts when it's opened, so
                  // the image is always about to be needed — but it slides in
                  // over 300ms, and lazy loading waits for it to intersect the
                  // viewport before even starting the request, which shows a
                  // blank frame.
                  loading="eager"
                  className="h-auto w-full"
                />
              </div>
            </figure>
          ))}

          {data.sections.map((section) => (
            <div key={section.heading ?? section.body}>
              {section.heading && (
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
                  {section.heading}
                </h3>
              )}
              {section.body && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              )}
              {section.items && (
                <ul className="mt-2 space-y-2">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function InteractiveLanding() {
  const [activeSidebar, setActiveSidebar] = useState<SidebarData | null>(null);

  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="bg-background py-16 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:mb-16 sm:text-4xl">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-3">
            {steps.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => setActiveSidebar(s.sidebar)}
                className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-orange-200 hover:shadow-md sm:p-8 dark:hover:border-orange-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-600 text-base font-bold text-white">
                    {s.n}
                  </div>
                  <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    Learn more →
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="text-base text-muted-foreground">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="bg-orange-50 py-16 sm:py-28 dark:bg-orange-950/20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:mb-16 sm:text-4xl">
            Why it works for desi food
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {features.map((f) => (
              <button
                key={f.title}
                type="button"
                onClick={() => setActiveSidebar(f.sidebar)}
                className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-orange-200 hover:shadow-md sm:p-8 dark:hover:border-orange-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{f.icon}</span>
                  <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                    Learn more →
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="text-base text-muted-foreground">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeSidebar && (
        <SidebarPanel
          data={activeSidebar}
          onClose={() => setActiveSidebar(null)}
        />
      )}
    </>
  );
}
