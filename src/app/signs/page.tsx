import { zodiacSigns, elementColors } from "@/lib/astrology/signs";
import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Zodiac Signs",
  description: "Complete personality profiles for all twelve zodiac signs. Traits, strengths, challenges, love style, and career strengths.",
};

export default function SignsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <Eyebrow>Personality Profiles</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          The Twelve Signs
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          Deep dives into each sign&apos;s traits, strengths, challenges, love style, and career strengths.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zodiacSigns.map((sign) => (
          <Link key={sign.id} href={`/signs/${sign.id}`}>
            <Card hover className="h-full p-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-3xl"
                  style={{ background: `${elementColors[sign.element]}15` }}
                >
                  {sign.glyph}
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-foreground">{sign.name}</h2>
                  <p className="text-xs text-foreground-subtle">{sign.dates}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-foreground-muted">
                {sign.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {sign.traits.slice(0, 3).map((trait) => (
                  <span key={trait} className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-foreground-muted">
                    {trait}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                Read profile <ArrowRight className="h-3 w-3" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}