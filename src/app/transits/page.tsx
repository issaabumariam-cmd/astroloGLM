"use client";

import { useState, useEffect } from "react";
import { Eyebrow, Card, Tag } from "@/components/shared/ui-primitives";
import { AlertCircle, Loader2 } from "lucide-react";

type PlanetData = {
  name: string;
  id: string;
  sign: string;
  signGlyph: string;
  degrees: number;
  longitude: number;
  retrograde: boolean;
};

type TransitsData = {
  date: string;
  planets: PlanetData[];
  retrogrades: string[];
  upcoming: { date: string; event: string; description: string }[];
};

const planetGlyphs: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
};

export default function TransitsPage() {
  const [data, setData] = useState<TransitsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/transits")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("Could not load transit data. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-foreground-muted">Calculating planetary positions...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-error" />
          <p className="mt-3 text-sm text-foreground-muted">{error || "Could not load data"}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <Eyebrow>Live Cosmic Weather</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          Current Transits
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Real-time planetary positions calculated by the Moshier ephemeris.
          Updated every time you visit.
        </p>
      </div>

      {/* Planet Positions */}
      <div className="mb-10">
        <Eyebrow>Planetary Positions · {new Date(data.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</Eyebrow>
        <div className="mt-4 space-y-3">
          {data.planets.map((planet) => {
            const isRetro = planet.retrograde;
            const impact = isRetro ? "warning" : planet.id === "sun" || planet.id === "moon" ? "neutral" : "positive";

            return (
              <Card key={planet.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    impact === "positive" ? "bg-success-light text-success" :
                    impact === "warning" ? "bg-warning/10 text-warning" :
                    "bg-surface-muted text-foreground-muted"
                  }`}>
                    <span className="text-lg">{planetGlyphs[planet.id]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{planet.name}</h3>
                      <Tag className="text-[10px]">{planet.signGlyph} {planet.sign}</Tag>
                      <span className="text-xs text-foreground-subtle">{planet.degrees}°</span>
                      {isRetro && (
                        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
                          ℞ Retrograde
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                      {planet.name} is at {planet.degrees}° {planet.sign} ({planet.longitude.toFixed(2)}° ecliptic longitude)
                      {isRetro && " — appearing to move backward from Earth's perspective"}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Retrograde Summary */}
      {data.retrogrades.length > 0 && (
        <Card className="mb-6 p-6 border-warning/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {data.retrogrades.length} Planet{data.retrogrades.length > 1 ? "s" : ""} Retrograde
              </h3>
              <p className="mt-1 text-sm text-foreground-muted">
                {data.retrogrades.join(", ")} {data.retrogrades.length > 1 ? "are" : "is"} retrograde.
                This is a time for review, reflection, and revisiting — not initiation.
                Be patient with delays and misunderstandings.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Upcoming Events */}
      <div>
        <Eyebrow>What This Means Now</Eyebrow>
        <div className="mt-4 space-y-3">
          {data.upcoming.map((event, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{event.event}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted">{event.description}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-primary">{event.date}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-8 bg-surface-muted/30 p-6 text-center">
        <Eyebrow>Personal Transits</Eyebrow>
        <p className="mt-2 text-sm text-foreground-muted">
          Premium members get personalised transit alerts — notified when a planet
          aspects your natal chart, so you never miss a cosmic moment.
        </p>
        <a href="/pricing" className="btn-secondary mt-4">Explore Premium</a>
      </Card>
    </div>
  );
}