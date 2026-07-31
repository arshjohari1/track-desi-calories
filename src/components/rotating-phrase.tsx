"use client";

import { useEffect, useState } from "react";

const phrases = [
  "Know your biryani's calories,",
  "Track your mum's recipes,",
  "Log every roti and sabzi,",
  "Understand what you're eating,",
];

export function RotatingPhrase() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % phrases.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    // "TrackDesiCalories." is a single unbreakable word ~8.8em wide, so the font
    // size — not wrapping — is what decides whether the hero fits. At 48px it
    // needed 424px and blew a 320px viewport out by 128px, so the ramp starts at
    // 30px. min-height is reserved per step to stop the rotation shifting the
    // page as phrases of different lengths swap in.
    <h1 className="min-h-[9rem] text-3xl font-bold leading-[1.2] tracking-tight sm:min-h-[10rem] sm:text-4xl lg:min-h-[10.8rem] lg:text-5xl">
      <span
        className="block"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        {phrases[index]}
      </span>
      <span className="block text-orange-600">all with TrackDesiCalories.</span>
    </h1>
  );
}
