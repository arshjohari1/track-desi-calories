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
    <h1 className="text-5xl font-bold tracking-tight leading-[1.2] min-h-[10.8rem]">
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
