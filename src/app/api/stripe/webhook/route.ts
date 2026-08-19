import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const customerId = session.customer as string;
        const customerEmail = session.customer_email || session.customer_details?.email;
        const subscriptionId = session.subscription as string;

        if (customerEmail) {
          const { data: existing } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .single();

          if (existing) {
            await supabaseAdmin.from("subscriptions").upsert({
              user_id: existing.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan: "premium",
              status: "active",
            });

            await supabaseAdmin
              .from("profiles")
              .update({ subscription_status: "premium" })
              .eq("id", existing.id);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const status = subscription.status;
        const currentPeriodEnd = new Date(
          (subscription as unknown as { current_period_end: number }).current_period_end * 1000
        ).toISOString();

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status,
            current_period_end: currentPeriodEnd,
            plan: subscription.items.data[0]?.price?.recurring?.interval === "year" ? "yearly" : "monthly",
          })
          .eq("stripe_subscription_id", subscription.id);

        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_status: status === "active" || status === "trialing" ? "premium" : "free",
              subscription_ends_at: currentPeriodEnd,
            })
            .eq("id", sub.user_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);

        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "free" })
            .eq("id", sub.user_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}