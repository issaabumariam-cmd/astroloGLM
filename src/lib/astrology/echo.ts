// Jehana hook question generator — analyzes natal chart and generates
// personalized life-coaching questions grounded in the book's knowledge

import type { ChartData } from "./chart";
import { retrieveRelevantChunks } from "../ollama/rag";
import { buildPrompt } from "../prompts";
import { gatewayFetch } from "../ollama/gateway-fetch";

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

    const introNote = `Based on this natal chart, generate Jehana's opening message and 3 personalized hook questions.`;
    const bookSection = bookContext ? `Relevant excerpts from C.A.Q. Libra's book:\n${bookContext}` : "";

    const prompt = buildPrompt(
      "jehanaIntro",
      introNote,
      chartSummary,
      bookSection
    );

    const response = await gatewayFetch({
      path: "/api/chat",
      body: {
        model: OLLAMA_MODEL,
        stream: false,
        messages: [{ role: "user", content: prompt }],
        options: { temperature: 0.7, top_p: 0.9, seed: 42 },
        format: "json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`Ollama echo intro failed: ${response.status} ${response.statusText} — ${errorBody}`);
      return null;
    }

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

    const response = await gatewayFetch({
      path: "/api/chat",
      body: {
        model: OLLAMA_MODEL,
        stream: false,
        messages: [{ role: "user", content: prompt }],
        options: { temperature: 0.75, top_p: 0.9 },
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`Ollama hook response failed: ${response.status} ${response.statusText} — ${errorBody}`);
      return null;
    }

    const data = await response.json();
    return data.message?.content?.trim() || null;
  } catch (error) {
    console.error("Hook response error:", error);
    return null;
  }
}