import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Eyebrow, Card, OrnateDivider, Tag } from "@/components/shared/ui-primitives";

const FREE_CHAPTERS = [1, 2];

type Chapter = {
  chapter_num: number;
  title: string;
  content: string;
  chunk_count: number;
};

function getChapter(num: number): Chapter | null {
  try {
    const filePath = path.join(process.cwd(), "data", "book_chapters.json");
    if (!fs.existsSync(filePath)) return null;
    const data: Chapter[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.find((c) => c.chapter_num === num) || null;
  } catch {
    return null;
  }
}

function cleanContent(content: string): string[] {
  return content
    .replace(/=== PAGE \d+ ===/g, "")
    .replace(/Please provide the OCR text.*?\./gi, "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

export async function generateStaticParams() {
  try {
    const filePath = path.join(process.cwd(), "data", "book_chapters.json");
    if (!fs.existsSync(filePath)) return [];
    const data: Chapter[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.map((ch) => ({ chapter: String(ch.chapter_num) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/book/[chapter]">) {
  const { chapter } = await params;
  const num = parseInt(chapter);
  const ch = getChapter(num);
  if (!ch) return { title: "Library" };
  return {
    title: `${ch.title} — Library`,
    description: ch.content?.substring(0, 160).replace(/\s+/g, " "),
  };
}

export default async function BookChapterPage({ params }: PageProps<"/book/[chapter]">) {
  const { chapter } = await params;
  const num = parseInt(chapter);
  const ch = getChapter(num);

  if (!ch) notFound();

  const isFree = FREE_CHAPTERS.includes(num);

  if (!isFree) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-20">
        <Link href="/book" className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> All chapters
        </Link>
        <Card className="p-12 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary/40" />
          <h1 className="heading-serif mt-4 text-2xl font-semibold text-foreground">
            Chapter {num}: {ch.title}
          </h1>
          <p className="mt-2 text-sm text-foreground-muted">
            {ch.chunk_count} passages · {Math.round((ch.content?.length || 0) / 1000)}K characters
          </p>
          <p className="mt-4 text-sm text-foreground-muted">
            This chapter is available to Premium members. Unlock all 14 chapters of
            C.A.Q. Libra&apos;s foundational astrology text.
          </p>
          <Link href="/pricing" className="btn-primary mt-6">
            Unlock with Premium
          </Link>
        </Card>
      </div>
    );
  }

  const paragraphs = cleanContent(ch.content || "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
      <Link href="/book" className="mb-6 inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All chapters
      </Link>

      <div className="text-center">
        <Eyebrow>Chapter {num} · {ch.chunk_count} passages</Eyebrow>
        <h1 className="heading-serif mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
          {ch.title}
        </h1>
        <Tag className="mt-3 bg-success/10 text-success">Free Chapter</Tag>
      </div>

      <OrnateDivider className="my-8" />

      <article className="space-y-4">
        {paragraphs.map((para, i) => (
          <p
            key={i}
            className="text-base leading-relaxed text-foreground-muted first-letter:font-serif first-letter:text-3xl first-letter:font-semibold first-letter:text-primary first-letter:mr-0.5"
          >
            {para}
          </p>
        ))}
      </article>

      <OrnateDivider className="my-8" />

      <div className="flex justify-between">
        {num > 1 ? (
          <Link href={`/book/${num - 1}`} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Link>
        ) : <span />}
        {num < 14 && (
          <Link href={`/book/${num + 1}`} className="btn-ghost">
            Next chapter
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        )}
      </div>
    </div>
  );
}