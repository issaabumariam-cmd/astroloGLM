import fs from "fs";
import path from "path";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
const CHUNKS_FILE = path.join(process.cwd(), "data", "book_chunks.json");
const OUTPUT_FILE = path.join(process.cwd(), "data", "book_chunks_embedded.json");

type Chunk = {
  chapter_num: number;
  chapter_title: string;
  chunk_index: number;
  text: string;
  embedding?: number[];
};

async function embedText(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.embedding || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("🔮 Astrolo Embedding Script");
  console.log("============================\n");

  if (!fs.existsSync(CHUNKS_FILE)) {
    console.error("❌ book_chunks.json not found. Run ingest-book.ts first.");
    process.exit(1);
  }

  const chunks: Chunk[] = JSON.parse(fs.readFileSync(CHUNKS_FILE, "utf-8"));
  console.log(`📄 Loaded ${chunks.length} chunks\n`);

  console.log(`🔮 Embedding with ${EMBED_MODEL} at ${OLLAMA_URL}...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`\r   [${i + 1}/${chunks.length}] Embedding chunk ${chunk.chunk_index} (ch.${chunk.chapter_num})...`);

    const embedding = await embedText(chunk.text);
    if (embedding) {
      chunk.embedding = embedding;
      success++;
    } else {
      failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log(`\n\n✅ Embedded: ${success}`);
  console.log(`❌ Failed: ${failed}`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chunks), "utf-8");
  console.log(`\n💾 Written to ${OUTPUT_FILE}`);
  console.log(`   File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1)} MB`);

  console.log("\n✅ Embedding complete! RAG is now ready.");
}

main().catch(console.error);