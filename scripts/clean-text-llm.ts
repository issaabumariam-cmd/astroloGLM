import fs from "fs";
import path from "path";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";
const INPUT = path.join(process.cwd(), "data", "book_full_text.txt");
const OUTPUT = path.join(process.cwd(), "data", "book_clean.txt");

const SYSTEM_PROMPT = `You are a text cleanup tool. You receive OCR text from a 1917 astrology book that has missing spaces between words. Your job:

1. Insert spaces between words that were joined together by OCR errors
2. Fix obvious OCR character errors (e.g. "Mrch" → "March", "Febr" → "February")
3. Preserve all original meaning — do NOT add, remove, or change content
4. Preserve page markers like "=== PAGE 5 ===" exactly as-is
5. Preserve astrological symbols (☉☽☿♀♂♃♄♅♆♇) and degree/minute notation
6. Do NOT translate, summarize, or rephrase — only fix spacing and obvious OCR errors
7. Output ONLY the cleaned text, no commentary

Example input: "ahoroscopeisactuallythepositionofthe12zodiacalsigns"
Example output: "a horoscope is actually the position of the 12 zodiacal signs"

Example input: "Meaningofthe12Houses"
Example output: "Meaning of the 12 Houses"`;

async function cleanChunk(text: string): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        options: {
          temperature: 0.1,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) return text;

    const data = await response.json();
    const cleaned = data.message?.content?.trim();

    if (!cleaned || cleaned.length < text.length * 0.5) {
      return text;
    }

    return cleaned;
  } catch {
    return text;
  }
}

async function main() {
  console.log("🔮 Astrolo LLM-Powered Text Cleanup");
  console.log("====================================\n");

  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Not found: ${INPUT}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, "utf-8");
  console.log(`📄 Read ${raw.length} chars\n`);

  // Split by page markers, preserving them
  const parts = raw.split(/(=== PAGE \d+ ===)/);
  const chunks: { marker: boolean; text: string }[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].match(/=== PAGE \d+ ===/)) {
      chunks.push({ marker: true, text: parts[i] });
    } else if (parts[i].trim()) {
      // Split large page texts into ~1000 char sub-chunks for the LLM
      const pageText = parts[i].trim();
      if (pageText.length > 1200) {
        const sentences = pageText.match(/.{1,1200}/g) || [pageText];
        for (const s of sentences) {
          chunks.push({ marker: false, text: s });
        }
      } else {
        chunks.push({ marker: false, text: pageText });
      }
    }
  }

  console.log(`📊 ${chunks.length} chunks to clean\n`);

  // Load progress if exists
  let progress = 0;
  if (fs.existsSync(OUTPUT)) {
    const existing = fs.readFileSync(OUTPUT, "utf-8");
    const lines = existing.split("\n");
    progress = parseInt(lines[0]?.match(/PROGRESS:(\d+)/)?.[1] || "0");
    console.log(`📍 Resuming from progress ${progress}\n`);
  }

  let output = "";
  let success = 0;
  let failed = 0;

  for (let i = progress; i < chunks.length; i++) {
    const chunk = chunks[i];

    if (chunk.marker) {
      output += "\n" + chunk.text + "\n";
      process.stdout.write(`\r   [${i + 1}/${chunks.length}] Marker: ${chunk.text.trim()}`);
    } else {
      process.stdout.write(`\r   [${i + 1}/${chunks.length}] Cleaning ${chunk.text.length} chars...     `);
      const cleaned = await cleanChunk(chunk.text);
      if (cleaned !== chunk.text) {
        success++;
      } else {
        failed++;
      }
      output += cleaned + "\n";
    }

    // Save progress every 10 chunks
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(OUTPUT, `PROGRESS:${i + 1}\n${output}`, "utf-8");
    }
  }

  // Final write without progress marker
  fs.writeFileSync(OUTPUT, output.trim(), "utf-8");
  console.log(`\n\n✅ Cleaned: ${success}`);
  console.log(`⏭ Skipped: ${failed}`);
  console.log(`💾 Written to ${OUTPUT}`);
  console.log(`   Size: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB`);

  // Show sample
  console.log("\n📝 Sample (first 800 chars):");
  console.log(output.slice(0, 800));

  console.log("\n✅ Cleanup complete! Re-run ingest-book.ts to re-chunk.");
}

main().catch(console.error);