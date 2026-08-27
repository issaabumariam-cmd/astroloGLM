import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, AlertCircle, Heart, Briefcase, Star, Sparkles } from "lucide-react";
import { zodiacSigns, getSignById, elementColors, elementDescriptions } from "@/lib/astrology/signs";
import { planets } from "@/lib/astrology/planets";
import { Eyebrow, Card, OrnateDivider, Tag } from "@/components/shared/ui-primitives";
import { generateSignReading } from "@/lib/astrology/sign-reading";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function generateStaticParams() {
  return zodiacSigns.map((sign) => ({ sign: sign.id }));
}

export async function generateMetadata({ params }: PageProps<"/signs/[sign]">) {
  const { sign } = await params;
  const signData = getSignById(sign);
  if (!signData) return { title: "Sign Profile" };
  return {
    title: `${signData.name} Personality Profile`,
    description: `${signData.name} traits, strengths, challenges, love style, and career strengths. ${signData.description}`,
  };
}

export default async function SignProfilePage({ params }: PageProps<"/signs/[sign]">) {
  const { sign: signId } = await params;
  const sign = getSignById(signId);
  if (!sign) notFound();

  const rulingPlanet = planets.find((p) => p.id === sign.rulingPlanet.toLowerCase()) || planets[0];
  const oppositeSign = zodiacSigns.find((s) => s.id === sign.opposite);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <Link href="/signs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        All signs
      </Link>

      {/* Hero */}
      <div className="text-center">
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-5xl"
          style={{ background: `${elementColors[sign.element]}15` }}
        >
          {sign.glyph}
        </div>
        <Eyebrow className="mt-4">{sign.element} · {sign.modality} · Ruled by {rulingPlanet.glyph} {rulingPlanet.name}</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          {sign.name}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">{sign.dates}</p>
      </div>

      <OrnateDivider className="my-8" />

      {/* Description */}
      <p className="text-lg leading-relaxed text-foreground-muted text-balance">
        {sign.description}
      </p>

      {/* Personality */}
      <div className="mt-8">
        <Eyebrow>Personality</Eyebrow>
        <Card className="mt-3 p-6">
          <p className="text-base leading-relaxed text-foreground">{sign.personality}</p>
        </Card>
      </div>

      {/* Traits */}
      <div className="mt-8">
        <Eyebrow>Core Traits</Eyebrow>
        <div className="mt-3 flex flex-wrap gap-2">
          {sign.traits.map((trait) => (
            <Tag key={trait} className="text-sm">{trait}</Tag>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {sign.keywords.map((kw) => (
            <span key={kw} className="inline-flex items-center rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Strengths & Challenges */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-success">
            <Check className="h-5 w-5" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.125em]">Strengths</h3>
          </div>
          <ul className="space-y-2.5">
            {sign.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-foreground-muted">
                <span className="mt-1 text-success">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 text-error">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.125em]">Growth Areas</h3>
          </div>
          <ul className="space-y-2.5">
            {sign.challenges.map((c) => (
              <li key={c} className="flex items-start gap-2 text-sm text-foreground-muted">
                <span className="mt-1 text-error">!</span>
                {c}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Love Style */}
      <div className="mt-8">
        <Eyebrow><Heart className="inline h-3 w-3 mr-1" />Love Style</Eyebrow>
        <Card className="mt-3 p-6">
          <p className="text-base leading-relaxed text-foreground-muted">{sign.loveStyle}</p>
          <Link href={`/compatibility?sign1=${sign.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
            Check {sign.name} compatibility <ArrowLeft className="h-3 w-3 rotate-180" />
          </Link>
        </Card>
      </div>

      {/* Career */}
      <div className="mt-8">
        <Eyebrow><Briefcase className="inline h-3 w-3 mr-1" />Career Strengths</Eyebrow>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sign.careerStrengths.map((career) => (
            <Card key={career} className="p-4">
              <p className="text-sm text-foreground-muted">{career}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Facts */}
      <div className="mt-8">
        <Eyebrow>Quick Facts</Eyebrow>
        <Card className="mt-3 p-6">
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-foreground-subtle">Element</dt>
              <dd className="font-medium text-foreground">{sign.element}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-subtle">Modality</dt>
              <dd className="font-medium text-foreground">{sign.modality}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-subtle">Ruling Planet</dt>
              <dd className="font-medium text-foreground">{rulingPlanet.glyph} {rulingPlanet.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-subtle">Lucky Day</dt>
              <dd className="font-medium text-foreground">{sign.luckyDay}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-subtle">Colour</dt>
              <dd className="font-medium text-foreground">{sign.color}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-subtle">Body Part</dt>
              <dd className="font-medium text-foreground">{sign.bodyParts}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs text-foreground-subtle">{elementDescriptions[sign.element]}</p>
            {oppositeSign && (
              <p className="mt-2 text-xs text-foreground-subtle">
                Opposite sign: {oppositeSign.glyph} {oppositeSign.name} — the mirror that completes you.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Jehana's Reading + From the Book */}
      {await (async () => {
        const reading = await generateSignReading(sign);
        if (!reading) return null;
        return (
          <div className="mt-8">
            {/* Jehana's Interpretation */}
            {reading.interpretation && (
              <div className="mb-6">
                <Eyebrow><Sparkles className="inline h-3 w-3 mr-1" />Jehana&apos;s Reading</Eyebrow>
                <p className="mt-2 text-xs text-foreground-subtle">
                  An AI interpretation grounded in the book&apos;s wisdom.
                </p>
                <Card className="mt-3 p-5">
                  <p className="text-base leading-relaxed text-foreground">{reading.interpretation}</p>
                </Card>
              </div>
            )}

            {/* Source Text */}
            <Eyebrow><BookOpen className="inline h-3 w-3 mr-1" />Source Text from the Book</Eyebrow>
            <p className="mt-2 text-xs text-foreground-subtle">
              Passages from &ldquo;Astrology: Its Technics and Ethics&rdquo; by C.A.Q. Libra (1917),
              retrieved via semantic search.
            </p>
            <div className="mt-4 space-y-3">
              {reading.sources.map((chunk, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-primary">Ch.{chunk.chapter_num}: {chunk.chapter_title}</span>
                    {chunk.score !== undefined && (
                      <span className="text-foreground-subtle">{Math.round(chunk.score * 100)}% match</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground-muted line-clamp-4">
                    &ldquo;{chunk.text}&rdquo;
                  </p>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}

      {/* CTA */}
      <div className="mt-10 text-center">
        <OrnateDivider className="mb-6 max-w-xs" />
        <Link href={`/horoscope/${sign.id}`} className="btn-primary">
          <Star className="h-4 w-4" />
          Read Today&apos;s {sign.name} Horoscope
        </Link>
      </div>
    </div>
  );
}