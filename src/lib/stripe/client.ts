import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const validKey = stripeKey && stripeKey !== "your-stripe-secret-key" ? stripeKey : "sk_test_placeholder";

if (!stripeKey || stripeKey === "your-stripe-secret-key") {
  console.warn("Stripe secret key not configured. Payment features will not work until credentials are set.");
}

export const stripe = new Stripe(validKey, {
  apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion,
  typescript: true,
});