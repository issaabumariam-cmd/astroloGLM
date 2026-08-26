import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const EMBEDDED_FILE = path.join(DATA_DIR, "book_chunks_embedded.json");
const CHUNKS_FILE = path.join(DATA_DIR, "book_chunks.json");

export type Chunk = {
  chapter_num: number;
  chapter_title: string;
  chunk_index: number;
  text: string;
  embedding?: number[];
  score?: number;
};

export type RetrievalResult = {
  chunks: Chunk[];
  method: "vector" | "keyword" | "none";
  queryEmbeddingDims: number | null;
  topScore: number | null;
  bookChunksTotal: number;
  embeddedChunksTotal: number;
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
  const result = await retrieveRelevantChunksDetailed(query, topK);
  return result.chunks;
}

const CANDIDATE_POOL = 20;

export async function retrieveRelevantChunksDetailed(query: string, topK = 3): Promise<RetrievalResult> {
  const chunks = loadChunks();

  if (chunks.length === 0) {
    return {
      chunks: [],
      method: "none",
      queryEmbeddingDims: null,
      topScore: null,
      bookChunksTotal: 0,
      embeddedChunksTotal: 0,
    };
  }

  const chunksWithEmbeddings = chunks.filter((c) => c.embedding && c.embedding.length > 0);

  try {
    const { embedText, cosineSimilarity } = await import("./embeddings");
    const queryEmbedding = await embedText(query);

    if (queryEmbedding && chunksWithEmbeddings.length > 0) {
      const scored = chunksWithEmbeddings.map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding!),
      }));
      scored.sort((a, b) => b.score - a.score);

      const topChunks = scored
        .slice(0, Math.max(topK, CANDIDATE_POOL))
        .slice(0, topK)
        .map((s) => ({ ...s.chunk, score: s.score }));

      console.log(`[RAG] Vector search: ${topChunks.length} chunks, top score: ${topChunks[0]?.score?.toFixed(4) || "N/A"}, query dims: ${queryEmbedding.length}`);

      return {
        chunks: topChunks,
        method: "vector",
        queryEmbeddingDims: queryEmbedding.length,
        topScore: topChunks[0]?.score ?? null,
        bookChunksTotal: chunks.length,
        embeddedChunksTotal: chunksWithEmbeddings.length,
      };
    }

    if (!queryEmbedding) {
      console.warn("[RAG] Query embedding failed (null) — falling back to keyword search");
    } else if (chunksWithEmbeddings.length === 0) {
      console.warn("[RAG] No embedded chunks available — falling back to keyword search");
    }
  } catch (error) {
    console.warn("[RAG] Vector search failed, falling back to keyword search:", error);
  }

  const scored = chunks.map((chunk) => ({
    chunk,
    score: simpleSimilarity(query, chunk.text),
  }));
  scored.sort((a, b) => b.score - a.score);
  const topKeyword = scored.filter((s) => s.score > 0).slice(0, topK).map((s) => ({ ...s.chunk, score: s.score }));

  console.log(`[RAG] Keyword fallback: ${topKeyword.length} chunks, top score: ${topKeyword[0]?.score?.toFixed(4) || "N/A"}`);

  return {
    chunks: topKeyword,
    method: "keyword",
    queryEmbeddingDims: null,
    topScore: topKeyword[0]?.score ?? null,
    bookChunksTotal: chunks.length,
    embeddedChunksTotal: chunksWithEmbeddings.length,
  };
}

export function augmentPromptWithContext(query: string, chunks: Chunk[]): string {
  if (chunks.length === 0) return query;

  const context = chunks
    .map((chunk, i) => `[Excerpt ${i + 1} from Chapter ${chunk.chapter_num}: ${chunk.chapter_title}]\n${chunk.text}`)
    .join("\n\n---\n\n");

  return `Based on the following excerpts from "Astrology: Its Technics and Ethics" by C.A.Q. Libra (1917), answer the user's question. Use the knowledge from these excerpts combined with standard astrological understanding. If the excerpts are relevant, draw from them and reference their specific teachings. If the excerpts are not directly relevant, use general astrological knowledge but try to connect it to the book's framework where possible.

RELEVANT EXCERPTS:
${context}

USER QUESTION: ${query}

Provide a thoughtful, specific answer. Reference the source material where relevant. Keep your response concise (150-300 words) unless asked for depth.`;
}

export function hasBookData(): boolean {
  return fs.existsSync(EMBEDDED_FILE) || fs.existsSync(CHUNKS_FILE);
}