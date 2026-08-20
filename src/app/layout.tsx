import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ConsentBanner } from "@/components/layout/consent-banner";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Astrolo — Cosmic Self-Knowledge",
    template: "%s · Astrolo",
  },
  description:
    "The cosmos, echoed back. Meet Jehana — your astrological guide. Real natal charts, AI-powered horoscopes, and classical wisdom. Not predictions. Reflections of who you already are.",
  keywords: [
    "astrology",
    "horoscope",
    "natal chart",
    "birth chart",
    "zodiac",
    "compatibility",
    "Jehana",
    "AI astrologer",
    "cosmic self-knowledge",
  ],
  authors: [{ name: "Astrolo" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "Astrolo — The Cosmos, Echoed Back",
    description:
      "Meet Jehana. The universe has already written your story — every planet placed the moment you arrived. Jehana reads it and echoes it back.",
    type: "website",
    locale: "en_GB",
    siteName: "Astrolo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astrolo — The Cosmos, Echoed Back",
    description: "The universe wrote your story. Jehana reads it back to you.",
  },
  metadataBase: new URL("https://astrolo.app"),
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Astrolo",
  description:
    "The cosmos, echoed back. Meet Jehana — your astrological guide. Real natal charts, AI-powered horoscopes, and classical wisdom.",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "GBP",
    description: "Free tier with premium upgrade at £5.99/month",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "1200",
  },
  featureList: [
    "Natal chart calculation (Moshier ephemeris)",
    "Jehana — AI astrological guide (RAG-powered)",
    "Daily horoscopes for all 12 zodiac signs",
    "Zodiac sign personality profiles",
    "Compatibility analysis",
    "Transit tracking",
    "Privacy-first (GDPR compliant)",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ConsentBanner />
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}