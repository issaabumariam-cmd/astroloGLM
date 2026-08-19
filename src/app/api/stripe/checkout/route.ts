import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";

const PRICE_MAP: Record<string, string> = {
  "monthly-uk": process.env.STRIPE_PRICE_MONTHLY_UK || "",
  "yearly-uk": process.env.STRIPE_PRICE_YEARLY_UK || "",
  "monthly-eu": process.env.STRIPE_PRICE_MONTHLY_EU || "",
  "yearly-eu": process.env.STRIPE_PRICE_YEARLY_EU || "",
  "monthly-gulf": process.env.STRIPE_PRICE_MONTHLY_GULF || "",
  "yearly-gulf": process.env.STRIPE_PRICE_YEARLY_GULF || "",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, country } = body as { plan: string; country?: string };

    const country_code = (country || "GB").toUpperCase();
    const region = ["GB", "IE", "SE", "NO", "DK", "FI"].includes(country_code)
      ? "uk"
      : ["DE", "FR", "NL", "BE", "AT", "CH", "ES", "IT", "PT", "GR"].includes(country_code)
      ? "eu"
      : "gulf";

    const priceKey = `${plan}-${region}`;
    const priceId = PRICE_MAP[priceKey];

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan or pricing not configured for your region" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/account?status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pricing?status=cancelled`,
      automatic_tax: { enabled: true },
      customer_email: body.email,
      metadata: { country: country_code },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Could not create checkout session" },
      { status: 500 }
    );
  }
}