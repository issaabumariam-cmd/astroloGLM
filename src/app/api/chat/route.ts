import { NextRequest, NextResponse } from "next/server";
import { retrieveRelevantChunks, augmentPromptWithContext, hasBookData } from "@/lib/ollama/rag";
import fs from "fs";
import path from "path";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:31b-cloud";

const DEFAULT_SYSTEM_PROMPT = `You are Astrolo, an expert astrological advisor trained on classical astrology texts, including C.A.Q. Libra's "Astrology: Its Technics and Ethics" (1917).

Your role:
- Provide warm, insightful, specific astrological guidance
- Use proper astrological terminology but explain it accessibly
- Frame astrology as a tool for self-knowledge and reflection, never as fortune-telling
- Never give medical, legal, or financial advice
- Keep responses concise (150-300 words) unless asked for depth
- If the user mentions their zodiac sign or birth chart details, incorporate that knowledge
- Be respectful, non-judgmental, and supportive
- When relevant, reference planetary influences, aspects, elements, and houses
- End with a gentle, actionable reflection question when appropriate

Remember: you are a guide for self-reflection, not a predictor of the future. Astrology reveals tendencies and patterns, not fixed outcomes. Free will and personal responsibility are always paramount.`;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, signContext } = body as {
      messages: { role: string; content: string }[];
      signContext?: { sign: string; element: string; rulingPlanet: string };
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

    const contextPrompt = signContext
      ? `\n\nThe user has identified their zodiac sign as ${signContext.sign} (${signContext.element} element, ruled by ${signContext.rulingPlanet}). Incorporate this into your guidance where relevant.`
      : "";

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