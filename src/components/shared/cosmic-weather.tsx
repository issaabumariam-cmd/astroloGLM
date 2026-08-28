"use client";

import { useState, useEffect } from "react";
import { Cloud, ChevronDown, ChevronUp } from "lucide-react";

type TransitItem = {
  id: string;
  icon: string;
  text: string;
  detail?: string;
  personal?: boolean;
};

type CosmicWeatherData = {
  date: string;
  items: TransitItem[];
};

export function CosmicWeatherCard({
  mode,
  chartData,
  onAskTransit,
  defaultOpen,
}: {
  mode: "echo" | "deep-echo";
  chartData?: { sun?: { signName: string } } | null;
  onAskTransit?: (question: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? (mode === "deep-echo"));
  const [weather, setWeather] = useState<CosmicWeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      try {
        const params = new URLSearchParams();
        if (chartData?.sun?.signName) {
          params.set("sign", chartData.sun.signName);
        }
        const res = await fetch(`/api/transits?${params}`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (cancelled) return;
        const items: TransitItem[] = [];

        // Parse transits data
        if (data.transits && Array.isArray(data.transits)) {
          data.transits.slice(0, 3).forEach((t: { transitPlanet?: string; aspectType?: string; natalPlanet?: string; description?: string }, i: number) => {
            items.push({
              id: `transit-${i}`,
              icon: "⚠",
              text: t.description || `${t.transitPlanet} ${t.aspectType} ${t.natalPlanet || ""}`.trim(),
              personal: !!chartData,
            });
          });
        }

        // Parse retrogrades
        if (data.retrogrades && Array.isArray(data.retrogrades) && data.retrogrades.length > 0) {
          items.push({
            id: "retrograde",
            icon: "℞",
            text: `${data.retrogrades.join(", ")} retrograde`,
          });
        }

        // Parse upcoming events if available
        if (data.upcomingEvents && Array.isArray(data.upcomingEvents)) {
          data.upcomingEvents.slice(0, 2).forEach((e: { event_type?: string; date?: string; description?: string }, i: number) => {
            items.push({
              id: `event-${i}`,
              icon: e.event_type?.includes("moon") ? "◐" : "✦",
              text: e.description || `${e.event_type} ${e.date || ""}`.trim(),
            });
          });
        }

        // Fallback: if no items, show a generic message
        if (items.length === 0) {
          items.push({
            id: "default",
            icon: "☁",
            text: "The sky is quiet today — a good time for reflection.",
          });
        }

        if (!cancelled) {
          setWeather({ date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }), items });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setWeather({ date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }), items: [{ id: "err", icon: "☁", text: "Cosmic weather unavailable" }] });
          setLoading(false);
        }
      }
    };
    fetchWeather();
    return () => { cancelled = true; };
  }, [chartData?.sun?.signName]);

  if (loading || !weather) return null;

  return (
    <div className="mb-3 rounded-lg border border-border bg-surface/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs text-foreground-muted transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <Cloud className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">Cosmic Weather — {weather.date}</span>
          {mode === "deep-echo" && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] text-primary">Your chart</span>
          )}
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          {weather.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onAskTransit?.(`Tell me about: ${item.text}`)}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <span className="shrink-0 text-sm">{item.icon}</span>
              <span className="flex-1">
                {item.text}
                {item.personal && <span className="ml-1 text-[9px] text-primary">→ your chart</span>}
              </span>
            </button>
          ))}
          {onAskTransit && (
            <p className="pt-1 text-[10px] text-foreground-subtle">Tap any transit to ask Jehana about it</p>
          )}
        </div>
      )}
    </div>
  );
}