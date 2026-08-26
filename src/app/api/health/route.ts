import { NextResponse } from "next/server";
import { ollamaHeaders } from "@/lib/ollama/headers";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

export async function GET() {
  const results = {
    gateway: { url: OLLAMA_URL, reachable: false, status: 0 as number },
    embeddings: { reachable: false, dims: 0 },
    chat: { reachable: false, responded: false },
    timestamp: new Date().toISOString(),
  };

  try {
    const healthResponse = await fetch(`${OLLAMA_URL}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });
    results.gateway.reachable = healthResponse.ok;
    results.gateway.status = healthResponse.status;
  } catch {
    // /healthz is optional — try the embeddings endpoint instead
  }

  try {
    const embedResponse = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: ollamaHeaders(),
      body: JSON.stringify({ model: "nomic-embed-text", prompt: "health check" }),
      signal: AbortSignal.timeout(10000),
    });
    if (embedResponse.ok) {
      results.embeddings.reachable = true;
      const data = await embedResponse.json();
      results.embeddings.dims = data.embedding?.length || 0;
    }
  } catch {
    // embeddings unreachable
  }

  try {
    const chatResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: ollamaHeaders(),
      body: JSON.stringify({
        messages: [{ role: "user", content: "Say OK" }],
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (chatResponse.ok) {
      results.chat.reachable = true;
      const data = await chatResponse.json();
      results.chat.responded = !!data.message?.content;
    }
  } catch {
    // chat unreachable
  }

  const allHealthy = results.embeddings.reachable && results.chat.reachable;

  return NextResponse.json(results, { status: allHealthy ? 200 : 503 });
}