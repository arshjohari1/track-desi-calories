"use client";

import { useEffect, useId, useRef, useState } from "react";

const EMAIL = "arshjohari1@gmail.com";
const PHONE_DISPLAY = "+1-858-305-7762";
const PHONE_HREF = "tel:+18583057762";

/**
 * Footer contact popover.
 *
 * Opens *upward* (`bottom-full`) rather than downward — it lives in the page
 * footer, so a downward panel would render past the end of the document.
 *
 * `mailto:` / `tel:` links rather than a contact form: there's no backend to
 * receive a form submission, and a form that silently goes nowhere is exactly
 * the kind of dead control we removed Privacy and Terms for.
 */
export function ContactMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        className="rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Contact
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-xl border border-border bg-card p-3 text-left shadow-lg"
        >
          <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">
            Get in touch
          </p>
          <a
            href={`mailto:${EMAIL}`}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
          >
            <span aria-hidden="true">✉️</span>
            <span className="truncate">{EMAIL}</span>
          </a>
          <a
            href={PHONE_HREF}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
          >
            <span aria-hidden="true">📞</span>
            <span>{PHONE_DISPLAY}</span>
          </a>
        </div>
      )}
    </div>
  );
}
