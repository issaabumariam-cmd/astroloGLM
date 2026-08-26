import { NextRequest, NextResponse } from "next/server";
import { generateTransitCalendar } from "@/lib/astrology/astro-events";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get("days");
    const dateParam = searchParams.get("date");

    const days = Math.min(parseInt(daysParam || "90", 10), 180);
    const startDate = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const calendar = await generateTransitCalendar(startDate, days);

    return NextResponse.json(calendar, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Transit calendar API error:", error);
    return NextResponse.json(
      { error: "Could not generate transit calendar" },
      { status: 500 }
    );
  }
}