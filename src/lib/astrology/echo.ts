// Jehana hook question generator — analyzes natal chart and generates
// personalized life-coaching questions grounded in the book's knowledge

import type { ChartData, PlanetPosition } from "./chart";
import { retrieveRelevantChunks } from "../ollama/rag";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

export type HookQuestion = {
  id: string;
  question: string;
  chartBasis: string; // what chart placements informed this question
  bookContext: string; // relevant book passages
  responseHint: string; // what Jehana will reveal when answered
};

export type JehanaIntro = {
  greeting: string;
  personalitySummary: string;
  hookQuestions: HookQuestion[];
  followUp: string;
};

const Jehana_SYSTEM_PROMPT = `You are Jehana, an astrological life coach. You combine classical astrology knowledge with wellbeing and life coaching.

Your personality:
- Warm, insightful, concise — never robotic
- You ask questions that make people reflect on themselves
- You reference astrology naturally, not academically
- You focus on self-knowledge, growth, and practical wisdom
- You are NOT a fortune teller — you are a guide
- You speak in second person ("you"), never third person
- You keep your opening message under 150 words
- You end with curiosity, not declarations

Your knowledge base:
- You have studied "Astrology: Its Technics and Ethics" by C.A.Q. Libra (1917)
- You understand natal charts, planetary aspects, houses, and signs
- You connect astrological patterns to real-life situations (conflict, energy, relationships, career)
- You frame challenges as growth opportunities, not fixed destinies

When given a natal chart, you:
1. Find the most interesting/unique patterns (not just "you're a Leo")
2. Identify tension points (squares, oppositions) as growth areas
3. Identify harmonious patterns (trines, sextiles) as strengths
4. Generate 3 personalized hook questions based on specific chart placements
5. Each question connects an astrological pattern to a real-life situation`;

export async function generateJehanaIntro(
  chart: ChartData,
  birthDateOnly = false
): Promise<JehanaIntro | null> {
  try {
    // Build chart summary for the prompt
    const sun = chart.sun;
    const moon = chart.moon;
    const rising = chart.rising;

    // Find key aspects
    const keyAspects = chart.aspects.filter(
      (a) => a.type === "square" || a.type === "opposition" || (a.type === "conjunction" && a.orb < 3)
    );

    const chartSummary = `
Natal Chart Summary:
- Sun: ${sun.signName} ${Math.floor(sun.degreesInSign)}°
- Moon: ${moon.signName} ${Math.floor(moon.degreesInSign)}°
- Ascendant: ${rising.signName} ${Math.floor(rising.degreesInSign)}°
${birthDateOnly ? "(Note: birth time unknown — Moon and Ascendant are approximate)" : ""}

Key planetary placements:
${chart.planets.map((p) => `- ${p.name} in ${p.signName} (House ${p.house || "?"})${p.retrograde ? " [Retrograde]" : ""}`).join("\n")}

Notable aspects (tension points and strengths):
${keyAspects.length > 0 ? keyAspects.map((a) => `- ${a.planet1} ${a.type} ${a.planet2} (orb ${a.orb}°)`).join("\n") : "- No major tension aspects found"}
${chart.aspects.filter((a) => a.type === "trine").slice(0, 3).map((a) => `- ${a.planet1} trine ${a.planet2} (natural gift)`).join("\n")}
`.trim();

    // RAG retrieval — find book passages relevant to this chart
    const ragQuery = `${sun.signName} ${moon.signName} ${rising.signName} ${keyAspects.map((a) => `${a.planet1} ${a.type} ${a.planet2}`).join(" ")} personality character traits`;
    const bookChunks = await retrieveRelevantChunks(ragQuery, 5);

    const bookContext = bookChunks.length > 0
      ? bookChunks.map((c, i) => `[Excerpt ${i + 1}: ${c.text.substring(0, 300)}]`).join("\n")
      : "";

    const prompt = `${Jehana_SYSTEM_PROMPT}

Based on this natal chart, generate Jehana's opening message and 3 personalized hook questions.

${chartSummary}

${bookContext ? `Relevant excerpts from C.A.Q. Libra's book:\n${bookContext}` : ""}

Generate a JSON response with this exact structure:
{
  "greeting": "A warm, personal greeting using the person's chart. 1-2 sentences. Not generic — reference something specific from their chart.",
  "personalitySummary": "A 3-4 sentence summary of who they are, based on their Sun/Moon/Rising and key aspects. Not generic astrology — reference specific placements and what they mean together. Ground it in the book excerpts where relevant.",
  "hookQuestions": [
    {
      "id": "conflict",
      "question": "A question about how they handle conflict or challenges — personalized to their Mars/Saturn/aspects. Make it feel like a life coach asking, not an astrologer.",
      "chartBasis": "Which chart placements informed this question",
      "responseHint": "What Jehana will reveal when they answer"
    },
    {
      "id": "energy",
      "question": "A question about what drains or energizes them — personalized to their Moon/Sun/12th house. Life coach framing.",
      "chartBasis": "Which chart placements informed this question",
      "responseHint": "What Jehana will reveal when they answer"
    },
    {
      "id": "strengths",
      "question": "A question about their hidden strengths or natural gifts — personalized to their trines/Jupiter/Venus. Uplifting framing.",
      "chartBasis": "Which chart placements informed this question",
      "responseHint": "What Jehana will reveal when they answer"
    }
  ],
  "followUp": "A closing line that invites them to choose a question. 1 sentence. Warm, not pushy."
}

Important:
- The greeting should feel like Jehana already knows them
- The personality summary should reveal something they might not know about themselves
- The hook questions should feel personal, not like a quiz — they should make the person think "how did you know that?"
- Reference the book's wisdom naturally, not academically
- The tone is a wise friend, not a therapist or a fortune teller`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [{ role: "user", content: prompt }],
        options: { temperature: 0.7, top_p: 0.9, seed: 42 },
        format: "json",
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.message?.content?.trim();

    if (!content) return null;

    // Parse JSON response
    let parsed: JehanaIntro;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      parsed = JSON.parse(jsonMatch[0]);
    }

    return parsed;
  } catch (error) {
    console.error("Jehana intro generation error:", error);
    return null;
  }
}

export async function generateHookResponse(
  chart: ChartData,
  hookQuestion: HookQuestion,
  userAnswer: string
): Promise<string | null> {
  try {
    // RAG retrieval based on the hook topic + chart placements
    const ragQuery = `${hookQuestion.chartBasis} ${hookQuestion.id} ${chart.sun.signName} ${chart.moon.signName}`;
    const bookChunks = await retrieveRelevantChunks(ragQuery, 4);

    const bookContext = bookChunks.length > 0
      ? bookChunks.map((c) => c.text.substring(0, 400)).join("\n---\n")
      : "";

    const chartSummary = `
Sun: ${chart.sun.signName} ${Math.floor(chart.sun.degreesInSign)}°
Moon: ${chart.moon.signName} ${Math.floor(chart.moon.degreesInSign)}°
Ascendant: ${chart.rising.signName} ${Math.floor(chart.rising.degreesInSign)}°
Key aspects: ${chart.aspects.map((a) => `${a.planet1} ${a.type} ${a.planet2}`).join(", ")}
`;

    const prompt = `You are Jehana, an astrological life coach. The user answered one of your hook questions.

Their chart:
${chartSummary}

${bookContext ? `Relevant book passages:\n${bookContext}` : ""}

The hook question was: "${hookQuestion.question}"
This was based on: ${hookQuestion.chartBasis}

The user answered: "${userAnswer}"

Respond as Jehana:
1. Acknowledge their answer with warmth (1 sentence)
2. Connect their answer to their specific chart placements (2-3 sentences) — reference actual planets/signs/aspects
3. Offer a wellbeing/life-coach insight grounded in the book's wisdom (2-3 sentences)
4. End with a gentle reflection question or invitation to explore further (1 sentence)

Keep it under 200 words. Tone: wise friend who happens to know astrology. Do NOT say "according to the book" — just weave the wisdom naturally.`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [{ role: "user", content: prompt }],
        options: { temperature: 0.75, top_p: 0.9 },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.message?.content?.trim() || null;
  } catch (error) {
    console.error("Hook response error:", error);
    return null;
  }
}