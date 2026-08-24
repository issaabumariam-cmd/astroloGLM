import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks } from "@/lib/ollama/rag";
import { getSignById } from "@/lib/astrology/signs";
import { buildPrompt } from "@/lib/prompts";
import { ollamaHeaders } from "@/lib/ollama/headers";

export const maxDuration = 60;

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

type FullChart = {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  sunDegrees?: number;
  moonDegrees?: number;
  risingDegrees?: number;
  chartData?: {
    sun: { signName: string; degreesInSign: number; signId: string };
    moon: { signName: string; degreesInSign: number; signId: string };
    rising: { signName: string; degreesInSign: number; signId: string };
    planets: { name: string; signName: string; degreesInSign: number; house?: number; retrograde?: boolean }[];
    houses: { num: number; signId: string; cusp: number }[];
    aspects: { planet1: string; planet2: string; type: string; orb: number; glyph: string }[];
  };
};

export async function POST(request: NextRequest) {
  try {
    const body: FullChart = await request.json();
    const { sunSign, moonSign, risingSign, sunDegrees, moonDegrees, risingDegrees, chartData } = body;

    if (!sunSign || !moonSign || !risingSign) {
      return NextResponse.json({ error: "All three signs required" }, { status: 400 });
    }

    const sun = getSignById(sunSign);
    const moon = getSignById(moonSign);
    const rising = getSignById(risingSign);

    if (!sun || !moon || !rising) {
      return NextResponse.json({ error: "Invalid signs" }, { status: 400 });
    }

    // RAG: retrieve passages about these specific placements
    const ragQuery = `${sun.name} ascendant personality character ${moon.name} Moon emotional nature ${rising.name} rising first impression physical type`;
    const chunks = await retrieveRelevantChunks(ragQuery, 5);

    const bookContext = chunks.length > 0
      ? chunks.map((c) => `[Ch.${c.chapter_num}: ${c.chapter_title}]\n${c.text}`).join("\n\n---\n\n")
      : "";

    // Build full chart context if available, otherwise just Big Three
    let chartSection = `=== NATAL CHART (use ONLY this data, never guess) ===
- Sun in ${sun.name} ${Math.floor(sunDegrees || 0)}° (${sun.element}, ${sun.modality}, ruled by ${sun.rulingPlanet})
- Moon in ${moon.name} ${Math.floor(moonDegrees || 0)}° (${moon.element}, ${moon.modality})
- Ascendant (Rising) in ${rising.name} ${Math.floor(risingDegrees || 0)}° (${rising.element}, ${rising.modality})`;

    if (chartData) {
      if (chartData.planets && chartData.planets.length > 0) {
        chartSection += `\n\nAll planetary positions:`;
        for (const p of chartData.planets) {
          chartSection += `\n- ${p.name} in ${p.signName} ${Math.floor(p.degreesInSign)}°`;
          if (p.house) chartSection += ` (House ${p.house})`;
          if (p.retrograde) chartSection += ` [Retrograde]`;
        }
      }

      if (chartData.aspects && chartData.aspects.length > 0) {
        chartSection += `\n\nMajor aspects:`;
        for (const a of chartData.aspects) {
          chartSection += `\n- ${a.planet1} ${a.type} ${a.planet2} (orb ${a.orb}°)`;
        }
      }

      if (chartData.houses && chartData.houses.length > 0) {
        chartSection += `\n\nHouse cusps:`;
        for (const h of chartData.houses) {
          chartSection += `\n- House ${h.num}: ${h.signId} (${Math.floor(h.cusp)}°)`;
        }
      }
    }

    chartSection += `\n\nIMPORTANT: Use ONLY these placements. Do not guess or hallucinate any other positions.`;

    const bookSection = bookContext
      ? `Relevant excerpts from C.A.Q. Libra's "Astrology: Its Technics and Ethics" (1917):\n${bookContext}`
      : "";

    const aspectNote = chartData?.aspects?.length
      ? "6. References specific aspects (e.g., Sun square Mars) as growth areas or strengths\n"
      : "";

    const taskOverride = aspectNote
      ? `Write a 300-400 word natal chart interpretation that:
1. Opens with a vivid image of this person's cosmic signature — the unique blend of their Big Three
2. Explains what their Sun placement means for their life purpose and identity
3. Explains what their Moon placement means for their emotional world and inner needs
4. Explains what their Rising sign means for how others see them and their approach to life
5. Identifies the dynamic between the three — where they flow, where they tension
${aspectNote}6. Offers a specific life-coaching insight or growth area
7. Ends with a reflection question

Tone: wise, warm, specific. Not generic "you are a Leo." Reference the specific degree, the book's wisdom about this sign's physical type or character traits. Frame as self-knowledge, not fortune-telling. Never introduce yourself by name unless asked — you are Jehana, speaking directly to the person.`
      : undefined;

    const prompt = buildPrompt(
      "birthChartInterpretation",
      chartSection,
      bookSection,
      taskOverride || ""
    );

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: ollamaHeaders(),
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
      return NextResponse.json({ error: "Could not generate interpretation" }, { status: 500 });
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
    console.error("Birth chart interpretation error:", error);
    return NextResponse.json({ error: "Could not generate interpretation" }, { status: 500 });
  }
}