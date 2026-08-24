import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { zodiacSigns } from "@/lib/astrology/signs";
import { generateAIHoroscope } from "@/lib/astrology/horoscope-ai";
import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { elementColors } from "@/lib/astrology/signs";

export const metadata = {
  title: "Daily Horoscope",
  description: "Today's horoscope for all twelve zodiac signs. Book-grounded AI readings with real planetary transits.",
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function HoroscopePage() {
  const today = new Date();

  const horoscopes = await Promise.all(
    zodiacSigns.map((sign) => generateAIHoroscope(sign, today).catch(() => null))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <Eyebrow>Daily Guidance · Book-Grounded</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          Today&apos;s Horoscopes
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          {today.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zodiacSigns.map((sign, i) => {
          const horoscope = horoscopes[i];
          return (
            <Link key={sign.id} href={`/horoscope/${sign.id}`}>
              <Card hover className="h-full p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl"
                    style={{ background: `${elementColors[sign.element]}15` }}
                  >
                    {sign.glyph}
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-foreground">
                      {sign.name}
                    </h2>
                    <p className="text-xs text-foreground-subtle">{sign.dates}</p>
                  </div>
                  {horoscope?.retrogrades && horoscope.retrogrades.length > 0 && (
                    <div className="ml-auto text-xs font-medium text-foreground-muted">
                      ℞ {horoscope.retrogrades.length}
                    </div>
                  )}
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground-muted">
                  {horoscope?.content || "Generating..."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-primary">
                  <span>Read more</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
