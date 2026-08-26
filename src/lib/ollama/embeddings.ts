import { gatewayFetch, GatewayRateLimitError, GatewayPayloadTooLargeError, GatewayTimeoutError } from "./gateway-fetch";

const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";

export async function embedText(text: string): Promise<number[] | null> {
  try {
    const response = await gatewayFetch({
      path: "/api/embeddings",
      body: { model: EMBED_MODEL, prompt: text },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.embedding || null;
  } catch (error) {
    if (error instanceof GatewayRateLimitError || error instanceof GatewayPayloadTooLargeError || error instanceof GatewayTimeoutError) {
      console.error(`Embedding gateway error: ${error.message}`);
    } else {
      console.error("Embedding error:", error);
    }
    return null;
  }
}

export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const chunk of chunks) {
    const embedding = await embedText(chunk);
    if (embedding) embeddings.push(embedding);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return embeddings;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}