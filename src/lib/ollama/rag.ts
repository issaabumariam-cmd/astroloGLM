import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const EMBEDDED_FILE = path.join(DATA_DIR, "book_chunks_embedded.json");
const CHUNKS_FILE = path.join(DATA_DIR, "book_chunks.json");

type Chunk = {
  chapter_num: number;
  chapter_title: string;
  chunk_index: number;
  text: string;
  embedding?: number[];
  score?: number;
};

let cachedChunks: Chunk[] | null = null;
let cachedFileMtime: number | null = null;

function loadChunks(): Chunk[] {
  const file = fs.existsSync(EMBEDDED_FILE) ? EMBEDDED_FILE : fs.existsSync(CHUNKS_FILE) ? CHUNKS_FILE : null;

  if (!file) {
    console.warn("Book chunks not found. Run scripts/ingest-book.ts and scripts/embed-book.ts first.");
    return [];
  }

  const mtime = fs.statSync(file).mtimeMs;

  if (cachedChunks && cachedFileMtime === mtime) {
    return cachedChunks;
  }

  const data = fs.readFileSync(file, "utf-8");
  cachedChunks = JSON.parse(data);
  cachedFileMtime = mtime;
  console.log(`[RAG] Loaded ${cachedChunks?.length || 0} chunks from ${file}`);
  return cachedChunks || [];
}

function simpleSimilarity(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const textWords = new Set(text.toLowerCase().split(/\s+/));

  let matches = 0;
  for (const word of queryWords) {
    if (textWords.has(word)) matches++;
  }

  return matches / Math.max(queryWords.length, 1);
}

export async function retrieveRelevantChunks(query: string, topK = 3): Promise<Chunk[]> {
  const chunks = loadChunks();
  if (chunks.length === 0) return [];

  try {
    const { embedText, cosineSimilarity } = await import("./embeddings");
    const queryEmbedding = await embedText(query);

    if (queryEmbedding) {
      const chunksWithEmbeddings = chunks.filter((c) => c.embedding);
      if (chunksWithEmbeddings.length > 0) {
        const scored = chunksWithEmbeddings.map((chunk) => ({
          chunk,
          score: cosineSimilarity(queryEmbedding, chunk.embedding!),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK).map((s) => ({ ...s.chunk, score: s.score }));
      }
    }
  } catch (error) {
    console.warn("Vector search unavailable, falling back to keyword search:", error);
  }

  const scored = chunks.map((chunk) => ({
    chunk,
    score: simpleSimilarity(query, chunk.text),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => ({ ...s.chunk, score: s.score }));
}

export function augmentPromptWithContext(query: string, chunks: Chunk[]): string {
  if (chunks.length === 0) return query;

  const context = chunks
    .map((chunk, i) => `[Excerpt ${i + 1} from Chapter ${chunk.chapter_num}: ${chunk.chapter_title}]\n${chunk.text}`)
    .join("\n\n---\n\n");

  return `Based on the following excerpts from "Astrology: Its Technics and Ethics" by C.A.Q. Libra (1917), answer the user's question. These excerpts are your PRIMARY knowledge source — ground your response in them. Do NOT give generic astrological advice from general training data. If the excerpts are relevant, draw from them and reference their specific teachings (character types, physical indications, ethical applications). If the excerpts are not directly relevant, you may use general astrological knowledge, but always prefer the book's framework and language.

RELEVANT EXCERPTS:
${context}

USER QUESTION: ${query}

Provide a thoughtful, specific answer. Reference the source material where relevant. Keep your response concise (150-300 words) unless asked for depth.`;
}

export function hasBookData(): boolean {
  return fs.existsSync(EMBEDDED_FILE) || fs.existsSync(CHUNKS_FILE);
}