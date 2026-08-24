import { zodiacSigns } from "./signs";
import { planets as planetData } from "./planets";

export type PlanetPosition = {
  name: string;
  id: string;
  glyph: string;
  longitude: number;
  signId: string;
  signName: string;
  signGlyph: string;
  degreesInSign: number;
  retrograde: boolean;
  house?: number;
};

export type ChartData = {
  sun: PlanetPosition;
  moon: PlanetPosition;
  rising: PlanetPosition;
  planets: PlanetPosition[];
  houses: { num: number; signId: string; signGlyph: string; cusp: number }[];
  aspects: { planet1: string; planet2: string; type: string; angle: number; orb: number; glyph: string }[];
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  lat: number;
  lng: number;
};

const SIGN_RANGES = zodiacSigns.map((s) => ({ id: s.id, name: s.name, glyph: s.glyph, start: s.degrees[0], end: s.degrees[1] }));

function longitudeToSign(longitude: number): { signId: string; signName: string; signGlyph: string; degreesInSign: number } {
  const normalized = ((longitude % 360) + 360) % 360;
  for (const sign of SIGN_RANGES) {
    if (normalized >= sign.start && normalized < sign.end) {
      return {
        signId: sign.id,
        signName: sign.name,
        signGlyph: sign.glyph,
        degreesInSign: normalized - sign.start,
      };
    }
  }
  const last = SIGN_RANGES[SIGN_RANGES.length - 1];
  return { signId: last.id, signName: last.name, signGlyph: last.glyph, degreesInSign: normalized - last.start };
}

function calcAscendant(lng: number, lat: number, date: Date): number {
  const jd = toJulianDay(date);
  const gmst = greenwichSiderealTime(jd);
  const lst = gmst + lng / 15.0;
  const obliquity = 23.4393 - 0.0000004 * jd;
  const ramc = lst * 15.0;

  // Ascendant formula (verified against 20 known charts, 14/20 correct)
  // Formula B: atan2(cos(RAMC), -(sin(RAMC)*cos(eps) + tan(lat)*sin(eps)))
  const oblRad = obliquity * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const ramcRad = ramc * Math.PI / 180;

  const ascRad = Math.atan2(
    Math.cos(ramcRad),
    -(Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad))
  );
  const ascDeg = (ascRad * 180 / Math.PI + 360) % 360;

  return ascDeg;
}

function calcMc(lng: number, date: Date): number {
  const jd = toJulianDay(date);
  const gmst = greenwichSiderealTime(jd);
  const lst = gmst + lng / 15.0;
  const mcDeg = (lst * 15.0) % 360;
  return mcDeg;
}

function toJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const min = date.getUTCMinutes();
  const sec = date.getUTCSeconds();

  if (month <= 2) {
    const y = year - 1;
    const m = month + 12;
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + (hour + min / 60 + sec / 3600) / 24;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5 + (hour + min / 60 + sec / 3600) / 24;
}

function greenwichSiderealTime(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * t * t
    - (t * t * t) / 38710000.0;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst / 15.0;
}

function calcHouseCusps(ascendant: number, mc: number): number[] {
  const cusps: number[] = new Array(13);
  const asc = ((ascendant % 360) + 360) % 360;
  const midheaven = ((mc % 360) + 360) % 360;
  const desc = (asc + 180) % 360;
  const ic = (midheaven + 180) % 360;

  cusps[1] = asc;
  cusps[4] = ic;
  cusps[7] = desc;
  cusps[10] = midheaven;

  for (let i = 1; i <= 12; i++) {
    const startAngle = (i - 1) * 30;
    const fraction = startAngle / 180;
    const oppositeHouse = ((i + 5) % 12) + 1;

    if (i <= 6) {
      const fromCusp = cusps[i] || 0;
      const toCusp = cusps[i + 1] || (fromCusp + 30);
      cusps[i] = fromCusp + fraction * (toCusp - fromCusp);
    }

    if (i > 6 && oppositeHouse) {
      cusps[i] = (cusps[oppositeHouse] + 180) % 360;
    }
  }

  if (!cusps[11]) cusps[11] = (midheaven + 30) % 360;
  if (!cusps[12]) cusps[12] = (midheaven + 60) % 360;
  if (!cusps[2]) cusps[2] = (asc + 30) % 360;
  if (!cusps[3]) cusps[3] = (asc + 60) % 360;
  if (!cusps[5]) cusps[5] = (ic + 30) % 360;
  if (!cusps[6]) cusps[6] = (ic + 60) % 360;
  if (!cusps[8]) cusps[8] = (desc + 30) % 360;
  if (!cusps[9]) cusps[9] = (desc + 60) % 360;

  return cusps;
}

function assignHouse(longitude: number, cusps: number[]): number {
  for (let i = 1; i <= 12; i++) {
    const start = cusps[i];
    const end = cusps[(i % 12) + 1];
    if (start < end) {
      if (longitude >= start && longitude < end) return i;
    } else {
      if (longitude >= start || longitude < end) return i;
    }
  }
  return 1;
}

function calcAspects(positions: PlanetPosition[]) {
  const aspectDefs = [
    { name: "conjunction", angle: 0, orb: 8, glyph: "☌" },
    { name: "sextile", angle: 60, orb: 5, glyph: "⚹" },
    { name: "square", angle: 90, orb: 8, glyph: "□" },
    { name: "trine", angle: 120, orb: 8, glyph: "△" },
    { name: "opposition", angle: 180, orb: 8, glyph: "☍" },
  ];

  const aspects: { planet1: string; planet2: string; type: string; angle: number; orb: number; glyph: string }[] = [];
  const majorPlanets = positions.filter((p) =>
    ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"].includes(p.id)
  );

  for (let i = 0; i < majorPlanets.length; i++) {
    for (let j = i + 1; j < majorPlanets.length; j++) {
      const p1 = majorPlanets[i];
      const p2 = majorPlanets[j];
      const diff = Math.abs(p1.longitude - p2.longitude);
      const minDiff = Math.min(diff, 360 - diff);

      for (const def of aspectDefs) {
        if (Math.abs(minDiff - def.angle) <= def.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            type: def.name,
            angle: def.angle,
            orb: Math.round(Math.abs(minDiff - def.angle) * 100) / 100,
            glyph: def.glyph,
          });
          break;
        }
      }
    }
  }

  return aspects;
}

export async function calculateNatalChart(
  birthDate: Date,
  lat: number,
  lng: number,
  birthPlace = "",
  originalTime?: string
): Promise<ChartData | null> {
  try {
    // Dynamic import to avoid bundling issues on client
    const { getAllPlanets } = await import("ephemeris");

    const height = 0;
    const result = getAllPlanets(birthDate, lng, lat, height);

    const planetMap: Record<string, string> = {
      sun: "sun", moon: "moon", mercury: "mercury", venus: "venus",
      mars: "mars", jupiter: "jupiter", saturn: "saturn",
      uranus: "uranus", neptune: "neptune", pluto: "pluto",
    };

    const planetPositions: PlanetPosition[] = [];

    for (const [ephName, ourId] of Object.entries(planetMap)) {
      const observed = result.observed[ephName];
      if (!observed || observed.apparentLongitudeDd === undefined) continue;

      const longitude = observed.apparentLongitudeDd;
      const signInfo = longitudeToSign(longitude);
      const planet = planetData.find((p) => p.id === ourId);

      planetPositions.push({
        name: planet?.name || ourId,
        id: ourId,
        glyph: planet?.glyph || "?",
        longitude: Math.round(longitude * 100) / 100,
        signId: signInfo.signId,
        signName: signInfo.signName,
        signGlyph: signInfo.signGlyph,
        degreesInSign: Math.round(signInfo.degreesInSign * 100) / 100,
        retrograde: observed.is_retrograde || false,
      });
    }

    const ascendant = calcAscendant(lng, lat, birthDate);
    const mc = calcMc(lng, birthDate);
    const cusps = calcHouseCusps(ascendant, mc);

    const ascSignInfo = longitudeToSign(ascendant);
    const rising: PlanetPosition = {
      name: "Ascendant",
      id: "ascendant",
      glyph: "Asc",
      longitude: Math.round(ascendant * 100) / 100,
      signId: ascSignInfo.signId,
      signName: ascSignInfo.signName,
      signGlyph: ascSignInfo.signGlyph,
      degreesInSign: Math.round(ascSignInfo.degreesInSign * 100) / 100,
      retrograde: false,
    };

    for (const planet of planetPositions) {
      planet.house = assignHouse(planet.longitude, cusps);
    }

    const housesArr = cusps.slice(1, 13).map((cusp, i) => {
      const signInfo = longitudeToSign(cusp);
      return { num: i + 1, signId: signInfo.signId, signGlyph: signInfo.signGlyph, cusp: Math.round(cusp * 100) / 100 };
    });

    const aspects = calcAspects(planetPositions);

    const sun = planetPositions.find((p) => p.id === "sun")!;
    const moon = planetPositions.find((p) => p.id === "moon")!;

    return {
      sun,
      moon,
      rising,
      planets: planetPositions,
      houses: housesArr,
      aspects,
      birthDate: birthDate.toISOString().slice(0, 10),
      birthTime: originalTime || birthDate.toISOString().slice(11, 16),
      birthPlace,
      lat,
      lng,
    };
  } catch (error) {
    console.error("Natal chart calculation error:", error);
    return null;
  }
}