import Link from "next/link";
import { Sparkles, Moon, Star, ArrowRight, BookOpen, Heart, Users } from "lucide-react";
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
      {/* Hero */}
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
            <Eyebrow>Cosmic Self-Knowledge</Eyebrow>
            <h1 className="heading-serif mt-4 text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl text-balance">
              Meet Jehana.
              <br />
              <span className="text-primary italic">Your astrological guide.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground-muted text-balance">
              Enter your birth date. Jehana reads your chart and starts a conversation —
              about your strengths, your challenges, and what makes you uniquely you.
              Powered by real astronomy and classical astrology texts.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/echo" className="btn-primary">
                <Sparkles className="h-4 w-4" />
                Meet Jehana — Free, No Signup
              </Link>
              <Link href="/birth-chart" className="btn-secondary">
                Calculate Your Birth Chart
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="mt-6 text-xs text-foreground-subtle">
              Free forever. Your birth data is sacred — we never sell it.
            </p>
          </div>
        </div>
      </section>

      {/* Today's Horoscope */}
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-8 text-center">
          <Eyebrow>Today&apos;s Reading</Eyebrow>
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
              Read full {horoscope.sign.name} horoscope
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </section>

      {/* Choose Your Sign */}
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

      <OrnateDivider className="mx-auto max-w-md" />

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-10 text-center">
          <Eyebrow>Everything in one place</Eyebrow>
          <h2 className="heading-serif mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
            A complete astrology experience
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: Star,
              title: "Real Birth Charts",
              desc: "Swiss Ephemeris calculation — the same engine used by Astro.com. Not just sun signs; full planetary positions, houses, and aspects.",
              href: "/birth-chart",
              cta: "See your chart",
            },
            {
              icon: Sparkles,
              title: "AI Astrology Advisor",
              desc: "Ask anything. Our AI advisor is trained on classical astrology texts and your personal chart. Multi-turn conversations, real guidance.",
              href: "/advisor",
              cta: "Ask the advisor",
            },
            {
              icon: Heart,
              title: "Compatibility",
              desc: "Discover how your sign interacts with every other. Love, communication, trust, and emotional resonance — scored and explained.",
              href: "/compatibility",
              cta: "Check compatibility",
            },
            {
              icon: Moon,
              title: "Daily Horoscopes",
              desc: "Personalised daily and weekly readings for all twelve signs. Mood, focus, lucky numbers, and guidance for love, career, and health.",
              href: "/horoscope",
              cta: "Read horoscopes",
            },
            {
              icon: Users,
              title: "Personality Profiles",
              desc: "Deep dives into each zodiac sign's traits, strengths, challenges, love style, and career strengths. From classical sources.",
              href: "/signs",
              cta: "Explore signs",
            },
            {
              icon: BookOpen,
              title: "Astrology Library",
              desc: "A digitised classic astrology text, searchable and structured. The wisdom of C.A.Q. Libra's 1917 masterwork, made accessible.",
              href: "/book",
              cta: "Browse the library",
            },
          ].map((feature) => (
            <Card key={feature.title} hover className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                {feature.desc}
              </p>
              <Link
                href={feature.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
              >
                {feature.cta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Privacy Banner */}
      <section className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <Card className="bg-surface-muted/30 p-8 text-center">
          <Eyebrow>Privacy First</Eyebrow>
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

      {/* CTA */}
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="text-center">
          <OrnateDivider className="mb-8 max-w-xs" />
          <h2 className="heading-serif text-3xl font-semibold text-foreground sm:text-4xl">
            Ready to meet yourself?
          </h2>
          <p className="mt-4 text-sm text-foreground-muted">
            Start with your birth chart. It&apos;s free, accurate, and might surprise you.
          </p>
          <div className="mt-6">
            <Link href="/birth-chart" className="btn-primary">
              <Sparkles className="h-4 w-4" />
              Begin Your Journey
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}