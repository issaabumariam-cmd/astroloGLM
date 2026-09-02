import { ollamaHeaders } from "./headers";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

const MAX_RETRIES = 2;
const RATE_LIMIT_RETRIES = 1;
const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8000;
const RATE_LIMIT_STATUS = 429;
const PAYLOAD_TOO_LARGE = 413;
const GATEWAY_TIMEOUT = 504;
const BAD_GATEWAY = 502;
const SERVICE_UNAVAILABLE = 503;

// Time-to-first-byte budgets. Streaming responses may legitimately take long
// to finish, but the gateway must START responding within this window.
const TTFB_TIMEOUT_MS = 20_000;
const NON_STREAM_TIMEOUT_MS = 55_000;
const QUEUE_TIMEOUT_MS = 15_000;

const MAX_CONCURRENCY = 4;
let activeRequests = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENCY) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const index = queue.indexOf(waiter);
      if (index !== -1) queue.splice(index, 1);
      reject(new GatewayBusyError());
    }, QUEUE_TIMEOUT_MS);
    const waiter = () => {
      clearTimeout(timer);
      activeRequests++;
      resolve();
    };
    queue.push(waiter);
  });
}

function releaseSlot(): void {
  activeRequests--;
  const next = queue.shift();
  if (next) next();
}

export class GatewayError extends Error {
  constructor(message: string, public code: string, public statusCode: number, public retryAfterMs?: number) {
    super(message);
    this.name = "GatewayError";
  }
}

export class GatewayRateLimitError extends GatewayError {
  constructor(retryAfterMs: number) {
    super("AI gateway rate limit reached. Please try again.", "RATE_LIMITED", 429, retryAfterMs);
    this.name = "GatewayRateLimitError";
  }
}

export class GatewayPayloadTooLargeError extends GatewayError {
  constructor() {
    super("Request too large for the AI gateway (5MB limit).", "PAYLOAD_TOO_LARGE", 413);
    this.name = "GatewayPayloadTooLargeError";
  }
}

export class GatewayTimeoutError extends GatewayError {
  constructor(code: string = "GATEWAY_TIMEOUT") {
    super("The AI gateway timed out. Please try again.", code, 504);
    this.name = "GatewayTimeoutError";
  }
}

export class GatewayBusyError extends GatewayError {
  constructor() {
    super("Too many AI requests at once. Please try again in a moment.", "GATEWAY_BUSY", 503, 5_000);
    this.name = "GatewayBusyError";
  }
}

type GatewayFetchOptions = {
  path: string;
  body: Record<string, unknown>;
  signal?: AbortSignal;
  /** Treat the response as streaming: only enforce a time-to-first-byte budget. */
  streaming?: boolean;
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Full-jitter exponential backoff — de-synchronizes clients hammering a shared gateway. */
function backoffWithJitter(attempt: number): number {
  const base = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
  return Math.random() * base;
}

/** Wait for response headers (TTFB), then stop racing — the body may stream for minutes. */
async function fetchWithTtfbTimeout(url: string, init: RequestInit, ttfbMs: number): Promise<Response> {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), ttfbMs);
  const onExternalAbort = () => timeoutController.abort();
  init.signal?.addEventListener("abort", onExternalAbort);
  try {
    const response = await fetch(url, { ...init, signal: timeoutController.signal });
    // Headers arrived. Hand over to per-read timeout via signal if provided.
    return response;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", onExternalAbort);
  }
}

export async function gatewayFetch({ path, body, signal, streaming = false }: GatewayFetchOptions): Promise<Response> {
  const url = `${OLLAMA_URL}${path}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await acquireSlot();
    try {
      const ttfbBudget = streaming ? TTFB_TIMEOUT_MS : NON_STREAM_TIMEOUT_MS;
      const response = await fetchWithTtfbTimeout(
        url,
        {
          method: "POST",
          headers: ollamaHeaders(),
          body: JSON.stringify(body),
          signal,
        },
        ttfbBudget
      );
      releaseSlot();

      if (response.ok) return response;

      if (response.status === RATE_LIMIT_STATUS) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "0", 10);
        const backoff = retryAfter > 0 ? retryAfter * 1000 : backoffWithJitter(attempt);
        console.warn(`[Gateway] 429 rate limited (attempt ${attempt + 1}), backing off ${Math.round(backoff)}ms`);
        // A shared gateway that is rate-limiting is overloaded: retrying hard
        // makes it worse. One retry max, then surface a precise error.
        if (attempt < RATE_LIMIT_RETRIES) {
          await sleep(backoff);
          continue;
        }
        throw new GatewayRateLimitError(backoff);
      }

      if (response.status === PAYLOAD_TOO_LARGE) {
        throw new GatewayPayloadTooLargeError();
      }

      if (response.status === GATEWAY_TIMEOUT || response.status === BAD_GATEWAY || response.status === SERVICE_UNAVAILABLE) {
        console.warn(`[Gateway] ${response.status} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
        if (attempt < MAX_RETRIES) {
          await sleep(backoffWithJitter(attempt));
          continue;
        }
        throw new GatewayTimeoutError();
      }

      const errorBody = await response.text().catch(() => "");
      console.error(`[Gateway] ${path} failed: ${response.status} ${response.statusText} — ${errorBody}`);
      return response;
    } catch (error) {
      releaseSlot();
      if (error instanceof GatewayError) throw error;
      lastError = error as Error;
      const aborted = signal?.aborted || (lastError.name === "AbortError" && !signal);
      console.warn(`[Gateway] ${path} ${aborted ? "timed out" : "network error"} (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError.message}`);
      if (aborted && !signal) {
        // Our own TTFB/queue timeout — treat as timeout, retry once
        if (attempt < MAX_RETRIES) {
          await sleep(backoffWithJitter(attempt));
          continue;
        }
        throw new GatewayTimeoutError("GATEWAY_TTFB_TIMEOUT");
      }
      if (attempt < MAX_RETRIES) {
        await sleep(backoffWithJitter(attempt));
        continue;
      }
      throw new GatewayError("Cannot reach the AI gateway.", "GATEWAY_UNREACHABLE", 502, 3_000);
    }
  }

  throw lastError || new GatewayError("Gateway fetch failed after all retries", "GATEWAY_UNREACHABLE", 502);
}

export async function gatewayFetchJson<T = unknown>(options: GatewayFetchOptions): Promise<T> {
  const response = await gatewayFetch(options);
  return response.json() as Promise<T>;
}