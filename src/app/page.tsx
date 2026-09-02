import Link from "next/link";
import { Sparkles, Moon, ArrowRight } from "lucide-react";
import { ZodiacWheel } from "@/components/shared/zodiac-wheel";
import { Eyebrow, Card, OrnateDivider } from "@/components/shared/ui-primitives";
import { zodiacSigns } from "@/lib/astrology/signs";
import { generateDailyHoroscope } from "@/lib/astrology/horoscope";

export default function HomePage() {
  const today = new Date();
  const featuredSign = zodiacSigns[today.getDate() % 12];
  const horoscope = generateDailyHoroscope(featuredSign, today);

  return (
    <div className="flex flex-col">
      {/* Hero — one CTA: Meet Jehana (v2: single decision, zero clutter) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-surface-muted/40 via-background to-background" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 opacity-[0.04]"
          style={{ width: "800px", height: "800px", top: "-300px" }}
        >
          <ZodiacWheel size={800} className="text-primary" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center">
              <ZodiacWheel size={88} className="text-primary spin-slow" />
            </div>
            <Eyebrow>The Cosmos, Echoed Back</Eyebrow>
            <h1 className="heading-serif mt-4 text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl text-balance">
              Meet Jehana.
              <br />
              <span className="text-primary italic">The universe, introducing you to yourself.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground-muted text-balance">
              Your personal astrologer. She reads your chart, explains what she sees,
              and talks with you about your life. Not predictions. Reflections of who you already are.
            </p>
            <div className="mt-8">
              <Link href="/jehana" className="btn-primary">
                <Sparkles className="h-4 w-4" />
                Meet Jehana — Free
              </Link>
            </div>
            <p className="mt-6 text-xs text-foreground-subtle">
              Free forever. Your birth data is sacred — the cosmos gave it, we protect it.
            </p>
          </div>
        </div>
      </section>

      {/* Today's Cosmic Echo — daily content keeps SEO + gives a taste of Jehana */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 text-center">
          <Eyebrow>Today&apos;s Cosmic Echo</Eyebrow>
          <h2 className="heading-serif mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            {horoscope.sign.name} — {today.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
          </h2>
        </div>
        <Card className="mx-auto max-w-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl text-primary">
              {horoscope.sign.glyph}
            </div>
            <div>
              <p className="text-base leading-relaxed text-foreground-muted">
                {horoscope.content}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
                  Mood: {"★".repeat(horoscope.mood)}{"☆".repeat(5 - horoscope.mood)}
                </span>
                <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
                  Lucky number: {horoscope.luckyNumber}
                </span>
                <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
                  Focus: {horoscope.focus}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-6 text-center">
            <Link href={`/horoscope/${horoscope.sign.id}`} className="btn-ghost">
              Ask Jehana about this
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>

      <OrnateDivider className="mx-auto max-w-md" />

      {/* Choose Your Sign — SEO entry, each sign links to its page */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 text-center">
          <Eyebrow>Explore</Eyebrow>
          <h2 className="heading-serif mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            Find Your Sign
          </h2>
          <p className="mt-3 text-sm text-foreground-muted">
            Select your sign for daily readings, personality insights, and compatibility
          </p>
        </div>
        <div className="mx-auto grid max-w-2xl grid-cols-4 gap-2 sm:grid-cols-6">
          {zodiacSigns.map((sign) => (
            <Link
              key={sign.id}
              href={`/signs/${sign.id}`}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface p-3 text-foreground-muted transition-all hover:border-primary-light hover:bg-surface-muted"
            >
              <span className="text-2xl">{sign.glyph}</span>
              <span className="text-sm font-medium">{sign.name}</span>
              <span className="text-[10px] text-foreground-subtle">{sign.dates.split(" – ")[0]}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Privacy — brand pillar */}
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <Card className="bg-surface-muted/30 p-8 text-center">
          <Eyebrow>The Cosmos Gave It. We Protect It.</Eyebrow>
          <h3 className="heading-serif mt-3 text-2xl font-semibold text-foreground">
            Your birth data is sacred.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-foreground-muted">
            We believe your birth date, time, and location are among the most
            personal data you can share. That&apos;s why we encrypt it, never sell it,
            never use it for advertising, and let you delete it with a single click.
            GDPR-compliant by design.
          </p>
        </Card>
      </section>

      {/* Closing CTA — the same single action */}
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="text-center">
          <OrnateDivider className="mb-8 max-w-xs" />
          <h2 className="heading-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Ready to meet yourself?
          </h2>
          <p className="mt-4 text-sm text-foreground-muted">
            The universe wrote your story. Jehana reads it back to you.
          </p>
          <div className="mt-6">
            <Link href="/jehana" className="btn-primary">
              <Sparkles className="h-4 w-4" />
              Meet Jehana — Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}