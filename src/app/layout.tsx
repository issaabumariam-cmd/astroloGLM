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
    "Discover your natal chart, daily horoscopes, and AI-powered astrological guidance. Premium astrology for the modern seeker.",
  keywords: [
    "astrology",
    "horoscope",
    "natal chart",
    "birth chart",
    "zodiac",
    "compatibility",
    "AI astrologer",
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
    title: "Astrolo — Cosmic Self-Knowledge",
    description:
      "Discover your natal chart, daily horoscopes, and AI-powered astrological guidance.",
    type: "website",
    locale: "en_GB",
    siteName: "Astrolo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astrolo — Cosmic Self-Knowledge",
    description: "Premium astrology: natal charts, horoscopes, and AI-powered guidance.",
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
    "Premium astrology PWA with real natal charts, AI advisor, and horoscopes. Powered by the Moshier ephemeris.",
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
    "AI astrology advisor (RAG-powered)",
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