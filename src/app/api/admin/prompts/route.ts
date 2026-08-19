import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROMPTS_FILE = path.join(process.cwd(), "data", "ai_prompts.json");

type PromptsConfig = {
  systemPrompt: string;
};

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

function loadPrompts(): PromptsConfig {
  try {
    if (fs.existsSync(PROMPTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf-8"));
      return { systemPrompt: data.systemPrompt || DEFAULT_SYSTEM_PROMPT };
    }
  } catch {}
  return { systemPrompt: DEFAULT_SYSTEM_PROMPT };
}

export async function GET() {
  const prompts = loadPrompts();
  return NextResponse.json(prompts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { systemPrompt } = body as { systemPrompt: string };

    if (!systemPrompt) {
      return NextResponse.json({ error: "systemPrompt required" }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(PROMPTS_FILE, JSON.stringify({ systemPrompt }, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Could not save prompts" }, { status: 500 });
  }
}