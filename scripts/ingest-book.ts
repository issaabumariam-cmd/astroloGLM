import fs from "fs";
import path from "path";

const BOOK_TEXT_PATH = path.join(process.cwd(), "data", "book_clean.txt");
const OUTPUT_DIR = path.join(process.cwd(), "data");

const CHAPTERS = [
  { num: 1, title: "Introduction", keywords: ["INTRODUCTION", "astrology being discredited", "empirical science", "university of astrology"] },
  { num: 2, title: "The Cosmos", keywords: ["COSMOS", "solar system", "Central Sun", "Equinox", "Sidereal time"] },
  { num: 3, title: "Fate and Free Will", keywords: ["FATE", "FREE WILL", "Harmony", "Disharmony", "Evil", "physician intervenes"] },
  { num: 4, title: "The Aspects", keywords: ["ASPECTS", "phases of the planets", "favourable", "unfavourable"] },
  { num: 5, title: "Strong and Weak Natures", keywords: ["STRONG", "WEAK", "fear", "inharmonious aspects", "forewarned"] },
  { num: 6, title: "The Use of Astrology", keywords: ["USE OF ASTROLOGY", "make the most of our time", "medical science"] },
  { num: 7, title: "The Houses", keywords: ["HOUSES", "first house", "second house", "twelfth house"] },
  { num: 8, title: "The Planets", keywords: ["PLANETS", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] },
  { num: 9, title: "The Signs", keywords: ["SIGNS", "Aries", "Taurus", "Pisces", "zodiac"] },
  { num: 10, title: "The Laws of Karma and Reincarnation", keywords: ["KARMA", "REINCARNATION", "Ego", "co-operate", "oppose"] },
];

function cleanText(text: string): string {
  return text
    .replace(/={3,}/g, "\n\n")
    .replace(/-{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .replace(/\.\s+/g, ".\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoChunks(text: string, maxChunkSize = 500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).length > maxChunkSize) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}

function findChapterStart(text: string, keywords: string[]): number {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lineUpper = lines[i].toUpperCase().replace(/\s+/g, "");
    for (const keyword of keywords) {
      const kwClean = keyword.toUpperCase().replace(/\s+/g, "");
      if (lineUpper.includes(kwClean)) {
        return text.indexOf(lines[i]);
      }
    }
  }
  return -1;
}

async function ingestBook() {
  console.log("📖 Astrolo Book Ingestion Script");
  console.log("=================================\n");

  if (!fs.existsSync(BOOK_TEXT_PATH)) {
    console.error(`❌ Book text file not found at: ${BOOK_TEXT_PATH}`);
    console.error("   Run the PDF extraction first (see README)");
    process.exit(1);
  }

  console.log("📄 Reading extracted text...");
  const rawText = fs.readFileSync(BOOK_TEXT_PATH, "utf-8");
  console.log(`   ✓ ${rawText.length} characters read\n`);

  console.log("🧹 Cleaning text...");
  const cleanedText = cleanText(rawText);
  console.log(`   ✓ ${cleanedText.length} characters after cleaning\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("📚 Identifying chapters...");
  const chapters: {
    num: number;
    title: string;
    content: string;
    chunks: string[];
    pageStart: number;
    pageEnd: number;
  }[] = [];

  const chapterPositions: { num: number; title: string; start: number }[] = [];

  for (const chapter of CHAPTERS) {
    const pos = findChapterStart(cleanedText, chapter.keywords);
    if (pos >= 0) {
      chapterPositions.push({ num: chapter.num, title: chapter.title, start: pos });
      console.log(`   ✓ Chapter ${chapter.num}: ${chapter.title} found at position ${pos}`);
    } else {
      console.log(`   ⚠ Chapter ${chapter.num}: ${chapter.title} not found`);
    }
  }

  chapterPositions.sort((a, b) => a.start - b.start);

  for (let i = 0; i < chapterPositions.length; i++) {
    const chapter = chapterPositions[i];
    const nextStart = i + 1 < chapterPositions.length ? chapterPositions[i + 1].start : cleanedText.length;
    const content = cleanedText.slice(chapter.start, nextStart).trim();
    const chunks = splitIntoChunks(content);

    chapters.push({
      num: chapter.num,
      title: chapter.title,
      content,
      chunks,
      pageStart: 0,
      pageEnd: 0,
    });

    console.log(`   📖 Chapter ${chapter.num}: ${chapter.title} — ${content.length} chars, ${chunks.length} chunks`);
  }

  console.log("\n💾 Writing output files...");
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "book_chapters.json"),
    JSON.stringify(chapters, null, 2),
    "utf-8"
  );
  console.log(`   ✓ book_chapters.json (${chapters.length} chapters)`);

  const allChunks = chapters.flatMap((ch) =>
    ch.chunks.map((chunk, idx) => ({
      chapter_num: ch.num,
      chapter_title: ch.title,
      chunk_index: idx,
      text: chunk,
    }))
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "book_chunks.json"),
    JSON.stringify(allChunks, null, 2),
    "utf-8"
  );
  console.log(`   ✓ book_chunks.json (${allChunks.length} chunks)`);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "book_full.txt"),
    cleanedText,
    "utf-8"
  );
  console.log(`   ✓ book_full.txt (cleaned full text)`);

  console.log("\n✅ Ingestion complete!");
  console.log(`\n📊 Summary:`);
  console.log(`   Chapters: ${chapters.length}`);
  console.log(`   Total chunks: ${allChunks.length}`);
  console.log(`   Total text: ${cleanedText.length} characters`);
  console.log(`\n💡 Next step: Run the embedding script to generate vectors for RAG.`);
}

ingestBook().catch(console.error);