"use client";

import { useState } from "react";
import { getSignById, elementColors } from "@/lib/astrology/signs";
import { Eyebrow, Card, OrnateDivider } from "@/components/shared/ui-primitives";
import { ChartWheel } from "@/components/chart/chart-wheel";
import type { ChartData } from "@/lib/astrology/chart";
import { Sparkles, Calendar, Clock, MapPin, Loader2, BookOpen, Repeat } from "lucide-react";

const COMMON_CITIES: Record<string, { name: string; lat: number; lng: number }> = {
  london: { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  paris: { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  berlin: { name: "Berlin, Germany", lat: 52.52, lng: 13.405 },
  amsterdam: { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  madrid: { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038 },
  rome: { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  dublin: { name: "Dublin, Ireland", lat: 53.3498, lng: -6.2603 },
  stockholm: { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  oslo: { name: "Oslo, Norway", lat: 59.9139, lng: 10.7522 },
  copenhagen: { name: "Copenhagen, Denmark", lat: 55.6761, lng: 12.5683 },
  helsinki: { name: "Helsinki, Finland", lat: 60.1699, lng: 24.9384 },
  newyork: { name: "New York, USA", lat: 40.7128, lng: -74.006 },
  amman: { name: "Amman, Jordan", lat: 31.9539, lng: 35.9108 },
  dubai: { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708 },
  istanbul: { name: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784 },
};

export default function BirthChartPage() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [cityKey, setCityKey] = useState("london");
  const [customPlace, setCustomPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<{ chapter_num: number; chapter_title: string; text: string; score?: number }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAIInterpretation = async () => {
    if (!chart) return;
    setAiLoading(true);
    setAiInterpretation(null);
    try {
      const city = COMMON_CITIES[cityKey] || COMMON_CITIES.london;
      const response = await fetch("/api/birth-chart-interpretation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sunSign: chart.sun.signId,
          moonSign: chart.moon.signId,
          risingSign: chart.rising.signId,
          sunDegrees: chart.sun.degreesInSign,
          moonDegrees: chart.moon.degreesInSign,
          risingDegrees: chart.rising.degreesInSign,
        }),
      });
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setAiInterpretation(data.reading);
      setAiSources(data.sources || []);
    } catch {
      setAiInterpretation("Could not generate interpretation. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    setError(null);

    const city = COMMON_CITIES[cityKey] || COMMON_CITIES.london;

    try {
      const response = await fetch("/api/birth-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthDate: date,
          birthTime: time || undefined,
          lat: city.lat,
          lng: city.lng,
          birthPlace: customPlace || city.name,
          cityKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Calculation failed");
      }

      const data = await response.json();
      setChart(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate chart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <Eyebrow>Natal Chart · Swiss-Grade Accuracy</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          Your Birth Chart
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Real astronomical calculation using the Moshier ephemeris — the same accuracy
          standard as Astro.com. Enter your birth details to reveal your cosmic blueprint.
        </p>
      </div>

      {!chart && (
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleCalculate} className="space-y-5">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                <Calendar className="h-4 w-4 text-primary" />
                Birth Date <span className="text-xs text-error">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="input-field"
                max={new Date().toISOString().split("T")[0]}
                min="1900-01-01"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                <Clock className="h-4 w-4 text-primary" />
                Birth Time <span className="text-xs text-foreground-subtle">(improves accuracy)</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-field"
              />
              <p className="mt-1 text-xs text-foreground-subtle">
                Don&apos;t know the exact time? Leave blank — we&apos;ll use noon.
              </p>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                <MapPin className="h-4 w-4 text-primary" />
                Birth Location
              </label>
              <select
                value={cityKey}
                onChange={(e) => setCityKey(e.target.value)}
                className="input-field cursor-pointer"
              >
                {Object.entries(COMMON_CITIES).map(([key, city]) => (
                  <option key={key} value={key}>{city.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={customPlace}
                onChange={(e) => setCustomPlace(e.target.value)}
                placeholder="Or type your city (uses selected city coordinates)"
                className="input-field mt-2"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-error-light px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading || !date} className="btn-primary w-full disabled:opacity-50">
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Calculating...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Reveal My Chart</>
              )}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-foreground-subtle">
            Your birth data is processed on our server and never stored unless you create an account.
          </p>
        </Card>
      )}

      {chart && (
        <>
          <OrnateDivider className="my-8" />

          {/* Chart Wheel */}
          <Card className="p-6 mb-6">
            <div className="text-center">
              <Eyebrow>Your Natal Chart</Eyebrow>
              <h2 className="heading-serif mt-1 text-2xl font-semibold text-foreground">
                {chart.birthPlace} · {chart.birthDate} · {chart.birthTime}
              </h2>
            </div>
            <div className="mt-6 overflow-x-auto">
              <ChartWheel chart={chart} size={420} />
            </div>
          </Card>

          {/* Big Three */}
          <div className="mb-6">
            <Eyebrow>The Big Three</Eyebrow>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: "Sun", desc: "Your core identity, vitality, and life purpose", planet: chart.sun },
                { label: "Moon", desc: "Your emotional nature, instincts, and inner world", planet: chart.moon },
                { label: "Rising", desc: "How others see you and your approach to life", planet: chart.rising },
              ].map((item) => {
                const sign = getSignById(item.planet.signId)!;
                return (
                  <Card key={item.label} className="p-6 text-center">
                    <p className="text-xs uppercase tracking-wider text-primary">{item.label}</p>
                    <div
                      className="mx-auto my-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                      style={{ background: `${elementColors[sign.element]}15` }}
                    >
                      {sign.glyph}
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-foreground">{sign.name}</h3>
                    <p className="mt-1 text-xs text-foreground-subtle">
                      {Math.floor(item.planet.degreesInSign)}° in {sign.name}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed text-foreground-muted">{item.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* All Planets */}
          <Card className="p-6 mb-6">
            <Eyebrow>Planetary Positions</Eyebrow>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-foreground-subtle">
                    <th className="py-2 text-left font-medium">Planet</th>
                    <th className="py-2 text-left font-medium">Sign</th>
                    <th className="py-2 text-left font-medium">Degrees</th>
                    <th className="py-2 text-left font-medium">House</th>
                    <th className="py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.planets.map((planet) => {
                    const sign = getSignById(planet.signId)!;
                    return (
                      <tr key={planet.id} className="border-b border-border/50">
                        <td className="py-2.5">
                          <span className="text-lg mr-1">{planet.glyph}</span>
                          <span className="font-medium text-foreground">{planet.name}</span>
                        </td>
                        <td className="py-2.5 text-foreground-muted">
                          {sign.glyph} {sign.name}
                        </td>
                        <td className="py-2.5 text-foreground-muted">
                          {Math.floor(planet.degreesInSign)}° {sign.element}
                        </td>
                        <td className="py-2.5 text-foreground-muted">{planet.house || "—"}</td>
                        <td className="py-2.5">
                          {planet.retrograde ? (
                            <span className="text-xs font-medium text-warning">℞ Retrograde</span>
                          ) : (
                            <span className="text-xs text-foreground-subtle">Direct</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Aspects */}
          {chart.aspects.length > 0 && (
            <Card className="p-6 mb-6">
              <Eyebrow>Major Aspects</Eyebrow>
              <div className="mt-4 flex flex-wrap gap-2">
                {chart.aspects.map((aspect, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="text-lg">{aspect.glyph}</span>
                    <span className="text-foreground-muted">
                      {aspect.planet1} {aspect.glyph} {aspect.planet2}
                    </span>
                    <span className="text-xs text-foreground-subtle">
                      {aspect.type} ({aspect.orb}°)
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Interpretation */}
          <Card className="p-6">
            <Eyebrow>What This Means</Eyebrow>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Sun in {getSignById(chart.sun.signId)?.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  {getSignById(chart.sun.signId)?.personality}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Moon in {getSignById(chart.moon.signId)?.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  Your emotional self is coloured by {getSignById(chart.moon.signId)?.name}&apos;s{" "}
                  {getSignById(chart.moon.signId)?.element.toLowerCase()} energy. You process feelings
                  through {getSignById(chart.moon.signId)?.traits.slice(0, 3).join(", ")} tendencies.
                  Security comes from {getSignById(chart.moon.signId)?.keywords[0]}.
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  Ascendant in {getSignById(chart.rising.signId)?.name}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                  Your {getSignById(chart.rising.signId)?.name} rising gives you a{" "}
                  {getSignById(chart.rising.signId)?.traits[0]} first impression. Others see you as{" "}
                  {getSignById(chart.rising.signId)?.traits.slice(0, 2).join(" and ")} before they
                  know you well. This sign colours how you approach all new beginnings.
                </p>
              </div>
            </div>
          </Card>

          {/* AI Interpretation */}
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Eyebrow>AI Interpretation from the Book</Eyebrow>
              </div>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Premium</span>
            </div>
            {aiInterpretation ? (
              <div>
                <p className="mt-3 text-sm leading-relaxed text-foreground-muted whitespace-pre-wrap">{aiInterpretation}</p>
                {aiSources.length > 0 && (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="flex items-center gap-1 text-xs font-medium text-primary">
                      <BookOpen className="h-3 w-3" /> Sourced from the book ({aiSources.length} passages)
                    </p>
                    <div className="mt-2 space-y-1">
                      {aiSources.map((s, i) => (
                        <p key={i} className="text-[10px] text-foreground-subtle">
                          Ch.{s.chapter_num}: {s.chapter_title} · {Math.round((s.score || 0) * 100)}% match
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={fetchAIInterpretation} className="btn-ghost mt-3 text-xs">
                  <Repeat className="h-3 w-3" /> Regenerate
                </button>
              </div>
            ) : aiLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Echo is reading your chart through the book...
              </div>
            ) : (
              <button onClick={fetchAIInterpretation} className="btn-primary mt-3 text-sm">
                <Sparkles className="h-3.5 w-3.5" /> Interpret My Chart
              </button>
            )}
          </Card>

          {/* Recalculate */}
          <div className="mt-6 text-center">
            <button onClick={() => setChart(null)} className="btn-ghost">
              ← Calculate a different chart
            </button>
          </div>
        </>
      )}
    </div>
  );
}