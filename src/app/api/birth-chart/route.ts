import { NextRequest, NextResponse } from "next/server";
import { calculateNatalChart } from "@/lib/astrology/placidus";
import { getTimezoneForCoords, localToUTC } from "@/lib/astrology/timezone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { birthDate, birthTime, lat, lng, birthPlace, cityKey } = body as {
      birthDate: string;
      birthTime?: string;
      lat?: number;
      lng?: number;
      birthPlace?: string;
      cityKey?: string;
    };

    if (!birthDate) {
      return NextResponse.json({ error: "Birth date is required" }, { status: 400 });
    }

    const timeStr = birthTime || "12:00";

    let latitude = lat;
    let longitude = lng;

    if (latitude === undefined || longitude === undefined) {
      latitude = 51.5074;
      longitude = -0.1278;
    }

    // Convert local birth time to UTC using proper historical timezone rules
    const timezone = getTimezoneForCoords(latitude, longitude);
    const utcDate = await localToUTC(birthDate, timeStr, timezone);
    console.log(`[Birth Chart] Local: ${birthDate} ${timeStr} ${timezone} → UTC: ${utcDate.toISOString()}`);

    const chart = await calculateNatalChart(utcDate, latitude, longitude, birthPlace || "", timeStr);

    if (!chart) {
      return NextResponse.json(
        { error: "Could not calculate chart. Please check your birth details." },
        { status: 500 }
      );
    }

    return NextResponse.json(chart);
  } catch (error) {
    console.error("Birth chart API error:", error);
    return NextResponse.json(
      { error: "Something went wrong calculating your chart." },
      { status: 500 }
    );
  }
}