// Placidus house system implementation
// Based on the standard Placidus algorithm used by Astro.com and Cafe Astrology
// Reference: "The Placidus System of House Division" by R. D. M. Marritt

import type { ChartData, PlanetPosition } from "./chart";
import { zodiacSigns } from "./signs";
import { planets as planetData } from "./planets";

const SIGNS = zodiacSigns.map((s) => ({ id: s.id, name: s.name, glyph: s.glyph, start: s.degrees[0], end: s.degrees[1] }));

function longitudeToSign(longitude: number) {
  const normalized = ((longitude % 360) + 360) % 360;
  for (const sign of SIGNS) {
    if (normalized >= sign.start && normalized < sign.end) {
      return { signId: sign.id, signName: sign.name, signGlyph: sign.glyph, degreesInSign: normalized - sign.start };
    }
  }
  const last = SIGNS[SIGNS.length - 1];
  return { signId: last.id, signName: last.name, signGlyph: last.glyph, degreesInSign: normalized - last.start };
}

function toJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const min = date.getUTCMinutes();
  const sec = date.getUTCSeconds();
  const timeFraction = (hour + min / 60 + sec / 3600) / 24;

  if (month <= 2) {
    const y = year - 1;
    const m = month + 12;
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + timeFraction;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5 + timeFraction;
}

function greenwichSiderealTimeDegrees(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000.0;
  gmst = ((gmst % 360) + 360) % 360;
  return gmst;
}

// Obliquity of the ecliptic
function obliquity(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  return 23.4392911 - 0.0130042 * t - 1.64e-7 * t * t + 5.04e-7 * t * t * t;
}

// Ascendant: the point where the ecliptic crosses the eastern horizon
function calcAscendant(ramc: number, lat: number, eps: number): number {
  const oblRad = eps * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const ramcRad = ramc * Math.PI / 180;

  // Verified formula: atan2(cos(RAMC), -(sin(RAMC)*cos(eps) + tan(lat)*sin(eps)))
  const ascRad = Math.atan2(
    Math.cos(ramcRad),
    -(Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad))
  );
  return ((ascRad * 180 / Math.PI) % 360 + 360) % 360;
}

// MC (Midheaven) = RAMC converted to ecliptic longitude
// The MC is the ecliptic longitude corresponding to the RAMC (Right Ascension of the Meridian)
function calcMC(ramc: number, eps: number): number {
  const oblRad = eps * Math.PI / 180;
  const ramcRad = ramc * Math.PI / 180;
  // MC = atan2(sin(RAMC) / cos(eps), cos(RAMC))
  const mcRad = Math.atan2(Math.sin(ramcRad) / Math.cos(oblRad), Math.cos(ramcRad));
  return ((mcRad * 180 / Math.PI) % 360 + 360) % 360;
}

// Placidus house cusps calculation
// The Placidus system divides each quadrant into 3 houses based on semi-arc ratios
// Houses 1, 2, 3 are in the eastern quadrant (Asc to IC)
// Houses 4, 5, 6 are in the northern quadrant (IC to Desc)
// Houses 7, 8, 9 = opposite of 1, 2, 3 (+180)
// Houses 10, 11, 12 = opposite of 4, 5, 6 (+180)
function calcPlacidusCusps(ramc: number, lat: number, eps: number): number[] {
  const oblRad = eps * Math.PI / 180;
  const latRad = lat * Math.PI / 180;

  const asc = calcAscendant(ramc, lat, eps);
  const mc = calcMC(ramc, eps);
  const desc = (asc + 180) % 360;
  const ic = (mc + 180) % 360;

  const cusps = new Array(13).fill(0);
  cusps[1] = asc;
  cusps[4] = ic;
  cusps[7] = desc;
  cusps[10] = mc;

  // Helper: convert ecliptic longitude to right ascension
  function longToRa(lambda: number): number {
    const lamRad = lambda * Math.PI / 180;
    const raRad = Math.atan2(Math.sin(lamRad) * Math.cos(oblRad), Math.cos(lamRad));
    return ((raRad * 180 / Math.PI) % 360 + 360) % 360;
  }

  // Helper: convert right ascension to ecliptic longitude
  function raToLong(ra: number): number {
    const raRad = ra * Math.PI / 180;
    const longRad = Math.atan2(Math.sin(raRad) / Math.cos(oblRad), Math.cos(raRad));
    return ((longRad * 180 / Math.PI) % 360 + 360) % 360;
  }

  // Helper: compute declination from ecliptic longitude
  function declination(lambda: number): number {
    const lamRad = lambda * Math.PI / 180;
    return Math.asin(Math.sin(lamRad) * Math.sin(oblRad)) * 180 / Math.PI;
  }

  // Placidus house cusps:
  // The diurnal semi-arc (DSA) = half the time a point spends above the horizon
  // The nocturnal semi-arc (NSA) = 180° - DSA = half the time below horizon
  //
  // Houses are measured counterclockwise (increasing zodiac/RA):
  // H1 (ASC) = ascendant (given)
  // H2 = point where 1/3 of NOCTURNAL semi-arc completed, from ASC going counterclockwise
  //      RA(H2) = RA(ASC) + (1/3) * NSA
  // H3 = point where 2/3 of NOCTURNAL semi-arc completed
  //      RA(H3) = RA(ASC) + (2/3) * NSA
  // H4 (IC) = MC + 180 (given)
  // H5 = point where 1/3 of NOCTURNAL semi-arc from IC going counterclockwise
  //      RA(H5) = RA(IC) + (1/3) * NSA
  // H6 = point where 2/3 of NOCTURNAL semi-arc from IC
  //      RA(H6) = RA(IC) + (2/3) * NSA
  // H7 (DESC) = ASC + 180 (given)
  // H8 = H2 + 180
  // H9 = H3 + 180
  // H10 (MC) = given
  // H11 = point where 1/3 of DIURNAL semi-arc from MC going counterclockwise
  //       RA(H11) = RAMC + (1/3) * DSA
  // H12 = point where 2/3 of DIURNAL semi-arc from MC
  //       RA(H12) = RAMC + (2/3) * DSA
  //
  // The semi-arc depends on the declination of the cusp itself → iterative solution

  function semiArc(decDeg: number, isNocturnal: boolean): number {
    const decRad = decDeg * Math.PI / 180;
    let cosSA = -Math.tan(latRad) * Math.tan(decRad);
    cosSA = Math.max(-1, Math.min(1, cosSA));
    const dsa = Math.acos(cosSA) * 180 / Math.PI;
    return isNocturnal ? (180 - dsa) : dsa;
  }

  function placidusCuspIterative(
    refRa: number,
    fraction: number,
    isNocturnal: boolean,
    direction: number // +1 or -1
  ): number {
    // Initial guess
    let lambda = raToLong((refRa + direction * fraction * 90 + 360) % 360);

    for (let iter = 0; iter < 20; iter++) {
      const dec = declination(lambda);
      const sa = semiArc(dec, isNocturnal);
      const newRa = (refRa + direction * fraction * sa + 360) % 360;
      lambda = raToLong(newRa);
    }

    return lambda;
  }

  const raAsc = longToRa(asc);
  const raMc = ramc;
  const raIc = (raMc + 180) % 360;

  // Houses below horizon (nocturnal semi-arc), going counterclockwise from ASC
  cusps[2] = placidusCuspIterative(raAsc, 1/3, true, 1);
  cusps[3] = placidusCuspIterative(raAsc, 2/3, true, 1);
  // Houses below horizon, going counterclockwise from IC
  cusps[5] = placidusCuspIterative(raIc, 1/3, true, 1);
  cusps[6] = placidusCuspIterative(raIc, 2/3, true, 1);
  // Houses above horizon (diurnal semi-arc), going counterclockwise from MC
  cusps[11] = placidusCuspIterative(raMc, 1/3, false, 1);
  cusps[12] = placidusCuspIterative(raMc, 2/3, false, 1);

  // Opposite cusps: 7=1+180, 8=2+180, 9=3+180, 10=4+180, 11=5+180, 12=6+180
  cusps[7] = (cusps[1] + 180) % 360;
  cusps[8] = (cusps[2] + 180) % 360;
  cusps[9] = (cusps[3] + 180) % 360;
  cusps[10] = (cusps[4] + 180) % 360;
  cusps[11] = (cusps[5] + 180) % 360;
  cusps[12] = (cusps[6] + 180) % 360;

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

    // Calculate RAMC using Moshier's sidereal time (includes nutation)
    // After getAllPlanets(), the ephemeris internal modules are initialized
    // We access them via the same module cache as getAllPlanets uses
    let ramc = 0;
    let eps = obliquity(toJulianDay(birthDate));
    let usedMoshier = false;

    try {
      // Access the internal Moshier modules through the ephemeris package
      // getAllPlanets already called processor.init() which sets up constant.date
      const constantModule = eval("require")("ephemeris/src/astronomy/moshier/constant");
      const siderealModule = eval("require")("ephemeris/src/astronomy/moshier/sidereal");

      if (constantModule && constantModule.date && siderealModule) {
        const sidSeconds = siderealModule.calc(constantModule.date, constantModule.tlong);
        ramc = (sidSeconds / 240) % 360;
        ramc = ((ramc % 360) + 360) % 360;
        if (constantModule.eps) {
          eps = constantModule.eps * constantModule.RTD;
        }
        usedMoshier = true;
        console.log(`[Placidus] Moshier sidereal used. RAMC=${ramc.toFixed(2)} eps=${eps.toFixed(4)}`);
      } else {
        console.log("[Placidus] Moshier modules found but not initialized (constant.date missing)");
      }
    } catch (e) {
      console.log("[Placidus] Moshier sidereal not available, using simple GMST:", e instanceof Error ? e.message : "unknown");
    }

    if (!usedMoshier) {
      const jd = toJulianDay(birthDate);
      const gmst = greenwichSiderealTimeDegrees(jd);
      ramc = (((gmst + lng) % 360) + 360) % 360;
      eps = obliquity(jd);
    }

    const ascendant = calcAscendant(ramc, lat, eps);
    const cusps = calcPlacidusCusps(ramc, lat, eps);

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