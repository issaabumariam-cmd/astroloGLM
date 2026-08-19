import { Eyebrow, Card } from "@/components/shared/ui-primitives";
import { BookOpen, Lock } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Astrology Library",
  description: "A digitised classic astrology text — searchable, structured, and accessible. The wisdom of C.A.Q. Libra's 1917 masterwork.",
};

// Placeholder chapters — will be populated from book ingestion
const chapters = [
  { num: 1, title: "Introduction", preview: "The foundations of astrology, its scientific basis, and its proper use...", locked: false },
  { num: 2, title: "The Cosmos", preview: "The solar system, the central sun, and the movements that govern our lives...", locked: false },
  { num: 3, title: "Fate and Free Will", preview: "The relationship between cosmic influence and personal choice...", locked: true },
  { num: 4, title: "The Aspects", preview: "The phases of the planets and how their angles shape our experience...", locked: true },
  { num: 5, title: "Strong and Weak Natures", preview: "How character is shown in the chart and how fear strengthens negative aspects...", locked: true },
  { num: 6, title: "The Houses", preview: "The twelve departments of life and their rulership...", locked: true },
  { num: 7, title: "The Planets", preview: "The influences of the celestial bodies on human life...", locked: true },
  { num: 8, title: "The Signs", preview: "The twelve zodiac signs and their characteristics...", locked: true },
  { num: 9, title: "The Use of Astrology", preview: "Practical application of astrological knowledge in daily life...", locked: true },
  { num: 10, title: "The Laws of Karma", preview: "Reincarnation, causation, and the deeper philosophical basis...", locked: true },
];

export default function BookPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <Eyebrow>Classical Wisdom</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          The Library
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          &ldquo;Astrology: Its Technics and Ethics&rdquo; by C.A.Q. Libra (1917) — a foundational
          text of modern astrology, digitised and structured for the modern reader.
        </p>
      </div>

      <Card className="mb-8 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Astrology: Its Technics and Ethics
            </h2>
            <p className="text-sm text-foreground-muted">C.A.Q. Libra · 1917 · 282 pages</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              A foundational text that bridges classical and modern astrology, covering
              aspects, houses, planets, karma, and the ethical practice of astrological guidance.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {chapters.map((ch) => (
          <Card key={ch.num} hover className="p-5">
            <Link href={`/book/${ch.num}`} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-primary">Ch. {ch.num}</span>
                  {ch.locked && <Lock className="h-3 w-3 text-foreground-subtle" />}
                </div>
                <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                  {ch.title}
                </h3>
                <p className="mt-1 text-sm text-foreground-muted line-clamp-1">{ch.preview}</p>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-surface-muted/30 p-6 text-center">
        <Eyebrow>Unlock the Full Library</Eyebrow>
        <p className="mt-2 text-sm text-foreground-muted">
          Premium members get access to all chapters, searchable text, and AI-assisted
          exploration of this classic work.
        </p>
        <Link href="/pricing" className="btn-secondary mt-4">
          Explore Premium
        </Link>
      </Card>
    </div>
  );
}