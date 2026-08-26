import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/ollama/rag";
import { getSignById } from "@/lib/astrology/signs";
import { calculateCompatibility } from "@/lib/astrology/compatibility";
import { buildPrompt, getPrompt } from "@/lib/prompts";
import { gatewayFetch } from "@/lib/ollama/gateway-fetch";
import fs from "fs";
import path from "path";

export const maxDuration = 60;

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";
const CACHE_DIR = path.join(process.cwd(), "data", "compatibility_cache");

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

    const compatSection = `=== COMPATIBILITY ANALYSIS ===
Two people want to understand their compatibility:
- Person A: ${s1.name} (${s1.element}, ${s1.modality}, ruled by ${s1.rulingPlanet})
- Person B: ${s2.name} (${s2.element}, ${s2.modality}, ruled by ${s2.rulingPlanet})

Compatibility scores:
- Love: ${compat.loveScore}%
- Communication: ${compat.communicationScore}%
- Trust: ${compat.trustScore}%
- Emotional resonance: ${compat.emotionScore}%
- Overall: ${compat.overallScore}%

Elemental dynamic: ${compat.elementMatch}`;

    const bookSection = bookContext
      ? `Relevant excerpts from C.A.Q. Libra's "Astrology: Its Technics and Ethics" (1917):\n${bookContext}`
      : "";

    const prompt = buildPrompt(
      "compatibilityReading",
      compatSection,
      bookSection
    );

    // Check cache (same sign pair = same reading, cached permanently)
    const cacheKey = [sign1, sign2].sort().join("_");
    const cacheFile = path.join(CACHE_DIR, `${cacheKey}.json`);
    if (fs.existsSync(cacheFile)) {
      try {
        const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
        return NextResponse.json({ ...cached, cached: true });
      } catch {}
    }

    const response = await gatewayFetch({
      path: "/api/chat",
      body: {
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: "system", content: getPrompt("jehanaPersona") },
          { role: "user", content: prompt },
        ],
        options: { temperature: 0.75, top_p: 0.9, seed: 42 },
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`Ollama compatibility-reading failed: ${response.status} ${response.statusText} — ${errorBody}`);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    const data = await response.json();
    const reading = data.message?.content?.trim();

    if (!reading) {
      return NextResponse.json({ error: "Could not generate reading" }, { status: 500 });
    }

    const result = {
      reading,
      sources: chunks.map((c) => ({
        chapter_num: c.chapter_num,
        chapter_title: c.chapter_title,
        text: c.text.substring(0, 200),
        score: c.score,
      })),
      cached: false,
    };

    // Save to cache
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), "utf-8");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Compatibility reading error:", error);
    return NextResponse.json({ error: "Could not generate reading" }, { status: 500 });
  }
}