import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 10;

const CACHE = new Map<string, { results: GeoResult[]; expiry: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MAP = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

export type GeoResult = {
  name: string;
  lat: number;
  lng: number;
  country?: string;
  admin1?: string;
};

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const query = q.trim();
  if (query.length > 200) {
    return NextResponse.json({ results: [] });
  }

  // Rate limit per IP
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const rl = RATE_LIMIT_MAP.get(clientIp);
  if (rl && rl.resetAt > now) {
    if (rl.count >= RATE_LIMIT_MAX) {
      return NextResponse.json({ results: [], error: "Too many requests" }, { status: 429 });
    }
    rl.count++;
  } else {
    RATE_LIMIT_MAP.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }

  const cacheKey = query.toLowerCase();
  const cached = CACHE.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json({ results: cached.results });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Astrolo/1.0 (astrolo.app)",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [], error: "Geocoding service unavailable" }, { status: 502 });
    }

    const data = await response.json();
    const results: GeoResult[] = data.map((item: { display_name: string; lat: string; lon: string; address?: { country?: string; state?: string } }) => ({
      name: item.display_name.split(",").slice(0, 3).join(", ").trim(),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      country: item.address?.country,
      admin1: item.address?.state,
    }));

    CACHE.set(cacheKey, { results, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Geocoding failed" }, { status: 502 });
  }
}