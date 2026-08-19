// Timezone utilities — convert user's local birth time to UTC for ephemeris calculation

// IANA timezone names for common cities
const CITY_TIMEZONES: Record<string, string> = {
  london: "Europe/London",
  paris: "Europe/Paris",
  berlin: "Europe/Berlin",
  amsterdam: "Europe/Amsterdam",
  madrid: "Europe/Madrid",
  rome: "Europe/Rome",
  dublin: "Europe/Dublin",
  stockholm: "Europe/Stockholm",
  oslo: "Europe/Oslo",
  copenhagen: "Europe/Copenhagen",
  helsinki: "Europe/Helsinki",
  newyork: "America/New_York",
  amman: "Asia/Amman",
  dubai: "Asia/Dubai",
  istanbul: "Europe/Istanbul",
};

// Simple lat/lng → timezone estimation based on longitude
// This is approximate — proper timezone boundaries are irregular
function estimateTimezoneFromCoords(lat: number, lng: number): string {
  // Try to match known city coords (within 2 degrees)
  const cityMap: { lat: number; lng: number; tz: string }[] = [
    { lat: 51.5, lng: -0.1, tz: "Europe/London" },
    { lat: 48.8, lng: 2.3, tz: "Europe/Paris" },
    { lat: 52.5, lng: 13.4, tz: "Europe/Berlin" },
    { lat: 52.3, lng: 4.9, tz: "Europe/Amsterdam" },
    { lat: 40.4, lng: -3.7, tz: "Europe/Madrid" },
    { lat: 41.9, lng: 12.5, tz: "Europe/Rome" },
    { lat: 53.3, lng: -6.3, tz: "Europe/Dublin" },
    { lat: 59.3, lng: 18.1, tz: "Europe/Stockholm" },
    { lat: 40.7, lng: -74.0, tz: "America/New_York" },
    { lat: 32.0, lng: 35.9, tz: "Asia/Amman" },
    { lat: 25.2, lng: 55.3, tz: "Asia/Dubai" },
    { lat: 41.0, lng: 29.0, tz: "Europe/Istanbul" },
  ];

  for (const city of cityMap) {
    const latDiff = Math.abs(lat - city.lat);
    const lngDiff = Math.abs(lng - city.lng);
    if (latDiff < 2 && lngDiff < 2) return city.tz;
  }

  // Fallback: estimate from longitude (15° = 1 hour)
  const offsetHours = Math.round(lng / 15);
  const sign = offsetHours >= 0 ? "+" : "";
  return `Etc/GMT${sign}${-offsetHours}`; // Etc/GMT is inverted
}

export function getTimezoneForCity(cityKey: string): string | null {
  return CITY_TIMEZONES[cityKey] || null;
}

export function getTimezoneForCoords(lat: number, lng: number): string {
  return estimateTimezoneFromCoords(lat, lng);
}

/**
 * Convert local birth time to UTC Date for ephemeris calculation.
 * Uses Luxon for proper historical timezone handling.
 */
export async function localToUTC(
  birthDate: string, // "1984-08-06"
  birthTime: string, // "15:00"
  timezone: string   // "Asia/Amman"
): Promise<Date> {
  const { DateTime } = await import("luxon");

  const [year, month, day] = birthDate.split("-").map(Number);
  const [hour, minute] = birthTime.split(":").map(Number);

  const localDT = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: timezone }
  );

  const utcDT = localDT.toUTC();

  return utcDT.toJSDate();
}