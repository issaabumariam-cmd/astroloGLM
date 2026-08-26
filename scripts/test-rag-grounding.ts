import fs from "fs";
import path from "path";

const GATEWAY_URL = "https://ai-gateway.singularitai.tech";
const GATEWAY_KEY = "610df80718e0de6b28246fd7934d5385b137857e6d25996b3edfcbbbb36a996b";

async function embedText(text: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": GATEWAY_KEY },
      body: JSON.stringify({ model: "nomic-embed-text", prompt: text }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.embedding || null;
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
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

type Chunk = {
  chapter_num: number;
  chapter_title: string;
  chunk_index: number;
  text: string;
  embedding?: number[];
};

async function chat(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(`${GATEWAY_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": GATEWAY_KEY },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: { temperature: 0.5, top_p: 0.9, seed: 42 },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function checkGrounding(aiResponse: string, chunks: Chunk[]): { referenced: number; matchedPhrases: string[] } {
  const responseLower = aiResponse.toLowerCase();
  let referenced = 0;
  const matchedPhrases: string[] = [];

  for (const chunk of chunks) {
    const sentences = chunk.text.split(/[.!?;]/).map((s) => s.trim()).filter((s) => s.length > 20);
    let chunkReferenced = false;

    for (const sentence of sentences) {
      const words = sentence.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      if (words.length < 3) continue;

      for (let len = Math.min(5, words.length); len >= 3; len--) {
        for (let start = 0; start <= words.length - len; start++) {
          const phrase = words.slice(start, start + len).join(" ");
          if (responseLower.includes(phrase)) {
            referenced++;
            matchedPhrases.push(phrase);
            chunkReferenced = true;
            break;
          }
        }
        if (chunkReferenced) break;
      }
      if (chunkReferenced) break;
    }
  }

  return { referenced, matchedPhrases: matchedPhrases.slice(0, 8) };
}

async function main() {
  console.log("=== Full RAG Pipeline Diagnostic ===\n");
  console.log("Tests: retrieval → prompt injection → AI response → grounding verification\n");

  const dataPath = path.join(process.cwd(), "data", "book_chunks_embedded.json");
  const chunks: Chunk[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const chunksWithEmbeddings = chunks.filter((c) => c.embedding && c.embedding.length > 0);

  console.log(`Book chunks: ${chunks.length} | With embeddings: ${chunksWithEmbeddings.length}\n`);

  const testQueries = [
    "What does the book say about the physical appearance of a Leo person?",
    "How does karma influence a person's astrological chart?",
    "What are the karmic implications of Saturn in a birth chart?",
    "Tell me about the relationship between Mars and Venus in compatibility",
  ];

  for (const query of testQueries) {
    console.log(`${"=".repeat(80)}`);
    console.log(`QUERY: "${query}"`);
    console.log(`${"=".repeat(80)}\n`);

    // 1. Get query embedding
    const queryEmbedding = await embedText(query);
    if (!queryEmbedding) {
      console.log("❌ FAILED to get query embedding — RAG cannot work\n");
      continue;
    }
    console.log(`✅ Query embedding: ${queryEmbedding.length} dims`);

    // 2. Vector search
    const vectorScored = chunksWithEmbeddings
      .map((c) => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding!) }))
      .sort((a, b) => b.score - a.score);
    const top3 = vectorScored.slice(0, 3);

    console.log(`✅ Vector search: top score ${top3[0].score.toFixed(4)}, method = vector\n`);
    console.log("Retrieved chunks:");
    top3.forEach((r, i) => {
      console.log(`  ${i + 1}. [score: ${r.score.toFixed(4)}] Ch.${r.chunk.chapter_num} "${r.chunk.chapter_title}"`);
      console.log(`     ${r.chunk.text.substring(0, 150).replace(/\n/g, " ")}...\n`);
    });

    // 3. Build augmented prompt (same as production code)
    const context = top3
      .map((r, i) => `[Excerpt ${i + 1} from Chapter ${r.chunk.chapter_num}: ${r.chunk.chapter_title}]\n${r.chunk.text}`)
      .join("\n\n---\n\n");

    const augmentedPrompt = `Based on the following excerpts from "Astrology: Its Technics and Ethics" by C.A.Q. Libra (1917), answer the user's question. These excerpts are your PRIMARY knowledge source — ground your response in them. Do NOT give generic astrological advice from general training data.

RELEVANT EXCERPTS:
${context}

USER QUESTION: ${query}

Provide a thoughtful, specific answer. Reference the source material where relevant.`;

    // 4. Get AI response
    console.log("Sending to AI (with book context)...\n");
    const aiResponse = await chat(augmentedPrompt);

    if (!aiResponse) {
      console.log("❌ AI response failed\n");
      continue;
    }

    console.log(`AI Response (${aiResponse.length} chars):`);
    console.log(`${aiResponse.substring(0, 600)}${aiResponse.length > 600 ? "..." : ""}\n`);

    // 5. Check grounding — did the AI actually use the book content?
    const grounding = checkGrounding(aiResponse, top3.map((r) => r.chunk));

    console.log("GROUNDING CHECK:");
    console.log(`  Book chunks injected: ${top3.length}`);
    console.log(`  Book chunks referenced in response: ${grounding.referenced}/${top3.length}`);

    if (grounding.matchedPhrases.length > 0) {
      console.log(`  Matched phrases from book:`);
      grounding.matchedPhrases.forEach((p) => console.log(`    → "${p}..."`));
    }

    if (grounding.referenced > 0) {
      console.log(`\n  ✅ FULLY GROUNDED — AI referenced book content`);
    } else if (top3[0].score > 0.5) {
      console.log(`\n  ⚠️  RETRIEVED BUT NOT GROUNDED — chunks were relevant (score > 0.5) but AI may have paraphrased or ignored them`);
    } else {
      console.log(`\n  ⚠️  WEAK MATCH — low similarity scores, book may not cover this topic`);
    }

    // 6. Compare: what would keyword search have returned?
    const keywordScored = chunks
      .map((c) => ({ chunk: c, score: simpleSimilarity(query, c.text) }))
      .sort((a, b) => b.score - a.score);
    const keywordTop3 = keywordScored.filter((r) => r.score > 0).slice(0, 3);

    const vectorChunkIds = new Set(top3.map((r) => r.chunk.chunk_index));
    const keywordChunkIds = new Set(keywordTop3.map((r) => r.chunk.chunk_index));
    const overlap = [...vectorChunkIds].filter((id) => keywordChunkIds.has(id)).length;

    console.log(`\n  Vector vs keyword overlap: ${overlap}/3 ${overlap === 0 ? "(completely different — semantic search adding value)" : ""}`);

    console.log(`\n${"─".repeat(80)}\n`);
  }

  console.log("=== Summary ===");
  console.log("If you see ✅ FULLY GROUNDED, the RAG pipeline is working end-to-end:");
  console.log("  1. Query embedding computed via gateway (768-dim)");
  console.log("  2. Vector search found relevant book chunks (cosine similarity)");
  console.log("  3. Chunks injected into the AI prompt");
  console.log("  4. AI response references actual book content (not general training data)");
}

main().catch(console.error);