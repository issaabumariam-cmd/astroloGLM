import { NextRequest, NextResponse } from "next/server";

async function getPlanetPosition(planetName: string, date: Date, lng = 0, lat = 0) {
  const { getPlanet } = await import("ephemeris");
  const result = getPlanet(planetName, date, lng, lat, 0);
  const observed = result.observed[planetName];
  if (!observed) return null;
  return {
    name: planetName,
    longitude: observed.apparentLongitudeDd,
    retrograde: observed.is_retrograde || false,
  };
}

function longitudeToSign(longitude: number): { name: string; glyph: string; degrees: number } {
  const signs = [
    { name: "Aries", glyph: "♈", start: 0 },
    { name: "Taurus", glyph: "♉", start: 30 },
    { name: "Gemini", glyph: "♊", start: 60 },
    { name: "Cancer", glyph: "♋", start: 90 },
    { name: "Leo", glyph: "♌", start: 120 },
    { name: "Virgo", glyph: "♍", start: 150 },
    { name: "Libra", glyph: "♎", start: 180 },
    { name: "Scorpio", glyph: "♏", start: 210 },
    { name: "Sagittarius", glyph: "♐", start: 240 },
    { name: "Capricorn", glyph: "♑", start: 270 },
    { name: "Aquarius", glyph: "♒", start: 300 },
    { name: "Pisces", glyph: "♓", start: 330 },
  ];
  const normalized = ((longitude % 360) + 360) % 360;
  for (const sign of signs) {
    if (normalized >= sign.start && normalized < sign.start + 30) {
      return { name: sign.name, glyph: sign.glyph, degrees: Math.floor(normalized - sign.start) };
    }
  }
  return { name: "Pisces", glyph: "♓", degrees: 0 };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const date = dateStr ? new Date(dateStr) : new Date();

    const planetNames = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
    const planets = [];

    for (const name of planetNames) {
      const pos = await getPlanetPosition(name, date);
      if (pos) {
        const sign = longitudeToSign(pos.longitude);
        planets.push({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          id: name,
          sign: sign.name,
          signGlyph: sign.glyph,
          degrees: sign.degrees,
          longitude: Math.round(pos.longitude * 100) / 100,
          retrograde: pos.retrograde,
        });
      }
    }

    const retrogrades = planets.filter((p) => p.retrograde).map((p) => p.name);
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(date);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcoming: { date: string; event: string; description: string }[] = [];

    const moonSign = planets.find((p) => p.id === "moon");
    if (moonSign) {
      upcoming.push({
        date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        event: `Moon in ${moonSign.sign}`,
        description: `Emotional energy flows through ${moonSign.sign}'s qualities. Intuition and instincts are coloured by this sign.`,
      });
    }

    const sunPlanet = planets.find((p) => p.id === "sun");
    if (sunPlanet) {
      upcoming.push({
        date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        event: `Sun in ${sunPlanet.sign}`,
        description: `Vitality and focus align with ${sunPlanet.sign}'s energy. This is the current season of self-expression.`,
      });
    }

    if (retrogrades.length > 0) {
      upcoming.push({
        date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        event: `${retrogrades.join(", ")} Retrograde`,
        description: `${retrogrades.length > 1 ? "Multiple planets are" : `${retrogrades[0]} is`} retrograde. A time for review, reflection, and revisiting past matters related to ${retrogrades.join(" and ")}.`,
      });
    }

    return NextResponse.json({
      date: date.toISOString().slice(0, 10),
      planets,
      retrogrades,
      upcoming,
    });
  } catch (error) {
    console.error("Transits API error:", error);
    return NextResponse.json(
      { error: "Could not calculate transits" },
      { status: 500 }
    );
  }
}