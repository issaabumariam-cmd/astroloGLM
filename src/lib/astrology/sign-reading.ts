import type { ZodiacSign } from "./signs";
import { retrieveRelevantChunks, hasBookData } from "../ollama/rag";
import { buildPrompt, getPrompt } from "../prompts";
import { gatewayFetch } from "../ollama/gateway-fetch";
import fs from "fs";
import path from "path";

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

const CACHE_DIR = path.join(process.cwd(), "data", "sign_readings_cache");

export type SignReading = {
  interpretation: string;
  sources: { chapter_num: number; chapter_title: string; chunk_index: number; text: string; score?: number }[];
  cached: boolean;
};

export async function generateSignReading(sign: ZodiacSign): Promise<SignReading | null> {
  if (!hasBookData()) return null;

  const cacheFile = path.join(CACHE_DIR, `${sign.id}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      return { ...cached, cached: true };
    } catch {}
  }

  const ragQuery = `${sign.name} ascendant personality character traits physical type ${sign.rulingPlanet} ${sign.element}`;
  const chunks = await retrieveRelevantChunks(ragQuery, 4);
  if (chunks.length === 0) return null;

  const bookContext = chunks
    .map((c) => `[Ch.${c.chapter_num}: ${c.chapter_title}]\n${c.text}`)
    .join("\n\n---\n\n");

  const signSection = `=== SIGN PROFILE ===
Sign: ${sign.name} (${sign.element}, ${sign.modality}, ruled by ${sign.rulingPlanet})
Dates: ${sign.dates}
Keywords: ${sign.keywords.join(", ")}
Traits: ${sign.traits.join(", ")}
Strengths: ${sign.strengths.join(", ")}
Challenges: ${sign.challenges.join(", ")}`;

  const bookSection = `Relevant excerpts from C.A.Q. Libra's "Astrology: Its Technics and Ethics" (1917):\n${bookContext}`;

  const taskOverride = `Write a 150-200 word interpretation of ${sign.name} as Jehana. This is the sign's profile page — not a personal reading, but a portrait of the sign's archetype.

Ground your interpretation in the book excerpts provided. Reference specific character types, physical indications, and ethical applications from Libra's text. Do NOT give generic "${sign.name} are confident" statements — use what the book actually says.

Structure:
- Open with a vivid image of this sign's cosmic energy
- Explain the sign's core archetype using the book's wisdom
- Mention the physical type or character traits the book describes
- Close with what this sign is here to learn (its ethical lesson)

Tone: wise, warm, specific. Never say "according to the book." Never introduce yourself by name.`;

  const prompt = buildPrompt("birthChartInterpretation", signSection, bookSection, taskOverride);

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
    console.error(`Ollama sign-reading failed: ${response.status} ${response.statusText} — ${errorBody}`);
    return null;
  }

  const data = await response.json();
  const interpretation = data.message?.content?.trim();
  if (!interpretation) return null;

  const result: SignReading = {
    interpretation,
    sources: chunks.map((c) => ({
      chapter_num: c.chapter_num,
      chapter_title: c.chapter_title,
      chunk_index: c.chunk_index,
      text: c.text.substring(0, 300),
      score: c.score,
    })),
    cached: false,
  };

  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(result, null, 2), "utf-8");

  return result;
}
