"use client";

import { useState, useEffect, useMemo } from "react";
import { Eyebrow, Card, Tag, OrnateDivider } from "@/components/shared/ui-primitives";
import { AlertCircle, Loader2, Calendar, Moon, Repeat, Zap, ArrowRight } from "lucide-react";

type AstroEvent = {
  date: string;
  endDate?: string;
  type: "mercury_retrograde" | "planet_retrograde" | "planet_direct" | "new_moon" | "full_moon" | "eclipse" | "ingress" | "lunar_node";
  title: string;
  description: string;
  significance: "high" | "medium" | "low";
  planet?: string;
  glyph?: string;
};

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

type CalendarData = {
  generatedAt: string;
  rangeStart: string;
  rangeEnd: string;
  events: AstroEvent[];
  retrogrades: { planet: string; start: string; end: string | null; glyph: string; description: string }[];
  moonPhases: { date: string; phase: string; glyph: string }[];
};

const planetGlyphs: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getEventIcon(type: string, glyph?: string) {
  switch (type) {
    case "new_moon": return <Moon className="h-4 w-4" />;
    case "full_moon": return <Moon className="h-4 w-4" />;
    case "eclipse": return <Zap className="h-4 w-4" />;
    case "mercury_retrograde":
    case "planet_retrograde": return <Repeat className="h-4 w-4" />;
    case "planet_direct": return <ArrowRight className="h-4 w-4" />;
    case "ingress": return <Calendar className="h-4 w-4" />;
    default: return glyph ? <span className="text-sm">{glyph}</span> : <Calendar className="h-4 w-4" />;
  }
}

function getEventColor(type: string, significance: string) {
  if (type === "eclipse") return { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" };
  if (type === "mercury_retrograde" || type === "planet_retrograde") return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" };
  if (type === "planet_direct") return { bg: "bg-success-light", text: "text-success", border: "border-success/30" };
  if (type === "new_moon" || type === "full_moon") return { bg: "bg-primary/5", text: "text-foreground", border: "border-border" };
  if (significance === "high") return { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30" };
  return { bg: "bg-surface-muted", text: "text-foreground-muted", border: "border-border" };
}

type TabType = "today" | "calendar" | "retrogrades" | "moon";

export default function TransitsPage() {
  const [transits, setTransits] = useState<TransitsData | null>(null);
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>("today");

  useEffect(() => {
    fetch("/api/transits")
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then(setTransits)
      .catch(() => setError("Could not load transit data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "calendar" || tab === "retrogrades" || tab === "moon") {
      if (calendar) return;
      let cancelled = false;
      const loadCalendar = async () => {
        setCalendarLoading(true);
        try {
          const r = await fetch("/api/transits/calendar?days=90");
          if (!r.ok) throw new Error("Failed");
          const data = await r.json();
          if (!cancelled) setCalendar(data);
        } catch {
          // silent
        } finally {
          if (!cancelled) setCalendarLoading(false);
        }
      };
      loadCalendar();
      return () => { cancelled = true; };
    }
  }, [tab, calendar]);

  const eventsByMonth = useMemo(() => {
    if (!calendar?.events) return {};
    const grouped: Record<string, AstroEvent[]> = {};
    for (const event of calendar.events) {
      const d = new Date(event.date + "T00:00:00");
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    }
    return grouped;
  }, [calendar]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-foreground-muted">Calculating planetary positions...</p>
      </div>
    );
  }

  if (error || !transits) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-error" />
          <p className="mt-3 text-sm text-foreground-muted">{error || "Could not load data"}</p>
        </Card>
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "calendar", label: "90-Day Calendar" },
    { id: "retrogrades", label: "Retrogrades" },
    { id: "moon", label: "Moon Phases" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8 text-center">
        <Eyebrow>Live Cosmic Weather</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          Transit Calendar
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Real-time planetary positions and upcoming astrological events.
          Calculated by the Moshier ephemeris — the global standard.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-primary text-surface"
                : "bg-surface-muted text-foreground-muted hover:bg-surface-muted/70 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TODAY TAB */}
      {tab === "today" && (
        <>
          <div className="mb-10">
            <Eyebrow>Planetary Positions · {new Date(transits.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</Eyebrow>
            <div className="mt-4 space-y-3">
              {transits.planets.map((planet) => {
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
                            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">℞ Retrograde</span>
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

          {transits.retrogrades.length > 0 && (
            <Card className="mb-6 p-6 border-warning/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {transits.retrogrades.length} Planet{transits.retrogrades.length > 1 ? "s" : ""} Retrograde
                  </h3>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {transits.retrogrades.join(", ")} {transits.retrogrades.length > 1 ? "are" : "is"} retrograde.
                    This is a time for review, reflection, and revisiting — not initiation.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div>
            <Eyebrow>What This Means Now</Eyebrow>
            <div className="mt-4 space-y-3">
              {transits.upcoming.map((event, i) => (
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
        </>
      )}

      {/* CALENDAR TAB */}
      {tab === "calendar" && (
        <div>
          {calendarLoading ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-foreground-muted">Scanning 90 days of planetary motion...</p>
              <p className="mt-1 text-xs text-foreground-subtle">This takes a few seconds — calculating positions for each day</p>
            </div>
          ) : calendar ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-foreground-muted">
                  <span className="font-medium text-foreground">{calendar.events.length}</span> events in the next 90 days
                </p>
                <p className="text-xs text-foreground-subtle">
                  {formatDateLong(calendar.rangeStart)} — {formatDateLong(calendar.rangeEnd)}
                </p>
              </div>

              {Object.entries(eventsByMonth).map(([month, events]) => (
                <div key={month} className="mb-8">
                  <h2 className="heading-serif mb-4 text-2xl font-semibold text-foreground">{month}</h2>
                  <div className="space-y-3">
                    {events.map((event, i) => {
                      const colors = getEventColor(event.type, event.significance);
                      return (
                        <Card key={i} className={`p-5 ${colors.border}`}>
                          <div className="flex items-start gap-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                              {getEventIcon(event.type, event.glyph)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="text-sm font-semibold text-foreground">{event.title}</h3>
                                <span className="shrink-0 text-xs font-medium text-primary">{formatDate(event.date)}</span>
                              </div>
                              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{event.description}</p>
                              {event.significance === "high" && (
                                <span className={`mt-2 inline-block rounded-full ${colors.bg} ${colors.text} px-2 py-0.5 text-[10px] font-medium`}>
                                  High Impact
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-sm text-foreground-muted">Could not load calendar data.</p>
            </Card>
          )}
        </div>
      )}

      {/* RETROGRADES TAB */}
      {tab === "retrogrades" && (
        <div>
          {calendarLoading ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-foreground-muted">Detecting retrograde stations...</p>
            </div>
          ) : calendar?.retrogrades.length ? (
            <>
              <Eyebrow>Retrograde Cycles · Next 90 Days</Eyebrow>
              <div className="mt-4 space-y-4">
                {calendar.retrogrades.map((retro, i) => (
                  <Card key={i} className="p-6 border-warning/20">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                        <span className="text-xl">{retro.glyph}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">{retro.planet.charAt(0).toUpperCase() + retro.planet.slice(1)} Retrograde</h3>
                          <Repeat className="h-4 w-4 text-warning" />
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{retro.description}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs">
                          <span className="font-medium text-foreground">Starts: <span className="text-primary">{formatDate(retro.start)}</span></span>
                          {retro.end && (
                            <>
                              <span className="text-foreground-subtle">→</span>
                              <span className="font-medium text-foreground">Ends: <span className="text-success">{formatDate(retro.end)}</span></span>
                            </>
                          )}
                          {!retro.end && (
                            <span className="text-foreground-subtle italic">End date beyond 90-day range</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="p-8 text-center">
              <Repeat className="mx-auto h-8 w-8 text-foreground-subtle" />
              <p className="mt-3 text-sm text-foreground-muted">No retrogrades detected in the next 90 days.</p>
            </Card>
          )}
        </div>
      )}

      {/* MOON PHASES TAB */}
      {tab === "moon" && (
        <div>
          {calendarLoading ? (
            <div className="flex min-h-[30vh] flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-foreground-muted">Calculating lunar phases...</p>
            </div>
          ) : calendar?.moonPhases.length ? (
            <>
              <Eyebrow>Lunar Cycle · Next 90 Days</Eyebrow>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {calendar.moonPhases.map((phase, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{phase.glyph}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{phase.phase}</p>
                        <p className="text-xs text-foreground-muted">{formatDate(phase.date)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <OrnateDivider className="my-8" />
              <Card className="bg-surface-muted/30 p-6 text-center">
                <Eyebrow>Lunar Wisdom</Eyebrow>
                <p className="mt-2 text-sm text-foreground-muted">
                  New Moons are for planting seeds and setting intentions.
                  Full Moons are for illumination and release.
                  The 29.5-day cycle mirrors the rhythm of beginning and completion.
                </p>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center">
              <Moon className="mx-auto h-8 w-8 text-foreground-subtle" />
              <p className="mt-3 text-sm text-foreground-muted">No moon phases detected in range.</p>
            </Card>
          )}
        </div>
      )}

      {/* Premium CTA */}
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