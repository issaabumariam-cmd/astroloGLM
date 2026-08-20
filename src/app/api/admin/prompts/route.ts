import { NextRequest, NextResponse } from "next/server";
import { loadPrompts, savePrompts, PROMPT_META, type PromptKey } from "@/lib/prompts";

export async function GET() {
  const config = loadPrompts();
  return NextResponse.json({
    prompts: PROMPT_META.map((m) => ({
      ...m,
      value: config[m.key],
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updates: Partial<Record<PromptKey, string>> = {};

    for (const key of Object.keys(body) as PromptKey[]) {
      if (typeof body[key] === "string") {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid prompt keys provided" }, { status: 400 });
    }

    savePrompts(updates);
    return NextResponse.json({ success: true, saved: Object.keys(updates) });
  } catch {
    return NextResponse.json({ error: "Could not save prompts" }, { status: 500 });
  }
}
