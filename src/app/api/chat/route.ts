import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunksDetailed, augmentPromptWithContext, hasBookData } from "@/lib/ollama/rag";
import { getPrompt } from "@/lib/prompts";
import { gatewayFetch, GatewayRateLimitError, GatewayPayloadTooLargeError, GatewayTimeoutError } from "@/lib/ollama/gateway-fetch";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

function getSystemPrompt(tier?: string): string {
  const persona = getPrompt("jehanaPersona");
  const taskKey = tier === "premium" ? "premiumAdvisor" : "chatAdvisor";
  const taskInstructions = getPrompt(taskKey);
  return taskInstructions ? `${persona}\n\n${taskInstructions}` : persona;
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
    const { messages, signContext, chartData, tier } = body as {
      messages: { role: string; content: string }[];
      signContext?: { sign: string; element: string; rulingPlanet: string };
      chartData?: ChartData;
      tier?: "free" | "premium";
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    // Server-enforced free count check for Deep Echo (tier=premium = chart-aware chat)
    // Echo chat (no tier or tier=free) is unlimited
    let userUuid: string | null = null;
    let isPremiumUser = false;
    if (tier === "premium" && chartData) {
      const authHeader = request.headers.get("authorization");
      const accessToken = authHeader?.replace("Bearer ", "");
      if (accessToken) {
        const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
        if (user) {
          userUuid = user.id;
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("ai_questions_used, ai_questions_limit, subscription_status")
            .eq("id", user.id)
            .single();
          if (profile) {
            isPremiumUser = profile.subscription_status === "premium";
            if (!isPremiumUser && profile.ai_questions_used >= profile.ai_questions_limit) {
              return NextResponse.json(
                { error: "You've used your free Deep Echo questions. Upgrade for unlimited access.", code: "FREE_LIMIT_REACHED" },
                { status: 402 }
              );
            }
          }
        }
      }
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    let ragContext = "";
    let sources: { chapter_num: number; chapter_title: string; chunk_index: number; text: string; score?: number }[] = [];
    let ragMeta: { method: string; topScore: number | null; queryDims: number | null; bookChunks: number; embeddedChunks: number } | null = null;

    if (lastUserMessage && hasBookData()) {
      const retrieval = await retrieveRelevantChunksDetailed(lastUserMessage.content, 6);
      ragMeta = {
        method: retrieval.method,
        topScore: retrieval.topScore,
        queryDims: retrieval.queryEmbeddingDims,
        bookChunks: retrieval.bookChunksTotal,
        embeddedChunks: retrieval.embeddedChunksTotal,
      };
      if (retrieval.chunks.length > 0) {
        sources = retrieval.chunks.map((c) => ({
          chapter_num: c.chapter_num,
          chapter_title: c.chapter_title,
          chunk_index: c.chunk_index,
          text: c.text,
          score: c.score,
        }));
        ragContext = augmentPromptWithContext(lastUserMessage.content, retrieval.chunks);
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
      { role: "system", content: getSystemPrompt(tier) + contextPrompt },
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

    const response = await gatewayFetch({
      path: "/api/chat",
      body: {
        model: OLLAMA_MODEL,
        messages: fullMessages,
        stream: true,
        options: {
          temperature: 0.8,
          top_p: 0.9,
        },
      },
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      console.error(`Ollama chat request failed: ${response.status} ${response.statusText} — ${errorBody}`);
      return NextResponse.json(
        { error: "AI service unavailable. Please try again." },
        { status: 503 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (ragMeta) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ rag: ragMeta })}\n\n`)
          );
        }
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
          // Increment free count for non-premium Deep Echo users (atomic via fetched value)
          if (userUuid && !isPremiumUser) {
            try {
              const { data: profile } = await supabaseAdmin
                .from("profiles")
                .select("ai_questions_used")
                .eq("id", userUuid)
                .single();
              if (profile) {
                await supabaseAdmin
                  .from("profiles")
                  .update({ ai_questions_used: (profile.ai_questions_used || 0) + 1 })
                  .eq("id", userUuid);
              }
            } catch (e) {
              console.warn("Failed to increment ai_questions_used:", e);
            }
          }
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
    if (error instanceof GatewayRateLimitError) {
      return NextResponse.json({ error: "The cosmos is busy right now. Please wait a moment and try again." }, { status: 429 });
    }
    if (error instanceof GatewayPayloadTooLargeError) {
      return NextResponse.json({ error: "Your message is too long. Please shorten it and try again." }, { status: 413 });
    }
    if (error instanceof GatewayTimeoutError) {
      return NextResponse.json({ error: "The cosmos is taking too long to respond. Please try again." }, { status: 504 });
    }
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}