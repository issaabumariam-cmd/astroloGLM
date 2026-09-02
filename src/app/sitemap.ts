import type { MetadataRoute } from "next";
import { zodiacSigns } from "@/lib/astrology/signs";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://astrolo.app";
  const today = new Date().toISOString().split("T")[0];

  const staticPages = [
    "",
    "/today",
    "/horoscope",
    "/personal",
    "/signs",
    "/compatibility",
    "/birth-chart",
    "/jehana",
    "/transits",
    "/book",
    "/pricing",
    "/about",
    "/privacy",
    "/terms",
    "/auth/login",
    "/auth/signup",
    "/account",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: today,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1.0 : path === "/today" ? 0.95 : path === "/horoscope" ? 0.9 : 0.7,
  }));

  const signEntries: MetadataRoute.Sitemap = zodiacSigns.flatMap((sign) => [
    {
      url: `${baseUrl}/horoscope/${sign.id}`,
      lastModified: today,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signs/${sign.id}`,
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ]);

  const bookEntries: MetadataRoute.Sitemap = Array.from({ length: 10 }, (_, i) => ({
    url: `${baseUrl}/book/${i + 1}`,
    lastModified: today,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  return [...staticEntries, ...signEntries, ...bookEntries];
}