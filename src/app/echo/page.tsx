"use client";

import { useState } from "react";
import { Sparkles, Loader2, ArrowRight, Calendar, Clock, MapPin } from "lucide-react";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";
import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { zodiacSigns, getSignById, elementColors } from "@/lib/astrology/signs";

const COMMON_CITIES: Record<string, { name: string; lat: number; lng: number }> = {
  london: { name: "London, UK", lat: 51.5074, lng: -0.1278 },
  paris: { name: "Paris, France", lat: 48.8566, lng: 2.3522 },
  berlin: { name: "Berlin, Germany", lat: 52.52, lng: 13.405 },
  amsterdam: { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041 },
  madrid: { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038 },
  rome: { name: "Rome, Italy", lat: 41.9028, lng: 12.4964 },
  dublin: { name: "Dublin, Ireland", lat: 53.3498, lng: -6.2603 },
  stockholm: { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686 },
  newyork: { name: "New York, USA", lat: 40.7128, lng: -74.006 },
  amman: { name: "Amman, Jordan", lat: 31.9539, lng: 35.9108 },
  dubai: { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708 },
  istanbul: { name: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784 },
};

type ChartPreview = {
  sun: { sign: string; degrees: number; glyph: string };
  moon: { sign: string; degrees: number; glyph: string };
  rising: { sign: string; degrees: number; glyph: string };
  birthDateOnly: boolean;
};

type HookQuestion = {
  id: string;
  question: string;
  chartBasis: string;
  responseHint: string;
};

type JehanaIntro = {
  greeting: string;
  personalitySummary: string;
  hookQuestions: HookQuestion[];
  followUp: string;
};

type Stage = "input" | "loading" | "intro" | "hook-answer" | "hook-response" | "upgrade";

export default function JehanaPage() {
  const [stage, setStage] = useState<Stage>("input");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [cityKey, setCityKey] = useState("london");
  const [chart, setChart] = useState<ChartPreview | null>(null);
  const [intro, setIntro] = useState<JehanaIntro | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hookResponse, setHookResponse] = useState<string | null>(null);
  const [hookLoading, setHookLoading] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [activeHook, setActiveHook] = useState<HookQuestion | null>(null);
  const [exchangesCount, setExchangesCount] = useState(0);

  const handleStart = async () => {
    if (!birthDate) return;
    setLoading(true);
    setError(null);
    setStage("loading");

    try {
      const city = COMMON_CITIES[cityKey] || COMMON_CITIES.london;
      const response = await fetch("/api/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "intro",
          birthDate,
          birthTime: birthTime || undefined,
          lat: city.lat,
          lng: city.lng,
          birthPlace: city.name,
        }),
      });

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setChart(data.chart);
      setIntro(data.intro);
      setStage("intro");
    } catch {
      setError("Jehana couldn't connect. Please try again.");
      setStage("input");
    } finally {
      setLoading(false);
    }
  };

  const handleHookClick = (hook: HookQuestion) => {
    setActiveHook(hook);
    setStage("hook-answer");
  };

  const handleHookSubmit = async () => {
    if (!userAnswer.trim() || !activeHook) return;
    setHookLoading(true);
    setError(null);

    try {
      const city = COMMON_CITIES[cityKey] || COMMON_CITIES.london;
      const response = await fetch("/api/echo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hook-response",
          birthDate,
          birthTime: birthTime || undefined,
          lat: city.lat,
          lng: city.lng,
          hookQuestion: activeHook,
          userAnswer,
        }),
      });

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setHookResponse(data.response);
      setExchangesCount((c) => c + 1);
      setStage("hook-response");
    } catch {
      setError("Jehana couldn't respond. Please try again.");
    } finally {
      setHookLoading(false);
    }
  };

  const handleNextHook = () => {
    setHookResponse(null);
    setUserAnswer("");
    setActiveHook(null);
    if (exchangesCount >= 2) {
      setStage("upgrade");
    } else {
      setStage("intro");
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* Background zodiac wheel */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]"
        style={{ width: "900px", height: "900px" }}
      >
        <ZodiacWheel size={900} className="text-primary" />
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {/* Stage: Input */}
        {stage === "input" && (
          <div className="fade-in text-center">
            <ZodiacWheel size={96} className="mx-auto text-primary spin-slow" />
            <Eyebrow className="mt-6">The Cosmos, Echoed Back</Eyebrow>
            <h1 className="heading-serif mt-4 text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              The universe has already
              <br />
              <span className="text-primary italic">written your story.</span>
            </h1>
            <p className="mt-5 max-w-md mx-auto text-sm leading-relaxed text-foreground-muted text-balance">
              Enter your birth date. Every planet was somewhere specific the moment
              you arrived. Jehana reads that moment and echoes it back —
              not who you will become, but who you already are.
            </p>

            <Card className="mt-8 p-6 text-left">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                    <Calendar className="h-4 w-4 text-primary" /> Birth Date
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    min="1900-01-01"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                    <Clock className="h-4 w-4 text-primary" /> Birth Time
                    <span className="text-xs text-foreground-subtle">(optional — deepens the reading)</span>
                  </label>
                  <input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                    <MapPin className="h-4 w-4 text-primary" /> Birth Location
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
                </div>
                {error && <p className="text-sm text-error">{error}</p>}
                <button onClick={handleStart} disabled={!birthDate || loading} className="btn-primary w-full disabled:opacity-50">
                  <Sparkles className="h-4 w-4" />
                  Meet Jehana — Free
                </button>
              </div>
            </Card>
            <p className="mt-4 text-xs text-foreground-subtle">
              Your birth data is sacred. The cosmos gave it — we protect it.
            </p>
          </div>
        )}

        {/* Stage: Loading */}
        {stage === "loading" && (
          <div className="fade-in flex flex-col items-center justify-center py-20">
            <ZodiacWheel size={72} className="text-primary spin-slow mb-8" />
            <p className="text-sm font-medium text-primary">The cosmos is aligning...</p>
            <p className="mt-2 text-xs text-foreground-subtle">Jehana is listening to your chart</p>
          </div>
        )}

        {/* Stage: Intro */}
        {stage === "intro" && chart && intro && (
          <div className="fade-in">
            {/* Chart preview */}
            <Card className="mb-6 p-6">
              <p className="mb-4 text-center text-xs uppercase tracking-wider text-primary">Your Cosmic Blueprint</p>
              <div className="flex items-center justify-around">
                {[
                  { label: "Sun", data: chart.sun },
                  { label: "Moon", data: chart.moon },
                  { label: "Rising", data: chart.rising },
                ].map((item) => {
                  const sign = getSignById(item.data.sign.toLowerCase()) || zodiacSigns.find((s) => s.name === item.data.sign);
                  return (
                    <div key={item.label} className="text-center">
                      <p className="text-xs uppercase tracking-wider text-primary">{item.label}</p>
                      <div
                        className="mx-auto my-2 flex h-14 w-14 items-center justify-center rounded-full text-3xl"
                        style={{ background: `${elementColors[sign?.element || "Fire"]}15` }}
                      >
                        {item.data.glyph}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{item.data.sign}</p>
                      <p className="text-xs text-foreground-subtle">{item.data.degrees}°</p>
                    </div>
                  );
                })}
              </div>
              {chart.birthDateOnly && (
                <p className="mt-3 text-center text-xs text-foreground-subtle">
                  Add your birth time for Moon and Rising accuracy
                </p>
              )}
            </Card>

            {/* Jehana's message */}
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 rounded-lg bg-surface-muted p-5">
                  <p className="text-base font-medium text-foreground">{intro.greeting}</p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{intro.personalitySummary}</p>
                  <p className="mt-4 text-sm font-medium text-primary">{intro.followUp}</p>
                </div>
              </div>
            </div>

            {/* Hook questions */}
            <p className="mb-3 text-center text-xs uppercase tracking-wider text-foreground-subtle">
              Choose a question — or ask your own
            </p>
            <div className="space-y-3">
              {intro.hookQuestions.map((hook, i) => (
                <button
                  key={hook.id}
                  onClick={() => handleHookClick(hook)}
                  className="w-full rounded-lg border border-border bg-surface p-5 text-left transition-all hover:border-primary-light hover:bg-surface-muted card-hover"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{hook.question}</p>
                      <p className="mt-1 text-xs text-foreground-subtle">{hook.responseHint}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-foreground-subtle mt-1" />
                  </div>
                </button>
              ))}
            </div>

            {exchangesCount > 0 && exchangesCount < 2 && (
              <p className="mt-4 text-center text-xs text-foreground-subtle">
                {2 - exchangesCount} more free question{2 - exchangesCount !== 1 ? "s" : ""} remaining
              </p>
            )}
          </div>
        )}

        {/* Stage: Hook Answer (user types) */}
        {stage === "hook-answer" && activeHook && (
          <div className="fade-in">
            <div className="mb-6 rounded-lg bg-surface-muted p-5">
              <p className="text-sm font-medium text-primary">{activeHook.question}</p>
              <p className="mt-1 text-xs text-foreground-subtle">Based on: {activeHook.chartBasis}</p>
            </div>
            <div>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Share your thoughts... there's no wrong answer."
                rows={4}
                className="input-field"
                autoFocus
              />
              <button
                onClick={handleHookSubmit}
                disabled={!userAnswer.trim() || hookLoading}
                className="btn-primary mt-3 w-full disabled:opacity-50"
              >
                {hookLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> The universe is echoing back...</> : <><Sparkles className="h-4 w-4" /> Share with Jehana</>}
              </button>
            </div>
          </div>
        )}

        {/* Stage: Hook Response */}
        {stage === "hook-response" && hookResponse && (
          <div className="fade-in">
            <div className="flex items-start gap-3 mb-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 rounded-lg bg-surface-muted p-5">
                <p className="text-sm leading-relaxed text-foreground-muted whitespace-pre-wrap">{hookResponse}</p>
              </div>
            </div>
            <button onClick={handleNextHook} className="btn-primary w-full">
              {exchangesCount >= 2 ? "See what's next" : "Ask another question"}
            </button>
          </div>
        )}

        {/* Stage: Upgrade */}
        {stage === "upgrade" && (
          <div className="fade-in">
            <Card className="p-8 text-center">
              <Crown className="mx-auto h-10 w-10 text-primary" />
              <h2 className="heading-serif mt-4 text-2xl font-semibold text-foreground">
                You&apos;ve barely begun.
              </h2>
              <p className="mt-3 text-sm text-foreground-muted">
                The universe placed ten planets in twelve houses the moment you arrived —
                each one a story, each one an echo of who you are.
                Jehana has only read the first page.
              </p>
              <ul className="mx-auto mt-4 max-w-xs space-y-2 text-left">
                {[
                  "Unlimited conversations with Jehana",
                  "AI horoscopes (daily, weekly, monthly, yearly)",
                  "Full birth chart interpretation from the book",
                  "AI compatibility readings",
                  "Complete astrology library",
                  "Save your chart + chat history",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/pricing" className="btn-primary mt-6">
                <Crown className="h-4 w-4" />
                Continue the conversation — £5.99/month
              </a>
              <a href="/advisor" className="btn-ghost mt-3 text-xs">
                Or try the free advisor (per-sign chat)
              </a>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Crown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 18h20M3 8l4.5 4L12 4l4.5 8L21 8v10H3z" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}