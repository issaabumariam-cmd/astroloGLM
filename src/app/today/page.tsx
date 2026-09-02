"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Sun, Moon, ArrowRight, CloudSun, Star } from "lucide-react";
import { Eyebrow, Card, OrnateDivider } from "@/components/shared/ui-primitives";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";
import { useAuth } from "@/lib/auth/auth-context";
import { loadBirthData } from "@/lib/auth/birth-data";
import { getSignById } from "@/lib/astrology/signs";
import { generateDailyHoroscope } from "@/lib/astrology/horoscope";

type WeatherItem = { id: string; icon: string; text: string; personal?: boolean };

type TodayData = {
  hasChart: boolean;
  signName: string | null;
  signGlyph: string | null;
  signId: string | null;
  horoscope: { content: string; mood: number; focus: string; luckyNumber: number } | null;
  weather: WeatherItem[];
};

export default function TodayPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const build = async () => {
      try {
        // 1) Returning user's saved sign (from chart or profile)
        let signId: string | null = null;
        const birth = user ? await loadBirthData(user.id) : null;
        if (birth?.zodiacSign) {
          signId = birth.zodiacSign;
        } else {
          // Not a returning user: sun sign from today's featured rotation is
          // meaningless personally — leave null, show general sky instead.
          signId = null;
        }

        // 2) Daily horoscope for their sign — generated locally (instant, no LLM cost)
        let horoscope: TodayData["horoscope"] = null;
        if (signId) {
          const sign = getSignById(signId);
          if (sign) {
            const h = generateDailyHoroscope(sign, new Date());
            horoscope = { content: h.content, mood: h.mood, focus: h.focus, luckyNumber: h.luckyNumber };
          }
        }

        // 3) Cosmic weather (transits) — personalized if sign known
        let weather: WeatherItem[] = [];
        try {
          const params = new URLSearchParams();
          if (signId) params.set("sign", signId);
          const res = await fetch(`/api/transits?${params}`);
          if (res.ok) {
            const t = await res.json();
            if (Array.isArray(t.transits)) {
              weather = t.transits.slice(0, 3).map((x: { description?: string; transitPlanet?: string; aspectType?: string; natalPlanet?: string }, i: number) => ({
                id: `t-${i}`,
                icon: "✦",
                text: x.description || `${x.transitPlanet ?? ""} ${x.aspectType ?? ""} ${x.natalPlanet ?? ""}`.trim(),
                personal: !!signId,
              }));
            }
            if (Array.isArray(t.retrogrades) && t.retrogrades.length > 0) {
              weather.push({ id: "retro", icon: "℞", text: `${t.retrogrades.join(", ")} retrograde` });
            }
            if (weather.length === 0) {
              weather.push({ id: "quiet", icon: "☁", text: "The sky is quiet today — a good time for reflection." });
            }
          }
        } catch {
          weather = [{ id: "unavailable", icon: "☁", text: "Cosmic weather unavailable right now." }];
        }

        if (!cancelled) {
          const sign = signId ? getSignById(signId) : null;
          setData({
            hasChart: !!birth?.birthDate,
            signName: sign?.name ?? null,
            signGlyph: sign?.glyph ?? null,
            signId: signId,
            horoscope,
            weather,
          });
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setData({ hasChart: false, signName: null, signGlyph: null, signId: null, horoscope: null, weather: [] });
          setLoading(false);
        }
      }
    };

    if (!authLoading) build();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center px-4 py-12">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 opacity-[0.03]"
        style={{ width: "800px", height: "800px" }}
      >
        <ZodiacWheel size={800} className="text-primary" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="fade-in text-center">
          <Eyebrow>Today · {today}</Eyebrow>
          <h1 className="heading-serif mt-3 text-3xl font-semibold text-foreground sm:text-4xl text-balance">
            {data?.signName ? (
              <>The sky for <span className="text-primary italic">{data.signName}</span></>
            ) : (
              <>Today&apos;s <span className="text-primary italic">cosmic weather</span></>
            )}
          </h1>
          {data?.hasChart && (
            <p className="mt-3 text-sm text-foreground-muted">
              From your saved chart — <Link href="/jehana" className="text-primary hover:text-primary-hover">continue your reading with Jehana →</Link>
            </p>
          )}
        </div>

        {loading ? (
          <div className="mt-16 flex flex-col items-center">
            <ZodiacWheel size={64} className="text-primary spin-slow" />
            <p className="mt-4 text-sm text-foreground-muted">Reading the sky…</p>
          </div>
        ) : (
          <>
            {/* Personal horoscope */}
            {data?.horoscope && (
              <Card className="mt-10 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
                    {data.signGlyph}
                  </div>
                  <div>
                    <p className="text-sm leading-relaxed text-foreground-muted">{data.horoscope.content}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
                        Mood: {"★".repeat(data.horoscope.mood)}{"☆".repeat(5 - data.horoscope.mood)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
                        Focus: {data.horoscope.focus}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
                        Lucky number: {data.horoscope.luckyNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Cosmic weather */}
            {data && data.weather.length > 0 && (
              <Card className="mt-6 p-6">
                <div className="flex items-center gap-2">
                  <CloudSun className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-lg font-semibold text-foreground">Cosmic weather</h2>
                  {data.signId && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                      Personal to your chart
                    </span>
                  )}
                </div>
                <ul className="mt-4 space-y-3">
                  {data.weather.map((w) => (
                    <li key={w.id} className="flex items-start gap-3 text-sm text-foreground-muted">
                      <span className="mt-0.5 shrink-0 text-base">{w.icon}</span>
                      <span>{w.text}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Ask Jehana CTAs — every card ends with a question she can answer */}
            <div className="mt-8 space-y-3">
              {data?.signId ? (
                <>
                  <Link href={`/jehana?sign=${data.signId}`} className="card card-hover flex items-center gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <p className="flex-1 text-sm font-medium text-foreground">
                      Ask Jehana what today means for you
                    </p>
                    <ArrowRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
                  </Link>
                  <Link href={`/jehana?sign=${data.signId}`} className="card card-hover flex items-center gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <p className="flex-1 text-sm font-medium text-foreground">
                      Is this a good week for a big decision?
                    </p>
                    <ArrowRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
                  </Link>
                </>
              ) : (
                <Link href="/jehana" className="card card-hover flex items-center gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Sun className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Make it personal</p>
                    <p className="text-xs text-foreground-muted">Add your birth details — Jehana reads your whole chart, not just your sun sign.</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-foreground-subtle" />
                </Link>
              )}
            </div>

            <OrnateDivider className="mx-auto mt-10 max-w-xs" />

            <p className="mt-6 text-center text-xs text-foreground-subtle">
              For self-reflection and entertainment. Not a substitute for professional advice.
            </p>
          </>
        )}
      </div>
    </div>
  );
}