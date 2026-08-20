import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { zodiacSigns, getSignById, elementColors, elementDescriptions } from "@/lib/astrology/signs";
import { generateAIHoroscope } from "@/lib/astrology/horoscope-ai";
import { Eyebrow, Card, OrnateDivider } from "@/components/shared/ui-primitives";
import { ShareButton } from "@/components/shared/share-button";
import { planets } from "@/lib/astrology/planets";

export function generateStaticParams() {
  return zodiacSigns.map((sign) => ({ sign: sign.id }));
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/horoscope/[sign]">) {
  const { sign } = await params;
  const signData = getSignById(sign);
  if (!signData) return { title: "Horoscope" };
  return {
    title: `${signData.name} Daily Horoscope`,
    description: `Today's horoscope for ${signData.name}. Book-grounded AI reading with real planetary transits.`,
  };
}

export default async function SignHoroscopePage({ params }: PageProps<"/horoscope/[sign]">) {
  const { sign: signId } = await params;
  const sign = getSignById(signId);
  if (!sign) notFound();

  const today = new Date();

  let daily, weekly;
  try {
    [daily, weekly] = await Promise.all([
      generateAIHoroscope(sign, today, "daily"),
      generateAIHoroscope(sign, today, "weekly"),
    ]);
  } catch {
    notFound();
  }

  const rulingPlanet = planets.find((p) => p.id === sign.rulingPlanet.toLowerCase()) || planets[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <Link href="/horoscope" className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        All horoscopes
      </Link>

      {/* Sign Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl"
            style={{ background: `${elementColors[sign.element]}15` }}
          >
            {sign.glyph}
          </div>
          <ShareButton
            title={`${sign.name} Daily Horoscope — Astrolo`}
            text={`Today's horoscope for ${sign.name}: ${daily.content.slice(0, 100)}...`}
          />
        </div>
        <Eyebrow className="mt-4">{sign.element} · {sign.modality}</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          {sign.name}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">{sign.dates}</p>
        <p className="mt-1 text-xs text-foreground-subtle">
          Ruled by {rulingPlanet.glyph} {rulingPlanet.name}
        </p>
      </div>

      <OrnateDivider className="my-8" />

      {/* Daily Reading */}
      <div className="mb-8">
        <Eyebrow>Today · {today.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</Eyebrow>
        <Card className="mt-3 p-6">
          <p className="text-base leading-relaxed text-foreground">{daily.content}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
              Lucky number: {daily.luckyNumber}
            </span>
            <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
              Colour: {daily.luckyColor}
            </span>
            {daily.retrogrades.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground-muted">
                ℞ Retrogrades: {daily.retrogrades.join(", ")}
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Book Sources */}
      {daily.sources.length > 0 && (
        <div className="mb-8">
          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground-muted hover:text-primary">
              <BookOpen className="h-4 w-4" />
              From the Book ({daily.sources.length} passages)
            </summary>
            <div className="mt-3 space-y-3">
              {daily.sources.map((s, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium text-primary">Ch.{s.chapter_num}: {s.chapter_title}</span>
                    {s.score !== undefined && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{(s.score * 100).toFixed(0)}% match</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground-muted">{s.text}</p>
                </Card>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Weekly Reading */}
      <div className="mb-8">
        <Eyebrow>This Week</Eyebrow>
        <Card className="mt-3 p-6">
          <p className="text-base leading-relaxed text-foreground-muted">{weekly.content}</p>
        </Card>
      </div>

      {/* Sign Quick Facts */}
      <Card className="p-6">
        <Eyebrow>About {sign.name}</Eyebrow>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
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
            <dd className="font-medium text-foreground">{rulingPlanet.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-subtle">Lucky Day</dt>
            <dd className="font-medium text-foreground">{sign.luckyDay}</dd>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
          {elementDescriptions[sign.element]}
        </p>
        <Link href={`/signs/${sign.id}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover">
          Read full {sign.name} profile
        </Link>
      </Card>
    </div>
  );
}
