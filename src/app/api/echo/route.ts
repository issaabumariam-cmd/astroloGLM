import { NextRequest, NextResponse } from "next/server";
import { calculateNatalChart } from "@/lib/astrology/placidus";
import { getTimezoneForCoords, localToUTC } from "@/lib/astrology/timezone";
import { generateJehanaIntro, generateHookResponse, type HookQuestion } from "@/lib/astrology/echo";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, birthDate, birthTime, lat, lng, birthPlace, hookQuestion, userAnswer } = body;

    if (action === "intro") {
      // Calculate natal chart from birth date
      if (!birthDate) {
        return NextResponse.json({ error: "Birth date required" }, { status: 400 });
      }

      const timeStr = birthTime || "12:00";
      const latitude = lat || 51.5074;
      const longitude = lng || -0.1278;
      const birthDateOnly = !birthTime;

      const timezone = getTimezoneForCoords(latitude, longitude);
      const utcDate = await localToUTC(birthDate, timeStr, timezone);
      const chart = await calculateNatalChart(utcDate, latitude, longitude, birthPlace || "", timeStr);

      if (!chart) {
        return NextResponse.json({ error: "Could not calculate chart" }, { status: 500 });
      }

      const intro = await generateJehanaIntro(chart, birthDateOnly);

      if (!intro) {
        return NextResponse.json({ error: "Jehana could not generate an introduction" }, { status: 500 });
      }

      return NextResponse.json({
        chart: {
          sun: { sign: chart.sun.signName, degrees: Math.floor(chart.sun.degreesInSign), glyph: chart.sun.signGlyph },
          moon: { sign: chart.moon.signName, degrees: Math.floor(chart.moon.degreesInSign), glyph: chart.moon.signGlyph },
          rising: { sign: chart.rising.signName, degrees: Math.floor(chart.rising.degreesInSign), glyph: chart.rising.signGlyph },
          birthDateOnly,
        },
        intro,
      });
    }

    if (action === "hook-response") {
      // Recalculate chart (in production, cache this)
      if (!birthDate) {
        return NextResponse.json({ error: "Birth date required" }, { status: 400 });
      }

      const timeStr = birthTime || "12:00";
      const latitude = lat || 51.5074;
      const longitude = lng || -0.1278;

      const timezone = getTimezoneForCoords(latitude, longitude);
      const utcDate = await localToUTC(birthDate, timeStr, timezone);
      const chart = await calculateNatalChart(utcDate, latitude, longitude, "", timeStr);

      if (!chart) {
        return NextResponse.json({ error: "Could not calculate chart" }, { status: 500 });
      }

      const hookQ: HookQuestion = {
        id: hookQuestion.id,
        question: hookQuestion.question,
        chartBasis: hookQuestion.chartBasis,
        bookContext: "",
        responseHint: hookQuestion.responseHint,
      };

      const response = await generateHookResponse(chart, hookQ, userAnswer);

      if (!response) {
        return NextResponse.json({ error: "Jehana could not respond" }, { status: 500 });
      }

      return NextResponse.json({ response });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Jehana API error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}