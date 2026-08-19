import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/ollama/rag";
import { getSignById } from "@/lib/astrology/signs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sign = searchParams.get("sign");

    if (!sign) {
      return NextResponse.json({ error: "Sign required" }, { status: 400 });
    }

    const signData = getSignById(sign);
    if (!signData) {
      return NextResponse.json({ error: "Invalid sign" }, { status: 400 });
    }

    // Search the book for passages about this sign
    const query = `${signData.name} ascendant personality character traits physical type ruling planet ${signData.element} ${signData.modality}`;
    const chunks = await retrieveRelevantChunks(query, 5);

    return NextResponse.json({
      sign: signData.name,
      passages: chunks.map((c) => ({
        chapter: c.chapter_num,
        chapterTitle: c.chapter_title,
        text: c.text,
        score: c.score,
      })),
    });
  } catch (error) {
    console.error("Sign book error:", error);
    return NextResponse.json({ error: "Could not retrieve passages" }, { status: 500 });
  }
}