import { ollamaHeaders } from "./headers";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const RATE_LIMIT_STATUS = 429;
const PAYLOAD_TOO_LARGE = 413;
const GATEWAY_TIMEOUT = 504;

const MAX_CONCURRENCY = 4;
let activeRequests = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENCY) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    queue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeRequests--;
  const next = queue.shift();
  if (next) next();
}

export class GatewayRateLimitError extends Error {
  constructor(public retryAfterMs: number) {
    super("AI gateway rate limit reached. Please try again.");
    this.name = "GatewayRateLimitError";
  }
}

export class GatewayPayloadTooLargeError extends Error {
  constructor() {
    super("Request too large for the AI gateway (5MB limit).");
    this.name = "GatewayPayloadTooLargeError";
  }
}

export class GatewayTimeoutError extends Error {
  constructor() {
    super("The AI gateway timed out (120s). Please try again.");
    this.name = "GatewayTimeoutError";
  }
}

type GatewayFetchOptions = {
  path: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function gatewayFetch({ path, body, signal }: GatewayFetchOptions): Promise<Response> {
  const url = `${OLLAMA_URL}${path}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await acquireSlot();
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: ollamaHeaders(),
        body: JSON.stringify(body),
        signal,
      });
      releaseSlot();

      if (response.ok) return response;

      if (response.status === RATE_LIMIT_STATUS) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10);
        const backoff = retryAfter > 0 ? retryAfter * 1000 : INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.warn(`[Gateway] 429 rate limited (attempt ${attempt + 1}/${MAX_RETRIES + 1}), backing off ${backoff}ms`);
        if (attempt < MAX_RETRIES) {
          await sleep(backoff);
          continue;
        }
        throw new GatewayRateLimitError(backoff);
      }

      if (response.status === PAYLOAD_TOO_LARGE) {
        throw new GatewayPayloadTooLargeError();
      }

      if (response.status === GATEWAY_TIMEOUT) {
        console.warn(`[Gateway] 504 timeout (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        if (attempt < MAX_RETRIES) {
          await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
          continue;
        }
        throw new GatewayTimeoutError();
      }

      const errorBody = await response.text().catch(() => "");
      console.error(`[Gateway] ${path} failed: ${response.status} ${response.statusText} — ${errorBody}`);
      return response;
    } catch (error) {
      releaseSlot();
      if (error instanceof GatewayRateLimitError || error instanceof GatewayPayloadTooLargeError || error instanceof GatewayTimeoutError) {
        throw error;
      }
      lastError = error as Error;
      console.warn(`[Gateway] ${path} network error (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError || new Error("Gateway fetch failed after all retries");
}

export async function gatewayFetchJson<T = unknown>({ path, body, signal }: GatewayFetchOptions): Promise<T> {
  const response = await gatewayFetch({ path, body, signal });
  return response.json() as Promise<T>;
}