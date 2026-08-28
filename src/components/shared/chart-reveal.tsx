"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { zodiacSigns, getSignById, elementColors } from "@/lib/astrology/signs";

type ChartPreview = {
  sun: { sign: string; degrees: number; glyph: string };
  moon: { sign: string; degrees: number; glyph: string };
  rising: { sign: string; degrees: number; glyph: string };
  birthDateOnly: boolean;
};

export function ChartReveal({
  chart,
  onAddTime,
  onContinueWithoutTime,
}: {
  chart: ChartPreview;
  onAddTime?: () => void;
  onContinueWithoutTime?: () => void;
}) {
  const [revealedCount, setRevealedCount] = useState(0);

  // If birth time was provided, reveal all three sequentially.
  // If not, reveal Sun only (always accurate).
  const hasFullChart = !chart.birthDateOnly;
  const totalToReveal = hasFullChart ? 3 : 1;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealedCount(0);
    let idx = 0;
    let recurTimer: ReturnType<typeof setTimeout>;
    const reveal = () => {
      idx++;
      setRevealedCount(idx);
      if (idx < totalToReveal) {
        recurTimer = setTimeout(reveal, 500);
      }
    };
    const timer = setTimeout(reveal, 300);
    return () => {
      clearTimeout(timer);
      if (recurTimer) clearTimeout(recurTimer);
    };
  }, [totalToReveal]);

  const items = [
    { label: "Sun", data: chart.sun, alwaysShow: true },
    { label: "Moon", data: chart.moon, alwaysShow: hasFullChart },
    { label: "Rising", data: chart.rising, alwaysShow: hasFullChart },
  ];

  return (
    <div className="card p-6">
      <p className="mb-4 text-center text-xs uppercase tracking-[0.125em] text-primary">Your Cosmic Blueprint</p>
      <div className="flex items-center justify-around">
        {items.map((item, i) => {
          if (!item.alwaysShow) return null;
          const isRevealed = i < revealedCount;
          const sign = getSignById(item.data.sign.toLowerCase()) || zodiacSigns.find((s) => s.name === item.data.sign);
          return (
            <div key={item.label} className="text-center">
              {isRevealed ? (
                <>
                  <div
                    className="reveal-glyph mx-auto flex h-14 w-14 items-center justify-center rounded-full text-3xl"
                    style={{ background: `${elementColors[sign?.element || "Fire"]}15`, animationDelay: `${i * 0.4}s` }}
                  >
                    {item.data.glyph}
                  </div>
                  <div className="reveal-fade" style={{ animationDelay: `${i * 0.4 + 0.2}s` }}>
                    <p className="mt-2 text-xs uppercase tracking-[0.125em] text-primary">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground">{item.data.sign}</p>
                    <p className="text-xs text-foreground-subtle">{item.data.degrees}°</p>
                  </div>
                </>
              ) : (
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted">
                  <span className="text-2xl text-foreground-subtle">✧</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Curiosity hook when birth time is missing */}
      {!hasFullChart && revealedCount >= 1 && (
        <div className="reveal-fade mt-4 rounded-lg border border-warning/30 bg-warning/5 p-4 text-center" style={{ animationDelay: "0.8s" }}>
          <p className="text-sm text-foreground-muted">
            I can see your <strong className="text-foreground">{chart.sun.sign}</strong> Sun clearly —
            that&apos;s your core, your vitality.
          </p>
          <p className="mt-2 text-sm text-foreground-muted">
            For your <strong className="text-foreground">Moon</strong> and <strong className="text-foreground">Rising</strong> —
            the parts that shape your inner world — I&apos;d need your birth time.
          </p>
          <div className="mt-3 flex justify-center gap-3">
            {onAddTime && (
              <button onClick={onAddTime} className="btn-primary text-sm">
                <Sparkles className="h-3.5 w-3.5" /> Add birth time →
              </button>
            )}
            {onContinueWithoutTime && (
              <button onClick={onContinueWithoutTime} className="btn-ghost text-sm">
                Continue with Sun only
              </button>
            )}
          </div>
        </div>
      )}

      {hasFullChart && revealedCount >= 3 && (
        <p className="reveal-fade mt-3 text-center text-xs text-foreground-subtle" style={{ animationDelay: "1.2s" }}>
          The universe placed every planet the moment you arrived.
        </p>
      )}
    </div>
  );
}