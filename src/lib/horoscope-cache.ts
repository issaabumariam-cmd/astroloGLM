import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), "data", "horoscope_cache");

type CachedHoroscope = {
  type: string;
  date: string;
  sign: string | null;
  content: string;
  mood: number;
  luckyNumber: number;
  luckyColor: string;
  themes: string[];
  transits: { transitPlanet: string; aspectType: string; natalPlanet: string; description: string; exact: boolean }[];
  retrogrades: string[];
  sources: { chapter_num: number; chapter_title: string; text: string; score?: number }[];
  personalized: boolean;
  signName: string | null;
  signGlyph: string | null;
  createdAt: string;
};

function ensureCacheDir() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  } catch {
    // Cache dir creation failed (read-only filesystem on Vercel) — non-fatal
  }
}

function getCacheKey(type: string, sign: string, date: string, personalized: boolean): string {
  const persKey = personalized ? "pers" : "sign";
  return `${sign}_${type}_${date}_${persKey}`;
}

export function getCachedHoroscope(
  type: string,
  sign: string,
  date: string,
  personalized = false
): CachedHoroscope | null {
  ensureCacheDir();
  const key = getCacheKey(type, sign, date, personalized);
  const filePath = path.join(CACHE_DIR, `${key}.json`);

  if (!fs.existsSync(filePath)) return null;

  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data;
  } catch {
    return null;
  }
}

export function saveCachedHoroscope(
  type: string,
  sign: string,
  date: string,
  data: Omit<CachedHoroscope, "createdAt">,
  personalized = false
): void {
  ensureCacheDir();
  const key = getCacheKey(type, sign, date, personalized);
  const filePath = path.join(CACHE_DIR, `${key}.json`);

  const cached: CachedHoroscope = {
    ...data,
    createdAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(cached, null, 2), "utf-8");
  } catch {
    // Cache write failed (read-only filesystem on Vercel) — non-fatal
  }
}

// Deterministic lucky number from sign + date (same every time for same sign+date)
export function getLuckyNumber(sign: string, date: string): number {
  let hash = 0;
  const combined = sign + date;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31 + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 99) + 1;
}

// Get cache age in hours
export function getCacheAge(type: string, sign: string, date: string, personalized = false): number | null {
  ensureCacheDir();
  const key = getCacheKey(type, sign, date, personalized);
  const filePath = path.join(CACHE_DIR, `${key}.json`);

  if (!fs.existsSync(filePath)) return null;

  try {
    const stats = fs.statSync(filePath);
    const ageMs = Date.now() - stats.mtimeMs;
    return Math.floor(ageMs / (1000 * 60 * 60));
  } catch {
    return null;
  }
}