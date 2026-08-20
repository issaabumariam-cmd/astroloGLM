import fs from "fs";
import path from "path";
import { Eyebrow, Card, Tag } from "@/components/shared/ui-primitives";
import { BookOpen, Lock } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Astrology Library",
  description: "A digitised classic astrology text — searchable, structured, and accessible. The wisdom of C.A.Q. Libra's 1917 masterwork.",
};

// Chapters that are free to read (the rest are premium)
const FREE_CHAPTERS = [1, 2];

type Chapter = {
  chapter_num: number;
  title: string;
  content: string;
  chunk_count: number;
};

function getChapters(): Chapter[] {
  try {
    const filePath = path.join(process.cwd(), "data", "book_chapters.json");
    if (!fs.existsSync(filePath)) return [];
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default function BookPage() {
  const chapters = getChapters();
  const totalChunks = chapters.reduce((s, c) => s + (c.chunk_count || 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-10 text-center">
        <Eyebrow>Classical Wisdom · 14 Chapters · {totalChunks} Passages</Eyebrow>
        <h1 className="heading-serif mt-2 text-4xl font-semibold text-foreground sm:text-5xl">
          The Library
        </h1>
        <p className="mt-3 text-sm text-foreground-muted">
          &ldquo;Astrology: Its Technics and Ethics&rdquo; by C.A.Q. Libra (1917) — a foundational
          text bridging classical and modern astrology, covering aspects, houses, planets, signs,
          synastry, karma, and the ethical practice of astrological guidance.
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
            <p className="text-sm text-foreground-muted">C.A.Q. Libra · 1917 · 282 pages · 14 chapters</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              A foundational text that covers the calculation of horoscopes, the meaning of planetary
              aspects, the twelve houses, the signs of the zodiac, the nature of the planets,
              compatibility and synastry, karma and reincarnation, and the ethical use of astrological
              knowledge. This is the same book that powers our AI advisor&apos;s knowledge base.
            </p>
          </div>
        </div>
      </Card>

      {chapters.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-foreground-muted">
            Book data not found. Run <code className="rounded bg-surface-muted px-2 py-0.5 text-xs">npx tsx scripts/ingest-book-v3.ts</code> to generate it.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {chapters.map((ch) => {
            const isFree = FREE_CHAPTERS.includes(ch.chapter_num);
            return (
              <Card key={ch.chapter_num} hover className="p-5">
                <Link href={`/book/${ch.chapter_num}`} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-primary">
                        Ch. {ch.chapter_num}
                      </span>
                      {isFree ? (
                        <Tag className="text-[10px] bg-success/10 text-success">Free</Tag>
                      ) : (
                        <Lock className="h-3 w-3 text-foreground-subtle" />
                      )}
                    </div>
                    <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                      {ch.title}
                    </h3>
                    <p className="mt-1 text-sm text-foreground-muted line-clamp-2">
                      {ch.content?.substring(0, 150).replace(/\s+/g, " ") || "No preview available"}...
                    </p>
                    <p className="mt-2 text-xs text-foreground-subtle">
                      {ch.chunk_count || 0} passages · {Math.round((ch.content?.length || 0) / 1000)}K characters
                    </p>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-8 bg-surface-muted/30 p-6 text-center">
        <Eyebrow>Unlock the Full Library</Eyebrow>
        <p className="mt-2 text-sm text-foreground-muted">
          Premium members get access to all 14 chapters, searchable text, and AI-assisted
          exploration of this classic work — the same knowledge base that powers Jehana.
        </p>
        <Link href="/pricing" className="btn-secondary mt-4">Explore Premium</Link>
      </Card>
    </div>
  );
}