import type { ChartData } from "./chart";
import { aspects } from "./aspects";

export type TransitToNatal = {
  transitPlanet: string;
  transitSign: string;
  transitGlyph: string;
  natalPlanet: string;
  natalSign: string;
  natalGlyph: string;
  aspectType: string;
  aspectGlyph: string;
  orb: number;
  exact: boolean;
  description: string;
};

export type TransitReport = {
  date: string;
  transits: TransitToNatal[];
  majorEvents: { planet: string; event: string; description: string }[];
  retrogrades: string[];
  mood: number;
  themes: string[];
};

function calcOrb(t1: number, t2: number, aspectAngle: number): number {
  const diff = Math.abs(t1 - t2);
  const minDiff = Math.min(diff, 360 - diff);
  return Math.abs(minDiff - aspectAngle);
}

function findAspect(t1: number, t2: number): { type: string; glyph: string; orb: number } | null {
  for (const aspect of aspects) {
    const orb = calcOrb(t1, t2, aspect.angle);
    if (orb <= aspect.orb) {
      return { type: aspect.name, glyph: aspect.glyph, orb: Math.round(orb * 100) / 100 };
    }
  }
  return null;
}

const aspectDescriptions: Record<string, (tp: string, np: string) => string> = {
  Conjunction: (tp, np) => `${tp} conjunct your natal ${np} — energies merge and intensify. A focal point of the day.`,
  Sextile: (tp, np) => `${tp} sextile your natal ${np} — a gentle opportunity. Flow and support available with small effort.`,
  Square: (tp, np) => `${tp} square your natal ${np} — tension and challenge. Growth through friction. Stay conscious.`,
  Trine: (tp, np) => `${tp} trine your natal ${np} — natural harmony and ease. Gifts flow without resistance.`,
  Opposition: (tp, np) => `${tp} opposite your natal ${np} — polarity and awareness. Balance opposing forces.`,
};

export async function calculateTransitToNatal(
  natalChart: ChartData,
  date: Date = new Date()
): Promise<TransitReport | null> {
  try {
    const { getAllPlanets } = await import("ephemeris");
    const result = getAllPlanets(date, natalChart.lng, natalChart.lat, 0);

    const planetMap: Record<string, string> = {
      sun: "sun", moon: "moon", mercury: "mercury", venus: "venus",
      mars: "mars", jupiter: "jupiter", saturn: "saturn",
      uranus: "uranus", neptune: "neptune", pluto: "pluto",
    };

    // Get today's transit positions
    const transitPositions: Record<string, { longitude: number; retrograde: boolean }> = {};
    for (const [ephName, ourId] of Object.entries(planetMap)) {
      const observed = result.observed[ephName];
      if (observed && observed.apparentLongitudeDd !== undefined) {
        transitPositions[ourId] = {
          longitude: observed.apparentLongitudeDd,
          retrograde: observed.is_retrograde || false,
        };
      }
    }

    // Calculate aspects between transit planets and natal planets
    const transits: TransitToNatal[] = [];
    const natalPlanets = natalChart.planets;
    const retrogrades: string[] = [];

    for (const [transitId, transitPos] of Object.entries(transitPositions)) {
      if (transitPos.retrograde) {
        const transitPlanet = natalPlanets.find((p) => p.id === transitId);
        if (transitPlanet && !retrogrades.includes(transitPlanet.name)) {
          retrogrades.push(transitPlanet.name);
        }
      }

      for (const natal of natalPlanets) {
        // Skip Ascendant as natal target (it's not a planet)
        if (natal.id === "ascendant") continue;

        const aspect = findAspect(transitPos.longitude, natal.longitude);
        if (aspect) {
          const transitPlanet = natalPlanets.find((p) => p.id === transitId);
          const descFn = aspectDescriptions[aspect.type];
          transits.push({
            transitPlanet: transitPlanet?.name || transitId,
            transitSign: transitPlanet?.signName || "",
            transitGlyph: transitPlanet?.glyph || "?",
            natalPlanet: natal.name,
            natalSign: natal.signName,
            natalGlyph: natal.glyph,
            aspectType: aspect.type,
            aspectGlyph: aspect.glyph,
            orb: aspect.orb,
            exact: aspect.orb < 1.0,
            description: descFn
              ? descFn(transitPlanet?.name || transitId, natal.name)
              : `${transitPlanet?.name} ${aspect.type.toLowerCase()} your natal ${natal.name}`,
          });
        }
      }
    }

    // Sort by orb (most exact first)
    transits.sort((a, b) => a.orb - b.orb);

    // Determine major events
    const majorEvents: { planet: string; event: string; description: string }[] = [];

    for (const [transitId, transitPos] of Object.entries(transitPositions)) {
      const planet = natalChart.planets.find((p) => p.id === transitId);
      if (!planet) continue;

      if (transitPos.retrograde) {
        majorEvents.push({
          planet: planet.name,
          event: "Retrograde",
          description: `${planet.name} is retrograde — review, reflect, and reconsider matters related to ${planet.name.toLowerCase()}.`,
        });
      }
    }

    // Determine mood based on aspect types
    const harmonious = transits.filter((t) => t.aspectType === "Trine" || t.aspectType === "Sextile").length;
    const challenging = transits.filter((t) => t.aspectType === "Square" || t.aspectType === "Opposition").length;
    const mood = harmonious > challenging ? 5 : harmonious === challenging ? 3 : 2;

    // Extract themes
    const themeMap: Record<string, string> = {
      sun: "identity and vitality",
      moon: "emotion and instinct",
      mercury: "communication and thinking",
      venus: "love and values",
      mars: "action and desire",
      jupiter: "growth and opportunity",
      saturn: "discipline and responsibility",
      uranus: "change and awakening",
      neptune: "dreams and intuition",
      pluto: "transformation and power",
    };

    const themePlanets = transits.slice(0, 3).map((t) => t.transitPlanet.toLowerCase());
    const themes = [...new Set(themePlanets.map((p) => themeMap[p]).filter(Boolean))];

    return {
      date: date.toISOString().slice(0, 10),
      transits: transits.slice(0, 12),
      majorEvents,
      retrogrades,
      mood,
      themes,
    };
  } catch (error) {
    console.error("Transit calculation error:", error);
    return null;
  }
}

export async function getTransitPositions(date: Date = new Date(), lng = 0, lat = 0) {
  try {
    const { getAllPlanets } = await import("ephemeris");
    const result = getAllPlanets(date, lng, lat, 0);

    const positions: { id: string; name: string; longitude: number; retrograde: boolean }[] = [];
    const planetNames: Record<string, string> = {
      sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus",
      mars: "Mars", jupiter: "Jupiter", saturn: "Saturn",
      uranus: "Uranus", neptune: "Neptune", pluto: "Pluto",
    };

    for (const [ephName, name] of Object.entries(planetNames)) {
      const observed = result.observed[ephName];
      if (observed && observed.apparentLongitudeDd !== undefined) {
        positions.push({
          id: ephName,
          name,
          longitude: observed.apparentLongitudeDd,
          retrograde: observed.is_retrograde || false,
        });
      }
    }

    return positions;
  } catch {
    return [];
  }
}