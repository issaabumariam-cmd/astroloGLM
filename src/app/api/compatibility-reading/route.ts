import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/ollama/rag";
import { getSignById } from "@/lib/astrology/signs";
import { calculateCompatibility } from "@/lib/astrology/compatibility";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

export async function POST(request: NextRequest) {
  try {
    const { sign1, sign2 } = await request.json();

    if (!sign1 || !sign2) {
      return NextResponse.json({ error: "Both signs required" }, { status: 400 });
    }

    const s1 = getSignById(sign1);
    const s2 = getSignById(sign2);
    if (!s1 || !s2) {
      return NextResponse.json({ error: "Invalid signs" }, { status: 400 });
    }

    const compat = calculateCompatibility(sign1, sign2);
    if (!compat) {
      return NextResponse.json({ error: "Could not calculate compatibility" }, { status: 400 });
    }

    // RAG: retrieve synastry passages from the book
    const ragQuery = `${s1.name} ${s2.name} compatibility synastry marriage partnership ${s1.element} ${s2.element} ${s1.rulingPlanet} ${s2.rulingPlanet} aspects harmony disharmony`;
    const chunks = await retrieveRelevantChunks(ragQuery, 5);

    const bookContext = chunks.length > 0
      ? chunks.map((c) => `[Ch.${c.chapter_num}: ${c.chapter_title}]\n${c.text}`).join("\n\n---\n\n")
      : "";

    const prompt = `You are Echo, an astrological life coach specializing in relationship dynamics.

Two people want to understand their compatibility:
- Person A: ${s1.name} (${s1.element}, ${s1.modality}, ruled by ${s1.rulingPlanet})
- Person B: ${s2.name} (${s2.element}, ${s2.modality}, ruled by ${s2.rulingPlanet})

Compatibility scores:
- Love: ${compat.loveScore}%
- Communication: ${compat.communicationScore}%
- Trust: ${compat.trustScore}%
- Emotional resonance: ${compat.emotionScore}%
- Overall: ${compat.overallScore}%

Elemental dynamic: ${compat.elementMatch}

${bookContext ? `Relevant excerpts from C.A.Q. Libra's "Astrology: Its Technics and Ethics" (1917):
${bookContext}` : ""}

Write a 200-300 word compatibility reading that:
1. Opens with a vivid image of their dynamic (not generic "you two are...")
2. Explains the elemental interaction (fire+air, earth+water, etc.) with book wisdom
3. Addresses their specific strengths as a couple
4. Identifies growth areas — frame challenges as opportunities, not problems
5. Offers practical relationship advice grounded in astrological wisdom
6. Ends with a reflection question for both partners

Tone: wise, warm, specific. Not a horoscope — a relationship guide. Reference the book's wisdom naturally.`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [{ role: "user", content: prompt }],
        options: { temperature: 0.75, top_p: 0.9, seed: 42 },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    const data = await response.json();
    const reading = data.message?.content?.trim();

    if (!reading) {
      return NextResponse.json({ error: "Could not generate reading" }, { status: 500 });
    }

    return NextResponse.json({
      reading,
      sources: chunks.map((c) => ({
        chapter_num: c.chapter_num,
        chapter_title: c.chapter_title,
        text: c.text.substring(0, 200),
        score: c.score,
      })),
    });
  } catch (error) {
    console.error("Compatibility reading error:", error);
    return NextResponse.json({ error: "Could not generate reading" }, { status: 500 });
  }
}