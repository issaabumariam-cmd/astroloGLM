import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const chunksFile = path.join(dataDir, "book_chunks_embedded.json");
    const chunksFileFallback = path.join(dataDir, "book_chunks.json");

    let chunkCount = 0;
    let embeddedCount = 0;

    const file = fs.existsSync(chunksFile) ? chunksFile : fs.existsSync(chunksFileFallback) ? chunksFileFallback : null;

    if (file) {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));
      chunkCount = Array.isArray(data) ? data.length : 0;
      embeddedCount = Array.isArray(data) ? data.filter((c: { embedding?: unknown[] }) => c.embedding && Array.isArray(c.embedding) && c.embedding.length > 0).length : 0;
    }

    return NextResponse.json({
      chunkCount,
      embeddedCount,
      hasBook: !!file,
      ollamaModel: process.env.OLLAMA_MODEL || "gemma4:31b-cloud",
      ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    });
  } catch {
    return NextResponse.json({ error: "Could not load stats" }, { status: 500 });
  }
}