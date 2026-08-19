import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Eyebrow, Card, OrnateDivider } from "@/components/shared/ui-primitives";

const chapters: Record<number, { title: string; content: string[]; locked: boolean }> = {
  1: {
    title: "Introduction",
    locked: false,
    content: [
      "Astrology has been discredited not by those who studied it, but by those who did not. The student who approaches with patience and humility will find in the stars not a substitute for will, but a map of tendencies, a calendar of the soul's seasons.",
      "One reason astrology has been discredited is that it has been practiced by those without knowledge, and judged by those without experience. A university of astrology, properly conducted, would restore the science to its rightful place among the instruments of self-knowledge.",
      "Great men and women have studied astrology throughout history. Arabian, Chaldean, and Egyptian priest-astrologers laid its foundations. Thomas Aquinas, Albertus Magnus, Dante, and Tycho Brahe all studied the stars. Those who were born at exactly the same time share remarkable similarities — evidence that the cosmic moment of birth imprints something enduring.",
      "The laws of karma and reincarnation provide the philosophical framework. Astrology does not require belief in these laws, but it is enriched by them. The ego — the true self — uses the birth moment as a starting point for another chapter in a longer journey.",
      "The use of astrology is practical. It helps us make the most of our time, combined with medical science, and guides us in what to do and what to leave undone. It is a tool for conscious living, not a substitute for consciousness itself.",
    ],
  },
  2: {
    title: "The Cosmos",
    locked: false,
    content: [
      "The solar system is our immediate cosmos — a family of bodies revolving around a central sun. The sun is the heart of the system, the source of life and the centre around which all else moves.",
      "The backward movement of the equinox — the precession — means that the sign visible at the vernal point shifts over approximately 25,920 years. This great cycle, known as the Platonic Year, carries the whole zodiac past the equinox.",
      "Geocentric astrology, which places the earth at the centre, is not a rejection of Copernicus. It is a practical choice. We read the chart as it appears from the place where life is lived — the earth. The heliocentric and geocentric systems are two descriptions of the same reality.",
      "Sidereal time — the time measured by the stars rather than the sun — is essential for calculating the houses of a natal chart. It connects the moment of birth to the great wheel of the cosmos.",
    ],
  },
};

export default async function BookChapterPage({ params }: PageProps<"/book/[chapter]">) {
  const { chapter } = await params;
  const chapterNum = parseInt(chapter);
  const ch = chapters[chapterNum];

  if (!ch) {
    const allChapters = [3, 4, 5, 6, 7, 8, 9, 10];
    if (allChapters.includes(chapterNum)) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-20">
          <Link href="/book" className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Library
          </Link>
          <Card className="p-12 text-center">
            <Lock className="mx-auto h-10 w-10 text-primary/40" />
            <h1 className="heading-serif mt-4 text-2xl font-semibold text-foreground">
              Chapter {chapterNum}
            </h1>
            <p className="mt-2 text-sm text-foreground-muted">
              This chapter is available to Premium members.
            </p>
            <Link href="/pricing" className="btn-primary mt-6">
              Unlock with Premium
            </Link>
          </Card>
        </div>
      );
    }
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <Link href="/book" className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All chapters
      </Link>

      <div className="text-center">
        <Eyebrow>Chapter {chapterNum}</Eyebrow>
        <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
          {ch.title}
        </h1>
      </div>

      <OrnateDivider className="my-8" />

      <article className="prose-astrolo">
        {ch.content.map((para, i) => (
          <p key={i} className="mb-6 text-base leading-relaxed text-foreground-muted first-letter:font-serif first-letter:text-3xl first-letter:font-semibold first-letter:text-primary first-letter:mr-0.5">
            {para}
          </p>
        ))}
      </article>

      <OrnateDivider className="my-8" />

      <div className="flex justify-between">
        {chapterNum > 1 ? (
          <Link href={`/book/${chapterNum - 1}`} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : <span />}
        <Link href={`/book/${chapterNum + 1}`} className="btn-ghost">
          Next chapter
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    </div>
  );
}