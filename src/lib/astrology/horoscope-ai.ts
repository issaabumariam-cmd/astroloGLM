import { type ZodiacSign } from "./signs";
import { getTransitPositions } from "./transit-natal";
import { retrieveRelevantChunks, augmentPromptWithContext, hasBookData } from "../ollama/rag";
import { buildPrompt, getPrompt } from "../prompts";
import { getCachedHoroscope, saveCachedHoroscope, getLuckyNumber } from "../horoscope-cache";
import { gatewayFetch } from "../ollama/gateway-fetch";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

export type AIHoroscope = {
  content: string;
  mood: number;
  luckyNumber: number;
  luckyColor: string;
  themes: string[];
  transits: { transitPlanet: string; aspectType: string; natalPlanet: string; description: string; exact: boolean }[];
  retrogrades: string[];
  sources: { chapter_num: number; chapter_title: string; chunk_index?: number; text: string; score?: number }[];
  cached: boolean;
};

export async function generateAIHoroscope(
  sign: ZodiacSign,
  date: Date,
  type: "daily" | "weekly" = "daily"
): Promise<AIHoroscope> {
  const dateStr = date.toISOString().slice(0, 10);
  const cacheKey = sign.id;

  const existing = getCachedHoroscope(type, cacheKey, dateStr, false);
  if (existing) {
    return {
      content: existing.content || "",
      mood: existing.mood || 3,
      luckyNumber: existing.luckyNumber || getLuckyNumber(sign.id, dateStr),
      luckyColor: existing.luckyColor || sign.color,
      themes: existing.themes || [],
      transits: existing.transits || [],
      retrogrades: existing.retrogrades || [],
      sources: existing.sources || [],
      cached: true,
    };
  }

  console.log(`[Horoscope] Generating ${type} for ${sign.name} on ${dateStr}`);

  const today = date;
  const transitPositions = await getTransitPositions(today);

  const ragQuery = `${transitPositions.slice(0, 3).map((p) => p.name).join(", ")} transit ${sign.name} astrology`;
  let contextSection = "";
  let sources: AIHoroscope["sources"] = [];

  if (hasBookData()) {
    const chunks = await retrieveRelevantChunks(ragQuery, 4);
    sources = chunks.map((c) => ({
      chapter_num: c.chapter_num,
      chapter_title: c.chapter_title,
      chunk_index: c.chunk_index,
      text: c.text,
      score: c.score,
    }));
    if (chunks.length > 0) {
      const ragContext = augmentPromptWithContext("", chunks);
      const excerptsMatch = ragContext.match(/RELEVANT EXCERPTS:\n([\s\S]*?)\n\nUSER QUESTION:/);
      if (excerptsMatch) contextSection = excerptsMatch[1];
    }
  }

  const { zodiacSigns } = await import("./signs");

  const transitSection = `The person's zodiac sign: ${sign.name} (${sign.element}, ruled by ${sign.rulingPlanet})

Current planetary positions:
${transitPositions.map((p) => `- ${p.name} at ${Math.floor(p.longitude % 30)}° ${zodiacSigns.find((s) => s.degrees[0] <= p.longitude && p.longitude < s.degrees[1])?.name}${p.retrograde ? " (Retrograde)" : ""}`).join("\n")}`;

  const horoscopeContext = `=== ${type.toUpperCase()} HOROSCOPE CONTEXT ===\n${transitSection}`;

  const bookSection = contextSection
    ? `Relevant excerpts from C.A.Q. Libra's "Astrology: Its Technics and Ethics" (1917):\n${contextSection}`
    : "";

  const wordCount = type === "daily" ? "200-300" : "300-400";
  const focus = type === "daily" ? "today" : "this week";
  const scope = type === "daily" ? "this single day" : "the coming week";

  const taskOverride = `Write a ${wordCount}-word ${type} horoscope for ${scope}. The reading should:
1. Open with a vivid, specific statement about the cosmic energy for ${focus}
2. Reference the actual transits and aspects listed above (not generic statements)
3. Include guidance for love, career, and personal growth
4. Frame everything as self-knowledge and reflection, not fortune-telling
5. Use warm, elegant language befitting a premium astrology app
6. End with a reflection question
${contextSection ? "7. Draw from and reference the book excerpts where relevant\n" : ""}
Do NOT use headers or bullet points. Write as flowing prose. Do NOT start with "Today" or "This week" — be more creative. Never introduce yourself by name unless asked — you are Jehana, speaking directly to the person.`;

  const prompt = buildPrompt("horoscopeGeneration", horoscopeContext, bookSection, taskOverride);

  const response = await gatewayFetch({
    path: "/api/chat",
    body: {
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        { role: "system", content: getPrompt("jehanaPersona") },
        { role: "user", content: prompt },
      ],
      options: { temperature: 0.7, top_p: 0.9, seed: 42 },
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(`Ollama horoscope-ai failed: ${response.status} ${response.statusText} — ${errorBody}`);
    throw new Error("AI service unavailable");
  }

  const data = await response.json();
  const content = data.message?.content?.trim();
  if (!content) throw new Error("No response generated");

  const luckyNumber = getLuckyNumber(sign.id, dateStr);

  const result = {
    type,
    date: dateStr,
    sign: sign.id,
    signName: sign.name,
    signGlyph: sign.glyph,
    content,
    mood: 3,
    luckyNumber,
    luckyColor: sign.color,
    themes: [] as string[],
    transits: [] as AIHoroscope["transits"],
    retrogrades: transitPositions.filter((p) => p.retrograde).map((p) => p.name),
    sources,
    personalized: false,
    cached: false,
  };

  saveCachedHoroscope(type, cacheKey, dateStr, result, false);

  return {
    content,
    mood: result.mood,
    luckyNumber: result.luckyNumber,
    luckyColor: result.luckyColor,
    themes: result.themes,
    transits: result.transits,
    retrogrades: result.retrogrades,
    sources: result.sources,
    cached: false,
  };
}
