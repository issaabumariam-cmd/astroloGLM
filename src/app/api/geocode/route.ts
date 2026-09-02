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

/** Curated fallback — mirrors the client-side list in geo-search.tsx. */
const FALLBACK_CITIES: GeoResult[] = [
  { name: "London, UK", lat: 51.5074, lng: -0.1278, country: "United Kingdom" },
  { name: "Manchester, UK", lat: 53.4808, lng: -2.2426, country: "United Kingdom" },
  { name: "Dublin, Ireland", lat: 53.3498, lng: -6.2603, country: "Ireland" },
  { name: "Paris, France", lat: 48.8566, lng: 2.3522, country: "France" },
  { name: "Berlin, Germany", lat: 52.52, lng: 13.405, country: "Germany" },
  { name: "Munich, Germany", lat: 48.1351, lng: 11.582, country: "Germany" },
  { name: "Amsterdam, Netherlands", lat: 52.3676, lng: 4.9041, country: "Netherlands" },
  { name: "Brussels, Belgium", lat: 50.8503, lng: 4.3517, country: "Belgium" },
  { name: "Zurich, Switzerland", lat: 47.3769, lng: 8.5417, country: "Switzerland" },
  { name: "Vienna, Austria", lat: 48.2082, lng: 16.3738, country: "Austria" },
  { name: "Madrid, Spain", lat: 40.4168, lng: -3.7038, country: "Spain" },
  { name: "Barcelona, Spain", lat: 41.3874, lng: 2.1686, country: "Spain" },
  { name: "Lisbon, Portugal", lat: 38.7223, lng: -9.1393, country: "Portugal" },
  { name: "Rome, Italy", lat: 41.9028, lng: 12.4964, country: "Italy" },
  { name: "Milan, Italy", lat: 45.4642, lng: 9.19, country: "Italy" },
  { name: "Athens, Greece", lat: 37.9838, lng: 23.7275, country: "Greece" },
  { name: "Stockholm, Sweden", lat: 59.3293, lng: 18.0686, country: "Sweden" },
  { name: "Oslo, Norway", lat: 59.9139, lng: 10.7522, country: "Norway" },
  { name: "Copenhagen, Denmark", lat: 55.6761, lng: 12.5683, country: "Denmark" },
  { name: "Helsinki, Finland", lat: 60.1699, lng: 24.9384, country: "Finland" },
  { name: "Warsaw, Poland", lat: 52.2297, lng: 21.0122, country: "Poland" },
  { name: "Prague, Czechia", lat: 50.0755, lng: 14.4378, country: "Czechia" },
  { name: "Budapest, Hungary", lat: 47.4979, lng: 19.0402, country: "Hungary" },
  { name: "Istanbul, Turkey", lat: 41.0082, lng: 28.9784, country: "Turkey" },
  { name: "Amman, Jordan", lat: 31.9539, lng: 35.9108, country: "Jordan" },
  { name: "Zarqa, Jordan", lat: 32.0728, lng: 36.0881, country: "Jordan" },
  { name: "Irbid, Jordan", lat: 32.5556, lng: 35.85, country: "Jordan" },
  { name: "Dubai, UAE", lat: 25.2048, lng: 55.2708, country: "UAE" },
  { name: "Abu Dhabi, UAE", lat: 24.4539, lng: 54.3773, country: "UAE" },
  { name: "Riyadh, Saudi Arabia", lat: 24.7136, lng: 46.6753, country: "Saudi Arabia" },
  { name: "Jeddah, Saudi Arabia", lat: 21.4858, lng: 39.1925, country: "Saudi Arabia" },
  { name: "Mecca, Saudi Arabia", lat: 21.3891, lng: 39.8579, country: "Saudi Arabia" },
  { name: "Medina, Saudi Arabia", lat: 24.5247, lng: 39.5692, country: "Saudi Arabia" },
  { name: "Doha, Qatar", lat: 25.2854, lng: 51.531, country: "Qatar" },
  { name: "Kuwait City, Kuwait", lat: 29.3759, lng: 47.9774, country: "Kuwait" },
  { name: "Beirut, Lebanon", lat: 33.8938, lng: 35.5018, country: "Lebanon" },
  { name: "Cairo, Egypt", lat: 30.0444, lng: 30.2564, country: "Egypt" },
  { name: "Casablanca, Morocco", lat: 33.5731, lng: -7.5898, country: "Morocco" },
  { name: "New York, USA", lat: 40.7128, lng: -74.006, country: "USA" },
  { name: "Chicago, USA", lat: 41.8781, lng: -87.6298, country: "USA" },
  { name: "Los Angeles, USA", lat: 34.0522, lng: -118.2437, country: "USA" },
  { name: "Toronto, Canada", lat: 43.6532, lng: -79.3832, country: "Canada" },
  { name: "Sydney, Australia", lat: -33.8688, lng: 151.2093, country: "Australia" },
];

function searchFallback(query: string): GeoResult[] {
  const q = query.toLowerCase();
  const direct = FALLBACK_CITIES.filter((c) => c.name.toLowerCase().includes(q));
  if (direct.length > 0) return direct.slice(0, 5);
  // fuzzy: match any word
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  return FALLBACK_CITIES.filter((c) => words.some((w) => c.name.toLowerCase().includes(w))).slice(0, 5);
}

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

  // Nominatim with a hard 5s timeout so a hanging OSM never stalls the UX
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Astrolo/1.0 (astrolo.app)" },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`nominatim ${response.status}`);

    const data = await response.json();
    const results: GeoResult[] = data.map((item: { display_name: string; lat: string; lon: string; address?: { country?: string; state?: string } }) => ({
      name: item.display_name.split(",").slice(0, 3).join(", ").trim(),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      country: item.address?.country,
      admin1: item.address?.state,
    }));

    // Enrich with curated matches not already in the remote results
    const seen = new Set(results.map((r) => r.name.split(",")[0].toLowerCase()));
    const extras = searchFallback(query).filter((c) => !seen.has(c.name.split(",")[0].toLowerCase()));
    const merged = [...results, ...extras].slice(0, 8);

    CACHE.set(cacheKey, { results: merged, expiry: Date.now() + CACHE_TTL });
    return NextResponse.json({ results: merged });
  } catch {
    // Nominatim failed (timeout/blocked/rate-limited) — curated list keeps
    // location search WORKING instead of returning an empty error.
    const fallback = searchFallback(query);
    // Don't cache failures long — retry OSM after a minute
    CACHE.set(cacheKey, { results: fallback, expiry: Date.now() + 60 * 1000 });
    return NextResponse.json({ results: fallback, degraded: true });
  } finally {
    clearTimeout(timeout);
  }
}