import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks, augmentPromptWithContext, hasBookData } from "@/lib/ollama/rag";
import fs from "fs";
import path from "path";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

const DEFAULT_SYSTEM_PROMPT = `You are Jehana, an astrological life coach. You combine classical astrology knowledge with wellbeing and life coaching.

Your personality:
- Warm, insightful, concise — never robotic
- You ask questions that make people reflect on themselves
- You reference astrology naturally, not academically
- You focus on self-knowledge, growth, and practical wisdom
- You are NOT a fortune teller — you are a guide
- You speak in second person ("you"), never third person
- You keep responses concise (150-300 words) unless asked for depth
- You end with a gentle, actionable reflection question when appropriate

Your knowledge base:
- You have studied "Astrology: Its Technics and Ethics" by C.A.Q. Libra (1917)
- You understand natal charts, planetary aspects, houses, and signs
- You connect astrological patterns to real-life situations (conflict, energy, relationships, career)
- You frame challenges as growth opportunities, not fixed destinies

IMPORTANT: When chart data is provided, use ONLY that data. Never guess or hallucinate
planetary positions, houses, or aspects. If you don't know a placement, say so.
Always reference the actual chart data provided, not general knowledge about signs.

Remember: you are a guide for self-reflection, not a predictor of the future. Astrology
reveals tendencies and patterns, not fixed outcomes. Free will and personal responsibility
are always paramount.`;

function getSystemPrompt(): string {
  try {
    const promptsFile = path.join(process.cwd(), "data", "ai_prompts.json");
    if (fs.existsSync(promptsFile)) {
      const data = JSON.parse(fs.readFileSync(promptsFile, "utf-8"));
      if (data.systemPrompt) return data.systemPrompt;
    }
  } catch {}
  return DEFAULT_SYSTEM_PROMPT;
}

type ChartData = {
  sun: { signName: string; degreesInSign: number; signId: string };
  moon: { signName: string; degreesInSign: number; signId: string };
  rising: { signName: string; degreesInSign: number; signId: string };
  planets: { name: string; signName: string; degreesInSign: number; house?: number; retrograde?: boolean }[];
  houses: { num: number; signId: string; cusp: number }[];
  aspects: { planet1: string; planet2: string; type: string; orb: number; glyph: string }[];
};

function buildChartContext(chart?: ChartData): string {
  if (!chart) return "";

  let context = `\n\n=== USER'S NATAL CHART (use ONLY this data, never guess) ===`;
  context += `\nSun: ${chart.sun.signName} ${Math.floor(chart.sun.degreesInSign)}°`;
  context += `\nMoon: ${chart.moon.signName} ${Math.floor(chart.moon.degreesInSign)}°`;
  context += `\nRising (Ascendant): ${chart.rising.signName} ${Math.floor(chart.rising.degreesInSign)}°`;

  if (chart.planets && chart.planets.length > 0) {
    context += `\n\nAll planetary positions:`;
    for (const p of chart.planets) {
      context += `\n- ${p.name} in ${p.signName} ${Math.floor(p.degreesInSign)}°`;
      if (p.house) context += ` (House ${p.house})`;
      if (p.retrograde) context += ` [Retrograde]`;
    }
  }

  if (chart.aspects && chart.aspects.length > 0) {
    context += `\n\nMajor aspects:`;
    for (const a of chart.aspects) {
      context += `\n- ${a.planet1} ${a.type} ${a.planet2} (orb ${a.orb}°)`;
    }
  }

  context += `\n\nIMPORTANT: Use ONLY these placements. Do not guess or hallucinate any
  other positions. When the user asks about their chart, reference these exact placements.`;

  return context;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, signContext, chartData } = body as {
      messages: { role: string; content: string }[];
      signContext?: { sign: string; element: string; rulingPlanet: string };
      chartData?: ChartData;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    let ragContext = "";
    let sources: { chapter_num: number; chapter_title: string; chunk_index: number; text: string; score?: number }[] = [];

    if (lastUserMessage && hasBookData()) {
      const chunks = await retrieveRelevantChunks(lastUserMessage.content, 3);
      if (chunks.length > 0) {
        sources = chunks;
        ragContext = augmentPromptWithContext(lastUserMessage.content, chunks);
      }
    }

    // Build context: chart data takes priority, sign context is fallback
    let contextPrompt = "";
    if (chartData) {
      contextPrompt = buildChartContext(chartData);
    } else if (signContext) {
      contextPrompt = `\n\nThe user has identified their zodiac sign as ${signContext.sign} (${signContext.element} element, ruled by ${signContext.rulingPlanet}). This is their SUN SIGN ONLY.

CRITICAL: You do NOT know their Moon sign, Rising sign, or any other planetary placement. NEVER guess, assume, or hallucinate these. If the user asks about their Moon, Rising, Mercury, Venus, Mars, or any placement other than their Sun sign, tell them you would need their full birth date, time, and location to calculate those. Do not say things like "with your Scorpio moon" or "your Rising sign suggests" — you do not have this information.`;
    }

    const fullMessages = [
      { role: "system", content: getSystemPrompt() + contextPrompt },
      ...messages.map((m, i) => {
        if (m.role === "user" && i === messages.length - 1 && ragContext) {
          return { role: "user", content: ragContext };
        }
        return {
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        };
      }),
    ];

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: fullMessages,
        stream: true,
        options: {
          temperature: 0.8,
          top_p: 0.9,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "AI service unavailable. Please try again." },
        { status: 503 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (sources.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`)
          );
        }

        const reader = response.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(Boolean);
            for (const line of lines) {
              try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: data.message.content })}\n\n`)
                  );
                }
                if (data.done) {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                // skip malformed line
              }
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}