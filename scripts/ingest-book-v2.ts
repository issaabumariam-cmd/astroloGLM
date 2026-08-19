import fs from "fs";
import path from "path";

const INPUT = path.join(process.cwd(), "data", "book_clean.txt");
const OUTPUT_DIR = path.join(process.cwd(), "data");

// Chapter markers found by analyzing the book text — ordered by position in text
// Each has: name, search pattern, and approximate char position
const CHAPTER_MARKERS: { title: string; pattern: RegExp; approxPos: number }[] = [
  { title: "Introduction", pattern: /One reason of astrology being discredited|astrology being discredited|Is astrology an empirical/i, approxPos: 0 },
  { title: "The Cosmos", pattern: /The Cosmos|The solar systems|solar system.*led by logic/i, approxPos: 4500 },
  { title: "The Signs", pattern: /The signs in the sky and the celestial bodies existed before/i, approxPos: 3000 },
  { title: "The Planets", pattern: /The Planets|the planets on the vegetable/i, approxPos: 4500 },
  { title: "The Aspects", pattern: /The Aspects\. Aspect means/i, approxPos: 21000 },
  { title: "The Use of Astrology", pattern: /The Use of Astrology\. From that which precedes/i, approxPos: 18500 },
  { title: "Strong and Weak Natures", pattern: /Strong and Weak Natures\. Timorous people/i, approxPos: 23500 },
  { title: "Fate and Free Will", pattern: /Fate and Free.?will\.|Fate and Free-will/i, approxPos: 34500 },
  { title: "The Houses", pattern: /The houses in every horoscope represent the physical body|Meaning of the 12 Houses/i, approxPos: 47000 },
  { title: "Karma and Reincarnation", pattern: /Laws of Karma and Reincarnation/i, approxPos: 9800 },
  { title: "Synastry and Compatibility", pattern: /Two horoscopes may be compared together|sympathy and there antipathy/i, approxPos: 55000 },
  { title: "Pre-natal Horoscope", pattern: /Pre.?natal Horoscope|pre-natal horoscope/i, approxPos: 60000 },
  { title: "Tables and Ephemeris", pattern: /TABLES OF HOUSES|EPHEMERIS/i, approxPos: 580000 },
];

function cleanText(text: string): string {
  return text
    .replace(/=== PAGE \d+ ===/g, "")
    .replace(/PAGE \d+/g, "")
    .replace(/\s+/g, " ")
    .replace(/Please provide the OCR text you would like me to clean up\.?/gi, "")
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
  return chunks.filter((c) => c.length > 20);
}

async function main() {
  console.log("📖 Astrolo Book Ingestion v2 (Fixed Chapters)");
  console.log("=============================================\n");

  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Not found: ${INPUT}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, "utf-8");
  console.log(`📄 Read ${raw.length} chars\n`);

  // Remove LLM artifacts
  const cleanedRaw = raw.replace(/Please provide the OCR text you would like me to clean up\.?/gi, "");
  console.log(`🧹 Cleaned to ${cleanedRaw.length} chars (removed LLM artifacts)\n`);

  // Find all chapter positions
  console.log("📚 Finding chapter positions...");
  const foundChapters: { title: string; startPos: number }[] = [];

  for (const marker of CHAPTER_MARKERS) {
    const match = cleanedRaw.match(marker.pattern);
    if (match && match.index !== undefined) {
      foundChapters.push({ title: marker.title, startPos: match.index });
      console.log(`   ✓ ${marker.title} at char ${match.index}`);
    } else {
      console.log(`   ⚠ ${marker.title} — pattern not found`);
    }
  }

  // Sort by position
  foundChapters.sort((a, b) => a.startPos - b.startPos);

  // If no chapters found, treat whole text as one chapter
  if (foundChapters.length === 0) {
    foundChapters.push({ title: "Complete Text", startPos: 0 });
  }

  // Ensure first chapter starts at 0
  if (foundChapters[0].startPos > 1000) {
    foundChapters.unshift({ title: "Introduction", startPos: 0 });
  }

  console.log(`\n📊 Found ${foundChapters.length} chapters\n`);

  // Extract chapter content and chunk
  const chapters: {
    num: number;
    title: string;
    content: string;
    chunks: string[];
  }[] = [];

  for (let i = 0; i < foundChapters.length; i++) {
    const chapter = foundChapters[i];
    const endPos = i + 1 < foundChapters.length ? foundChapters[i + 1].startPos : cleanedRaw.length;
    const content = cleanText(cleanedRaw.slice(chapter.startPos, endPos));
    const chunks = splitIntoChunks(content);

    // Skip very short chapters (< 200 chars) — likely false matches
    if (content.length < 200) {
      console.log(`   ⏭ Ch.${i + 1}: ${chapter.title} — too short (${content.length} chars), skipping`);
      continue;
    }

    chapters.push({
      num: i + 1,
      title: chapter.title,
      content,
      chunks,
    });

    console.log(`   📖 Ch.${i + 1}: ${chapter.title} — ${content.length} chars, ${chunks.length} chunks`);
  }

  console.log(`\n📊 Total: ${chapters.length} chapters, ${chapters.reduce((s, c) => s + c.chunks.length, 0)} chunks\n`);

  // Write chapters JSON
  const chaptersJson = chapters.map((c) => ({
    chapter_num: c.num,
    title: c.title,
    content: c.content,
    chunk_count: c.chunks.length,
  }));
  fs.writeFileSync(path.join(OUTPUT_DIR, "book_chapters.json"), JSON.stringify(chaptersJson, null, 2), "utf-8");
  console.log("✅ book_chapters.json written");

  // Write chunks JSON
  const allChunks = chapters.flatMap((ch) =>
    ch.chunks.map((chunk, idx) => ({
      chapter_num: ch.num,
      chapter_title: ch.title,
      chunk_index: idx,
      text: chunk,
    }))
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, "book_chunks.json"), JSON.stringify(allChunks, null, 2), "utf-8");
  console.log(`✅ book_chunks.json written (${allChunks.length} chunks)`);

  // Print coverage report
  console.log("\n📋 Coverage Report:");
  console.log("=" .repeat(60));
  chapters.forEach((c) => {
    const bar = "█".repeat(Math.min(40, Math.round(c.chunks.length / 5)));
    console.log(`  Ch.${String(c.num).padStart(2)} ${c.title.padEnd(35)} ${String(c.chunks.length).padStart(4)} chunks ${bar}`);
  });
  console.log("=" .repeat(60));
  console.log(`  ${'TOTAL'.padEnd(38)} ${String(allChunks.length).padStart(4)} chunks`);
}

main().catch(console.error);