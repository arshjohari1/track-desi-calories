"use client";

import { useEffect, useRef, useState } from "react";

type TableData = {
  cols: string[];
  rows: string[][];
};

type ContentSection = {
  heading?: string;
  body?: string;
  items?: string[];
  table?: TableData;
};

type SidebarData = {
  label: string;
  title: string;
  subtitle: string;
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

const steps: StepItem[] = [
  {
    n: "1",
    title: "Upload a food photo",
    desc: "Take a photo of your meal — dal, roti, sabzi, whatever's on the plate.",
    sidebar: {
      label: "STEP 1",
      title: "Upload a food photo",
      subtitle: "AI-powered dish recognition for South Asian cuisine",
      sections: [
        {
          body: 'Take a photo of your meal and our AI identifies the dish. From dal makhani to aloo gobi, it recognises hundreds of South Asian dishes — not just a generic "curry."',
        },
        {
          heading: "Tips for best results",
          items: [
            "Top-down or 45° angle shots work best",
            "Natural lighting gives more accurate recognition",
            "Include the full portion you plan to eat",
            "Works with plated meals, thali setups, and tiffin boxes",
          ],
        },
      ],
    },
  },
  {
    n: "2",
    title: "Answer cooking questions",
    desc: "Tell us the oil, ghee, and serving size. The things generic apps ignore that actually change the count.",
    sidebar: {
      label: "STEP 2",
      title: "Answer cooking questions",
      subtitle: "The details generic apps skip that actually change your count",
      sections: [
        {
          body: "Most apps look up a dish and return a generic number. But the same chicken curry can vary by 300+ kcal depending on how it was made. We ask the questions that matter.",
        },
        {
          heading: "Questions we ask",
          table: {
            cols: ["Question", "Why it matters"],
            rows: [
              [
                "What oil was used?",
                "Mustard oil vs ghee — ~120 kcal per tbsp difference",
              ],
              [
                "How many servings?",
                "Home portions rarely match app serving sizes",
              ],
              [
                "Ghee added after?",
                "Finishing ghee is a common +50–150 kcal that apps miss",
              ],
              [
                "Cooking method?",
                "Pressure cooker vs stovetop affects oil absorption",
              ],
            ],
          },
        },
      ],
    },
  },
  {
    n: "3",
    title: "Get calories and save",
    desc: "Receive an accurate count calibrated for home-style preparation, then save it to your daily log.",
    sidebar: {
      label: "STEP 3",
      title: "Get calories and save",
      subtitle: "Your log, built around how you actually eat",
      sections: [
        {
          body: "Get a calibrated calorie estimate built from your photo and cooking answers. Save it to your daily log instantly — stored with full cooking details, not just a number.",
        },
        {
          heading: "What gets saved",
          items: [
            "Dish name and photo",
            "Full cooking details (oil, ghee, servings)",
            "Calibrated calorie estimate",
            "Option to add to your Kitchen for faster future logging",
          ],
        },
      ],
    },
  },
];

const features: FeatureItem[] = [
  {
    icon: "🎯",
    title: "Calibrate recipes, not guesses",
    desc: "Fine-tune calorie counts for the exact oil, finishing ghee, and serving size your household actually uses.",
    sidebar: {
      label: "FEATURE",
      title: "Calibrate recipes, not guesses",
      subtitle: "Fine-tune every variable that changes your count",
      sections: [
        {
          body: "Generic calorie databases use average restaurant-style recipes. Your kitchen is different — the oil you use, how much ghee you add, and how many you're cooking for all shift the number significantly.",
        },
        {
          heading: "What you can calibrate",
          items: [
            "Oil type and quantity (mustard, coconut, refined, ghee)",
            "Finishing ghee or butter",
            "Serving size relative to the full dish",
            "Cooking method (affects fat absorption)",
          ],
        },
        {
          heading: "Typical variation",
          body: "The same dal tadka can range from 180 kcal to 420 kcal per serving depending on these variables. TrackDesiCalories accounts for all of them.",
        },
      ],
    },
  },
  {
    icon: "🍳",
    title: "Save your Kitchen",
    desc: "Store repeating dish specs so your everyday meals are faster to log next time — no re-entering every detail.",
    sidebar: {
      label: "FEATURE",
      title: "Save your Kitchen",
      subtitle: "Your personal desi recipe database",
      sections: [
        {
          body: "Your Kitchen stores the cooking specs for your regular dishes. Once you've logged Mom's chicken curry with its exact oil and ghee details, you can pull it up next time in seconds.",
        },
        {
          heading: "How it works",
          items: [
            "Log a meal for the first time",
            "Save it to your Kitchen with a name",
            "Pull it from your Kitchen the next time you eat that dish",
            "Edit saved specs anytime if your recipe changes",
          ],
        },
      ],
    },
  },
  {
    icon: "📊",
    title: "Track full days",
    desc: "Save meal logs and day totals so you can review progress over time and stay on top of your goals.",
    sidebar: {
      label: "FEATURE",
      title: "Track full days",
      subtitle: "See whether you're actually hitting your goals",
      sections: [
        {
          body: "Every logged meal contributes to your day total. Check your running calorie count at any point, review past days, and spot patterns in your eating.",
        },
        {
          heading: "What you can track",
          items: [
            "Daily calorie totals vs your goal",
            "Meal-by-meal breakdown for the day",
            "History of past days",
            "Streaks and consistency over time",
          ],
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
        className="fixed inset-0 z-40 bg-black/30"
        aria-hidden="true"
        style={{
          opacity: entered ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-[500px] overflow-y-auto border-l border-border bg-background shadow-2xl"
        style={{
          transform: entered ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={data.title}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-start justify-between border-b border-border bg-background p-6">
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
        <div className="space-y-6 p-6">
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
                      <span className="mt-0.5 shrink-0 text-teal-600">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.table && (
                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        {section.table.cols.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-2.5 text-left text-xs font-semibold text-foreground"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row) => (
                        <tr key={row[0]} className="border-t border-border">
                          {row.map((cell) => (
                            <td
                              key={cell}
                              className={`px-4 py-3 text-xs ${row.indexOf(cell) === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
      <section id="how-it-works" className="bg-background py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-16 text-center text-4xl font-bold tracking-tight">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {steps.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => setActiveSidebar(s.sidebar)}
                className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
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
      <section id="features" className="bg-orange-50 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-16 text-center text-4xl font-bold tracking-tight">
            Why it works for desi food
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((f) => (
              <button
                key={f.title}
                type="button"
                onClick={() => setActiveSidebar(f.sidebar)}
                className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
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
