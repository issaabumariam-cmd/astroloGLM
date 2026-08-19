import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const chunksFile = path.join(dataDir, "book_chunks_embedded.json");
    const chunksFileFallback = path.join(dataDir, "book_chunks.json");
    const file = fs.existsSync(chunksFile) ? chunksFile : fs.existsSync(chunksFileFallback) ? chunksFileFallback : null;

    if (!file) {
      return NextResponse.json({ chunks: [] });
    }

    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    // Strip embeddings to keep response small
    const chunks = (data as { chapter_num: number; chapter_title: string; chunk_index: number; text: string; embedding?: number[] }[])
      .map((c) => ({
        chapter_num: c.chapter_num,
        chapter_title: c.chapter_title,
        chunk_index: c.chunk_index,
        text: c.text.substring(0, 500), // truncate for display
        hasEmbedding: !!(c.embedding && c.embedding.length > 0),
      }));

    return NextResponse.json({ chunks, total: chunks.length });
  } catch {
    return NextResponse.json({ error: "Could not load chunks" }, { status: 500 });
  }
}