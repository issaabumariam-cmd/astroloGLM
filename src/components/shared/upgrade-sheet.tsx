"use client";

import { useState, useEffect } from "react";
import { Crown, X, Check } from "lucide-react";

export function UpgradeSheet({
  open,
  onClose,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimateIn(false);
  }, [open]);

  if (!open) return null;

  const features = [
    "Unlimited Deep Echo conversations",
    "Full birth chart interpretation (houses, aspects, planets)",
    "AI horoscopes (daily, weekly, monthly)",
    "Deep compatibility readings",
    "Complete astrology library access",
    "Save your chart + chat history across devices",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 ${animateIn ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`relative z-10 w-full max-w-md rounded-t-2xl bg-surface border border-border shadow-lifted transition-transform duration-300 ${
          animateIn ? "translate-y-0" : "translate-y-full sm:translate-y-8"
        }`}
      >
        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-border-strong" />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1.5 text-foreground-subtle hover:bg-surface-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <h2 className="heading-serif mt-4 text-xl font-semibold text-foreground">
            You&apos;ve barely begun
          </h2>
          <p className="mt-2 text-sm text-foreground-muted text-balance">
            The universe placed ten planets in twelve houses the moment you arrived —
            each one a story. Jehana has only read the first page.
          </p>

          <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground-muted">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={onAccept}
            className="btn-primary mt-6 w-full"
          >
            <Crown className="h-4 w-4" />
            Unlock Deep Echo — £5.99/month
          </button>
          <button
            onClick={onClose}
            className="btn-ghost mt-2 text-xs"
          >
            Or keep chatting in Echo mode →
          </button>
          <p className="mt-3 text-[10px] text-foreground-subtle">
            Cancel anytime. Your birth data stays sacred.
          </p>
        </div>
      </div>
    </div>
  );
}