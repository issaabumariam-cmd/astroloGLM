import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/ollama/rag";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, topK } = body as { query: string; topK?: number };

    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    const chunks = await retrieveRelevantChunks(query, topK || 5);

    return NextResponse.json({
      chunks: chunks.map((c) => ({
        chapter_num: c.chapter_num,
        chapter_title: c.chapter_title,
        text: c.text,
        score: c.score,
      })),
    });
  } catch (error) {
    console.error("RAG test error:", error);
    return NextResponse.json({ error: "RAG search failed" }, { status: 500 });
  }
}