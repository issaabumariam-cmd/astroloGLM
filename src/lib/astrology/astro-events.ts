import type { ChartData } from "./chart";

export type AstroEvent = {
  date: string;
  endDate?: string;
  type: "mercury_retrograde" | "planet_retrograde" | "planet_direct" | "new_moon" | "full_moon" | "eclipse" | "ingress" | "lunar_node";
  title: string;
  description: string;
  significance: "high" | "medium" | "low";
  planet?: string;
  glyph?: string;
};

type PlanetPosition = {
  longitude: number;
  retrograde: boolean;
};

async function getPlanetPos(planet: string, date: Date): Promise<PlanetPosition | null> {
  try {
    const { getPlanet } = await import("ephemeris");
    const result = getPlanet(planet, date, 0, 0, 0);
    const observed = result.observed[planet];
    if (!observed || observed.apparentLongitudeDd === undefined) return null;
    return {
      longitude: observed.apparentLongitudeDd,
      retrograde: observed.is_retrograde || false,
    };
  } catch {
    return null;
  }
}

async function getMultiplePlanets(planets: string[], date: Date): Promise<Record<string, PlanetPosition>> {
  const positions: Record<string, PlanetPosition> = {};
  for (const planet of planets) {
    const pos = await getPlanetPos(planet, date);
    if (pos) positions[planet] = pos;
  }
  return positions;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, 360 - diff);
}

const planetGlyphs: Record<string, string> = {
  mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄",
  uranus: "♅", neptune: "♆", pluto: "♇", sun: "☉", moon: "☽",
};

const planetDescriptions: Record<string, string> = {
  mercury: "Communication, travel, technology, and contracts may be disrupted. Double-check details, avoid signing important agreements, and expect delays in correspondence.",
  venus: "Love, relationships, finances, and aesthetics come under review. Past relationships may resurface. Reconsider what (and who) you truly value.",
  mars: "Energy, drive, ambition, and conflict slow down. Direct action feels blocked. Channel frustration into revising plans rather than forcing outcomes.",
  jupiter: "Growth, opportunity, beliefs, and horizons turn inward. A time to reconsider what expansion means to you. Previous opportunities may return for re-evaluation.",
  saturn: "Responsibility, structure, karma, and limitations demand review. Old obligations resurface. A period to reassess commitments and long-term foundations.",
  uranus: "Change, rebellion, innovation, and freedom turn inward. Sudden shifts in how you break free from routine. Revisit what independence means to you.",
  neptune: "Dreams, illusions, spirituality, and creativity blur. Old fantasies resurface. Discern between intuition and wishful thinking. Boundaries may dissolve.",
  pluto: "Power, transformation, control, and the unconscious go deep. Old psychological patterns surface for release. A profound period of inner alchemy.",
};

export async function detectRetrogradeStations(
  planet: string,
  startDate: Date,
  days: number
): Promise<AstroEvent[]> {
  const events: AstroEvent[] = [];
  const stepDays = 1;
  let prevRetro = false;

  for (let i = 0; i <= days; i += stepDays) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const pos = await getPlanetPos(planet, date);

    if (!pos) continue;

    if (i === 0) {
      prevRetro = pos.retrograde;
      if (pos.retrograde) {
        events.push({
          date: date.toISOString().slice(0, 10),
          type: "planet_retrograde",
          title: `${planet.charAt(0).toUpperCase() + planet.slice(1)} Retrograde (ongoing)`,
          description: planetDescriptions[planet] || `${planet} is retrograde — a time for review and reflection.`,
          significance: planet === "mercury" ? "high" : "medium",
          planet,
          glyph: planetGlyphs[planet],
        });
      }
      continue;
    }

    if (pos.retrograde && !prevRetro) {
      events.push({
        date: date.toISOString().slice(0, 10),
        type: planet === "mercury" ? "mercury_retrograde" : "planet_retrograde",
        title: `${planet.charAt(0).toUpperCase() + planet.slice(1)} Stations Retrograde`,
        description: planetDescriptions[planet] || `${planet} begins its retrograde cycle. Turn inward and review matters related to ${planet}.`,
        significance: planet === "mercury" ? "high" : "medium",
        planet,
        glyph: planetGlyphs[planet],
      });
    } else if (!pos.retrograde && prevRetro) {
      events.push({
        date: date.toISOString().slice(0, 10),
        type: "planet_direct",
        title: `${planet.charAt(0).toUpperCase() + planet.slice(1)} Stations Direct`,
        description: `${planet.charAt(0).toUpperCase() + planet.slice(1)} turns direct. The review period ends — forward motion resumes. Implement the insights gained during the retrograde.`,
        significance: planet === "mercury" ? "high" : "medium",
        planet,
        glyph: planetGlyphs[planet],
      });
    }

    prevRetro = pos.retrograde;
  }

  return events;
}

export async function detectMoonPhases(
  startDate: Date,
  days: number
): Promise<AstroEvent[]> {
  const events: AstroEvent[] = [];
  let prevSunMoonAngle = 0;

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(12, 0, 0, 0);

    const sunPos = await getPlanetPos("sun", date);
    const moonPos = await getPlanetPos("moon", date);
    if (!sunPos || !moonPos) continue;

    const angle = angularDistance(sunPos.longitude, moonPos.longitude);
    const prevAngle = prevSunMoonAngle;

    if (i > 0) {
      if (prevAngle > 175 && prevAngle < 185 && angle < 5) {
        events.push({
          date: date.toISOString().slice(0, 10),
          type: "new_moon",
          title: "New Moon",
          description: "A fresh lunar cycle begins. Set intentions, plant seeds, and start new projects. The sky is dark — perfect for inner reflection and envisioning what you want to grow over the next 29 days.",
          significance: "medium",
          glyph: "🌑",
        });
      }

      if (prevAngle < 180 && angle >= 180) {
        events.push({
          date: date.toISOString().slice(0, 10),
          type: "full_moon",
          title: "Full Moon",
          description: "The Moon is fully illuminated — illumination reveals what was hidden. Emotions peak, truths surface, projects reach culmination. A time of clarity and heightened awareness. Release what no longer serves.",
          significance: "medium",
          glyph: "🌕",
        });
      }
    }

    prevSunMoonAngle = angle;
  }

  return events;
}

export async function detectEclipses(
  startDate: Date,
  days: number
): Promise<AstroEvent[]> {
  const events: AstroEvent[] = [];

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(12, 0, 0, 0);

    const sunPos = await getPlanetPos("sun", date);
    const moonPos = await getPlanetPos("moon", date);
    if (!sunPos || !moonPos) continue;

    const sunMoonAngle = angularDistance(sunPos.longitude, moonPos.longitude);

    const isConjunction = sunMoonAngle < 2;
    const isOpposition = Math.abs(sunMoonAngle - 180) < 2;

    if (!isConjunction && !isOpposition) continue;

    let northNode;
    try {
      const { getPlanet } = await import("ephemeris");
      const result = getPlanet("truenode", date, 0, 0, 0);
      northNode = result.observed["truenode"]?.apparentLongitudeDd;
    } catch {
      continue;
    }

    if (northNode === undefined) continue;

    const sunNodeAngle = angularDistance(sunPos.longitude, northNode);
    const moonNodeAngle = angularDistance(moonPos.longitude, northNode);

    if (sunNodeAngle < 12 || moonNodeAngle < 12) {
      const isSolar = isConjunction;
      const partial = sunNodeAngle > 5 || moonNodeAngle > 5;

      events.push({
        date: date.toISOString().slice(0, 10),
        type: "eclipse",
        title: `${partial ? "Partial" : "Total"} ${isSolar ? "Solar" : "Lunar"} Eclipse`,
        description: isSolar
          ? `${partial ? "Partial" : "Total"} solar eclipse — the Moon blocks the Sun's light. A powerful portal for new beginnings. Eclipse energy is intense and fated — avoid major decisions on eclipse day, but pay close attention to what arises in the following days.`
          : `${partial ? "Partial" : "Total"} lunar eclipse — the Earth's shadow falls across the Moon. Emotions run high, relationships reach turning points, and what was hidden comes to light. A time of release and revelation.`,
        significance: "high",
        glyph: isSolar ? "🌑" : "🌕",
      });
    }
  }

  return events;
}

export async function detectIngresses(
  planet: string,
  startDate: Date,
  days: number
): Promise<AstroEvent[]> {
  const events: AstroEvent[] = [];
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];

  let prevSign = 0;

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const pos = await getPlanetPos(planet, date);
    if (!pos) continue;

    const currentSign = Math.floor(normalizeAngle(pos.longitude) / 30);

    if (i > 0 && currentSign !== prevSign) {
      events.push({
        date: date.toISOString().slice(0, 10),
        type: "ingress",
        title: `${planet.charAt(0).toUpperCase() + planet.slice(1)} enters ${signs[currentSign]}`,
        description: `${planet.charAt(0).toUpperCase() + planet.slice(1)} moves into ${signs[currentSign]}, shifting collective energy. The themes ruled by ${planet} are now coloured by ${signs[currentSign]}'s qualities.`,
        significance: planet === "saturn" || planet === "jupiter" ? "medium" : "low",
        planet,
        glyph: planetGlyphs[planet],
      });
    }

    prevSign = currentSign;
  }

  return events;
}

export type TransitCalendar = {
  generatedAt: string;
  rangeStart: string;
  rangeEnd: string;
  events: AstroEvent[];
  retrogrades: { planet: string; start: string; end: string | null; glyph: string; description: string }[];
  moonPhases: { date: string; phase: string; glyph: string }[];
};

export async function generateTransitCalendar(
  startDate: Date = new Date(),
  days: number = 90
): Promise<TransitCalendar> {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  const allEvents: AstroEvent[] = [];

  const retrogradePlanets = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

  for (const planet of retrogradePlanets) {
    const events = await detectRetrogradeStations(planet, startDate, days);
    allEvents.push(...events);
  }

  const moonPhases = await detectMoonPhases(startDate, days);
  allEvents.push(...moonPhases);

  const eclipses = await detectEclipses(startDate, days);
  allEvents.push(...eclipses);

  const majorIngressPlanets = ["jupiter", "saturn"];
  for (const planet of majorIngressPlanets) {
    const events = await detectIngresses(planet, startDate, days);
    allEvents.push(...events);
  }

  allEvents.sort((a, b) => a.date.localeCompare(b.date));

  const retrogrades = allEvents
    .filter((e) => e.type === "planet_retrograde" || e.type === "mercury_retrograde")
    .map((e) => ({
      planet: e.planet || "",
      start: e.date,
      end: null as string | null,
      glyph: e.glyph || "",
      description: e.description,
    }));

  for (const retro of retrogrades) {
    const directEvent = allEvents.find(
      (e) => e.type === "planet_direct" && e.planet === retro.planet && e.date > retro.start
    );
    if (directEvent) retro.end = directEvent.date;
  }

  const moonPhaseList = allEvents
    .filter((e) => e.type === "new_moon" || e.type === "full_moon")
    .map((e) => ({
      date: e.date,
      phase: e.title,
      glyph: e.glyph || "",
    }));

  return {
    generatedAt: new Date().toISOString(),
    rangeStart: startDate.toISOString().slice(0, 10),
    rangeEnd: endDate.toISOString().slice(0, 10),
    events: allEvents,
    retrogrades,
    moonPhases: moonPhaseList,
  };
}

export async function generatePersonalTransitCalendar(
  natalChart: ChartData,
  startDate: Date = new Date(),
  days: number = 30
): Promise<TransitCalendar & { personalTransits: { date: string; transit: string; natal: string; aspect: string; description: string }[] }> {
  const base = await generateTransitCalendar(startDate, days);

  const personalTransits: { date: string; transit: string; natal: string; aspect: string; description: string }[] = [];

  const transitPlanets = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const positions = await getMultiplePlanets(transitPlanets, date);

    for (const [transitId, transitPos] of Object.entries(positions)) {
      for (const natal of natalChart.planets) {
        if (natal.id === "ascendant") continue;

        const natalLng = natal.longitude;
        if (natalLng === undefined) continue;

        const angle = angularDistance(transitPos.longitude, natalLng);
        const aspects = [
          { name: "conjunction", angle: 0 },
          { name: "opposition", angle: 180 },
          { name: "square", angle: 90 },
          { name: "trine", angle: 120 },
          { name: "sextile", angle: 60 },
        ];

        for (const aspect of aspects) {
          if (Math.abs(angle - aspect.angle) < 1) {
            personalTransits.push({
              date: date.toISOString().slice(0, 10),
              transit: transitId.charAt(0).toUpperCase() + transitId.slice(1),
              natal: natal.name,
              aspect: aspect.name,
              description: `${transitId.charAt(0).toUpperCase() + transitId.slice(1)} ${aspect.name} your natal ${natal.name} — exact aspect today.`,
            });
          }
        }
      }
    }
  }

  return { ...base, personalTransits };
}