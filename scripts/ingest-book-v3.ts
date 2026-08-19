import fs from "fs";
import path from "path";

const INPUT = path.join(process.cwd(), "data", "book_clean.txt");
const OUTPUT_DIR = path.join(process.cwd(), "data");

// Verified chapter markers — positions found by analyzing the actual text
const CHAPTERS: { title: string; pattern: RegExp }[] = [
  { title: "Introduction", pattern: /One reason of astrology being discredited|astrology being discredited/i },
  { title: "Karma and Reincarnation", pattern: /Laws of Karma and Reincarnation/i },
  { title: "The Use of Astrology", pattern: /The Use of Astrology\. From that which precedes/i },
  { title: "The Aspects", pattern: /The Aspects\. Aspect means/i },
  { title: "The Cosmos", pattern: /the Cosmos\. If the same tone/i },
  { title: "Strong and Weak Natures", pattern: /Strong and Weak Natures\./i },
  { title: "Ephemeris and Sidereal Time", pattern: /Ephemeris\) the position of the planets/i },
  { title: "Fate and Free Will", pattern: /Fate and Free.?will\.|Harmony, Disharmony/i },
  { title: "Pre-natal Horoscope", pattern: /Pre.?natal Horoscope/i },
  { title: "Example Horoscopes", pattern: /Birth-Horoscope for the Hague/i },
  { title: "The Signs", pattern: /Sign Sign Good Manifestation|Aries the Ram/i },
  { title: "The Planets", pattern: /The Aspects of and \$ with G>d/i },
  { title: "The Houses", pattern: /The 1st house or ascendant represents/i },
  { title: "Synastry and Compatibility", pattern: /Two horoscopes may be compared/i },
];

function cleanText(text: string): string {
  return text
    .replace(/=== PAGE \d+ ===/g, "")
    .replace(/Please provide the OCR text you would like me to clean up\.?/gi, "")
    .replace(/\s+/g, " ")
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
  console.log("📖 Astrolo Book Ingestion v3 (Verified Chapters)");
  console.log("================================================\n");

  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Not found: ${INPUT}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, "utf-8");
  console.log(`📄 Read ${raw.length} chars\n`);

  // Remove LLM artifacts
  const cleanedRaw = raw.replace(/Please provide the OCR text you would like me to clean up\.?/gi, "");
  console.log(`🧹 Cleaned to ${cleanedRaw.length} chars\n`);

  // Find all chapter positions
  console.log("📚 Finding chapter positions...");
  const foundChapters: { title: string; startPos: number }[] = [];

  for (const marker of CHAPTERS) {
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

  // If nothing found before position 5000, add Introduction at 0
  if (foundChapters.length === 0 || foundChapters[0].startPos > 5000) {
    foundChapters.unshift({ title: "Introduction", startPos: 0 });
  }

  console.log(`\n📊 Found ${foundChapters.length} chapters\n`);

  // Extract chapter content and chunk
  const chapters: { num: number; title: string; content: string; chunks: string[] }[] = [];

  for (let i = 0; i < foundChapters.length; i++) {
    const chapter = foundChapters[i];
    const endPos = i + 1 < foundChapters.length ? foundChapters[i + 1].startPos : cleanedRaw.length;
    const content = cleanText(cleanedRaw.slice(chapter.startPos, endPos));

    // Skip very short sections (< 100 chars)
    if (content.length < 100) {
      console.log(`   ⏭ Ch.${i + 1}: ${chapter.title} — too short (${content.length} chars), skipping`);
      continue;
    }

    const chunks = splitIntoChunks(content);
    chapters.push({ num: i + 1, title: chapter.title, content, chunks });
    console.log(`   📖 Ch.${chapters.length}: ${chapter.title} — ${content.length} chars, ${chunks.length} chunks`);
  }

  const totalChunks = chapters.reduce((s, c) => s + c.chunks.length, 0);
  console.log(`\n📊 Total: ${chapters.length} chapters, ${totalChunks} chunks\n`);

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
  console.log("=".repeat(70));
  chapters.forEach((c) => {
    const bar = "█".repeat(Math.min(40, Math.round(c.chunks.length / 5)));
    console.log(`  Ch.${String(c.num).padStart(2)} ${c.title.padEnd(35)} ${String(c.chunks.length).padStart(4)} chunks ${bar}`);
  });
  console.log("=".repeat(70));
  console.log(`  ${"TOTAL".padEnd(38)} ${String(allChunks.length).padStart(4)} chunks`);
}

main().catch(console.error);