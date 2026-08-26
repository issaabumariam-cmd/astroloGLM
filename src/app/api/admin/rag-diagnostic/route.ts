import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunksDetailed, hasBookData, augmentPromptWithContext } from "@/lib/ollama/rag";
import { gatewayFetch, GatewayRateLimitError, GatewayPayloadTooLargeError, GatewayTimeoutError } from "@/lib/ollama/gateway-fetch";

export const maxDuration = 60;

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json() as { query: string };

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    if (!hasBookData()) {
      return NextResponse.json({ error: "No book data loaded" }, { status: 500 });
    }

    const retrieval = await retrieveRelevantChunksDetailed(query, 5);

    const augmentedPrompt = augmentPromptWithContext(query, retrieval.chunks);

    let aiResponse: string | null = null;
    let aiError: string | null = null;

    try {
      const response = await gatewayFetch({
        path: "/api/chat",
        body: {
          model: OLLAMA_MODEL,
          stream: false,
          messages: [{ role: "user", content: augmentedPrompt }],
          options: { temperature: 0.5, top_p: 0.9, seed: 42 },
        },
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.message?.content?.trim() || null;
      } else {
        aiError = `Gateway returned ${response.status}`;
      }
    } catch (error) {
      if (error instanceof GatewayRateLimitError) aiError = "Rate limited";
      else if (error instanceof GatewayPayloadTooLargeError) aiError = "Payload too large";
      else if (error instanceof GatewayTimeoutError) aiError = "Gateway timeout";
      else aiError = String(error);
    }

    const bookReferences = aiResponse
      ? countBookReferences(aiResponse, retrieval.chunks)
      : { referenced: 0, total: 0, matchedPhrases: [] as string[] };

    return NextResponse.json({
      query,
      retrieval: {
        method: retrieval.method,
        topScore: retrieval.topScore,
        queryEmbeddingDims: retrieval.queryEmbeddingDims,
        bookChunksTotal: retrieval.bookChunksTotal,
        embeddedChunksTotal: retrieval.embeddedChunksTotal,
        chunksReturned: retrieval.chunks.length,
        chunks: retrieval.chunks.map((c) => ({
          chapter: c.chapter_num,
          title: c.chapter_title,
          chunkIndex: c.chunk_index,
          score: c.score,
          text: c.text.substring(0, 200) + "...",
        })),
      },
      aiResponse: aiResponse?.substring(0, 1000),
      aiError,
      grounding: {
        promptInjectedWithBook: retrieval.chunks.length > 0,
        bookReferencesInResponse: bookReferences.referenced,
        totalChunksChecked: bookReferences.total,
        matchedPhrases: bookReferences.matchedPhrases,
        verdict: getVerdict(retrieval, bookReferences),
      },
    });
  } catch (error) {
    console.error("RAG diagnostic error:", error);
    return NextResponse.json({ error: "Diagnostic failed" }, { status: 500 });
  }
}

function countBookReferences(aiResponse: string, chunks: { text: string }[]): {
  referenced: number;
  total: number;
  matchedPhrases: string[];
} {
  const responseLower = aiResponse.toLowerCase();
  let referenced = 0;
  const matchedPhrases: string[] = [];

  for (const chunk of chunks) {
    const sentences = chunk.text.split(/[.!?;]/).map((s) => s.trim()).filter((s) => s.length > 15);
    let chunkReferenced = false;

    for (const sentence of sentences) {
      const words = sentence.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      if (words.length < 3) continue;

      for (let len = Math.min(6, words.length); len >= 2; len--) {
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

  const uniqueRareWords = new Set<string>();
  for (const chunk of chunks) {
    const words = chunk.text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 5 && !["astrology", "horoscope", "planet", "planets", "zodiac", "because", "should", "would", "through", "between", "without"].includes(word)) {
        if (aiResponse.toLowerCase().includes(word)) {
          uniqueRareWords.add(word);
        }
      }
    }
  }

  if (referenced === 0 && uniqueRareWords.size >= 3) {
    referenced = 1;
    matchedPhrases.push(`${uniqueRareWords.size} rare book words found in response`);
  }

  return { referenced, total: chunks.length, matchedPhrases: matchedPhrases.slice(0, 10) };
}

function getVerdict(
  retrieval: { method: string; topScore: number | null; chunks: { text: string }[] },
  grounding: { referenced: number; total: number }
): string {
  if (retrieval.method === "none") {
    return "NO RAG — book data not loaded, AI responding from general training only";
  }
  if (retrieval.method === "keyword") {
    return "DEGRADED — using keyword fallback, not semantic vector search. Query embeddings may be failing.";
  }
  if (retrieval.method === "vector" && retrieval.topScore !== null && retrieval.topScore < 0.3) {
    return "WEAK MATCH — vector search ran but similarity scores are low. The book may not cover this topic well.";
  }
  if (grounding.referenced > 0) {
    return "FULLY GROUNDED — semantic vector search retrieved relevant chunks AND the AI referenced book content in its response. RAG is working correctly.";
  }
  return "RETRIEVED BUT PARAPHRASED — chunks were found and injected, but the AI paraphrased rather than quoted. The AI may still be using the book content (check response for concepts from excerpts).";
}