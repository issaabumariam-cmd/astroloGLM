import { NextRequest, NextResponse } from "next/server";
import { calculateNatalChart } from "@/lib/astrology/chart";
import { calculateTransitToNatal, getTransitPositions } from "@/lib/astrology/transit-natal";
import { retrieveRelevantChunks, augmentPromptWithContext, hasBookData } from "@/lib/ollama/rag";
import { zodiacSigns, getSignById } from "@/lib/astrology/signs";
import { getCachedHoroscope, saveCachedHoroscope, getLuckyNumber } from "@/lib/horoscope-cache";
import { buildPrompt, getPrompt } from "@/lib/prompts";
import { ollamaHeaders } from "@/lib/ollama/headers";

export const maxDuration = 60;

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, sign, birthDate, birthTime, lat, lng, birthPlace } = body as {
      type: "daily" | "weekly" | "monthly" | "yearly";
      sign?: string;
      birthDate?: string;
      birthTime?: string;
      lat?: number;
      lng?: number;
      birthPlace?: string;
    };

    if (!type || !["daily", "weekly", "monthly", "yearly"].includes(type)) {
      return NextResponse.json({ error: "Valid type required (daily/weekly/monthly/yearly)" }, { status: 400 });
    }

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const signData = sign ? getSignById(sign) : null;
    const isPersonalized = !!(birthDate && lat !== undefined && lng !== undefined);

    // --- CACHE CHECK ---
    // For sign-based (non-personalized): all users with same sign get same horoscope
    // For personalized: cached per user's birth chart (in production, cache by user ID + chart hash)
    const cacheKey = isPersonalized
      ? `${sign}_${birthDate}_${birthTime || "noon"}_${lat}_${lng}`.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 100)
      : sign || "unknown";

    const existing = getCachedHoroscope(type, cacheKey, dateStr, isPersonalized);
    if (existing) {
      console.log(`[Horoscope] Cache hit: ${type} for ${cacheKey} on ${dateStr}`);
      return NextResponse.json({
        ...existing,
        cached: true,
        cacheAgeHours: Math.floor((Date.now() - new Date(existing.createdAt).getTime()) / (1000 * 60 * 60)),
      });
    }

    console.log(`[Horoscope] Cache miss: generating ${type} for ${cacheKey} on ${dateStr}`);

    // If birth data provided, calculate real natal chart and transits
    let natalChart = null;
    let transitReport = null;
    let transitPositions = null;

    if (isPersonalized) {
      const { getTimezoneForCoords, localToUTC } = await import("@/lib/astrology/timezone");
      const timezone = getTimezoneForCoords(lat!, lng!);
      const timeStr = birthTime || "12:00";
      const date = await localToUTC(birthDate!, timeStr, timezone);
      natalChart = await calculateNatalChart(date, lat!, lng!, birthPlace || "", timeStr);

      if (natalChart) {
        transitReport = await calculateTransitToNatal(natalChart, today);
      }
    } else {
      // No birth data — get current transit positions for sun-sign-based reading
      transitPositions = await getTransitPositions(today);
    }

    // RAG retrieval based on transits and sign
    let contextSection = "";
    let sources: { chapter_num: number; chapter_title: string; chunk_index: number; text: string; score?: number }[] = [];

    const ragQuery = transitReport
      ? `${transitReport.transits.slice(0, 3).map((t) => `${t.transitPlanet} ${t.aspectType} ${t.natalPlanet}`).join(", ")} ${signData?.name || ""} astrology`
      : `${transitPositions?.slice(0, 3).map((p) => p.name).join(", ")} transit ${signData?.name || ""} astrology`;

    if (hasBookData()) {
      const chunks = await retrieveRelevantChunks(ragQuery, 4);
      sources = chunks;
      if (chunks.length > 0) {
        const ragContext = augmentPromptWithContext("", chunks);
        const excerptsMatch = ragContext.match(/RELEVANT EXCERPTS:\n([\s\S]*?)\n\nUSER QUESTION:/);
        if (excerptsMatch) {
          contextSection = excerptsMatch[1];
        }
      }
    }

    const timeFrameConfig = {
      daily: { wordCount: "200-300", focus: "today", scope: "this single day" },
      weekly: { wordCount: "300-400", focus: "this week", scope: "the coming week" },
      monthly: { wordCount: "400-500", focus: "this month", scope: "the entire month" },
      yearly: { wordCount: "600-800", focus: "this year", scope: "the full year ahead" },
    };

    const config = timeFrameConfig[type];

    // Build transit info section
    let transitSection = "";
    if (transitReport && natalChart) {
      transitSection = `The person's natal chart:
- Sun in ${natalChart.sun.signName}
- Moon in ${natalChart.moon.signName}
- Ascendant (Rising) in ${natalChart.rising.signName}

Today's transits and their aspects to the natal chart:
${transitReport.transits.slice(0, 8).map((t) => `- ${t.description} (orb: ${t.orb}°${t.exact ? ", EXACT" : ""})`).join("\n")}

${transitReport.retrogrades.length > 0 ? `Retrograde planets: ${transitReport.retrogrades.join(", ")}\n` : ""}
Major themes: ${transitReport.themes.join(", ")}
Overall mood: ${"★".repeat(transitReport.mood)}${"☆".repeat(5 - transitReport.mood)}`;
    } else if (transitPositions && signData) {
      transitSection = `The person's zodiac sign: ${signData.name} (${signData.element}, ruled by ${signData.rulingPlanet})

Current planetary positions:
${transitPositions.map((p) => `- ${p.name} at ${Math.floor(p.longitude % 30)}° ${zodiacSigns.find((s) => s.degrees[0] <= p.longitude && p.longitude < s.degrees[1])?.name}${p.retrograde ? " (Retrograde)" : ""}`).join("\n")}`;
    } else if (signData) {
      transitSection = `The person's zodiac sign: ${signData.name} (${signData.element}, ruled by ${signData.rulingPlanet})`;
    }

    const horoscopeContext = `=== ${type.toUpperCase()} HOROSCOPE CONTEXT ===
${transitSection}`;

    const bookSection = contextSection
      ? `Relevant excerpts from C.A.Q. Libra's "Astrology: Its Technics and Ethics" (1917):\n${contextSection}`
      : "";

    const taskOverride = `
Write a ${config.wordCount}-word ${type} horoscope for ${config.scope}. The reading should:

1. Open with a vivid, specific statement about the cosmic energy for ${config.focus}
2. Reference the actual transits and aspects listed above (not generic statements)
3. Include guidance for love, career, and personal growth
4. Frame everything as self-knowledge and reflection, not fortune-telling
5. Use warm, elegant language befitting a premium astrology app
6. End with a reflection question
${contextSection ? "7. Draw from and reference the book excerpts where relevant\n" : ""}
Do NOT use headers or bullet points. Write as flowing prose. Do NOT start with "Today" or "This week" — be more creative. Never introduce yourself by name unless asked — you are Jehana, speaking directly to the person.`;

    const prompt = buildPrompt(
      "horoscopeGeneration",
      horoscopeContext,
      bookSection,
      taskOverride
    );

    // Generate with LLM
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: ollamaHeaders(),
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          {
            role: "system",
            content: getPrompt("jehanaPersona"),
          },
          { role: "user", content: prompt },
        ],
        options: { temperature: 0.7, top_p: 0.9, seed: 42 },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`Ollama horoscope/generate failed: ${response.status} ${response.statusText} — ${errorBody}`);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    const data = await response.json();
    const content = data.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    // Deterministic lucky number (same for same sign + date)
    const luckyNumber = getLuckyNumber(sign || "unknown", dateStr);
    const luckyColor = signData?.color || "Gold";

    const result = {
      type,
      date: dateStr,
      sign: signData?.id || null,
      signName: signData?.name || null,
      signGlyph: signData?.glyph || null,
      content,
      mood: transitReport?.mood || 3,
      luckyNumber,
      luckyColor,
      themes: transitReport?.themes || [],
      transits: transitReport?.transits.slice(0, 5) || [],
      retrogrades: transitReport?.retrogrades || [],
      sources,
      personalized: !!natalChart,
      cached: false,
    };

    // --- SAVE TO CACHE ---
    // This ensures all users with the same sign get the same horoscope for the same day
    saveCachedHoroscope(type, cacheKey, dateStr, result, isPersonalized);
    console.log(`[Horoscope] Cached: ${type} for ${cacheKey} on ${dateStr}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Horoscope generation error:", error);
    return NextResponse.json({ error: "Could not generate horoscope" }, { status: 500 });
  }
}