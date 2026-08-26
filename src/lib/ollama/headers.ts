export function ollamaHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.OLLAMA_API_KEY;
  if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}