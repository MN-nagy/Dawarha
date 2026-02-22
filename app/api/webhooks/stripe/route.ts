import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db/index";
import { UserProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: any) {
    console.error("❌ Webhook signature verification failed.", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      console.log("🟢 STRIPE EVENT: checkout.session.completed");
      const session = event.data.object as any;

      if (!session?.metadata?.userId) {
        console.error("❌ ERROR: No userId found in Stripe metadata!");
        return new NextResponse("User ID is missing", { status: 400 });
      }

      if (session.subscription) {
        const subscription = (await stripe.subscriptions.retrieve(
          session.subscription as string,
        )) as any;
        const targetUserId = parseInt(session.metadata.userId);

        // 🛡️ BULLETPROOF DATE PARSING 🛡️
        // If Stripe gives us a valid number, use it. Otherwise, default to exactly 30 days from right now.
        let endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        if (
          subscription.current_period_end &&
          !isNaN(subscription.current_period_end)
        ) {
          endDate = new Date(subscription.current_period_end * 1000);
        }

        // Safely extract the Price ID
        const priceId =
          subscription.items?.data?.[0]?.price?.id || "unknown_price_id";

        console.log(
          `➡️ Updating DB. Target End Date: ${endDate.toISOString()}`,
        );

        const updatedRow = await db
          .update(UserProfiles)
          .set({
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: endDate,
          })
          .where(eq(UserProfiles.userId, targetUserId))
          .returning();

        if (updatedRow.length > 0) {
          console.log(
            "✅ DATABASE UPDATED SUCCESSFULLY! User unlocked Pro tier.",
          );
        } else {
          console.error("❌ DATABASE UPDATE FAILED: User not found.");
        }
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as any;

      if (invoice.subscription) {
        const subscription = (await stripe.subscriptions.retrieve(
          invoice.subscription as string,
        )) as any;

        let endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        if (
          subscription.current_period_end &&
          !isNaN(subscription.current_period_end)
        ) {
          endDate = new Date(subscription.current_period_end * 1000);
        }

        const priceId =
          subscription.items?.data?.[0]?.price?.id || "unknown_price_id";

        await db
          .update(UserProfiles)
          .set({
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: endDate,
          })
          .where(eq(UserProfiles.stripeSubscriptionId, subscription.id));
      }
    }
  } catch (error: any) {
    console.error("❌ Database Webhook Error:", error);
    return new NextResponse(`Webhook Database Error: ${error.message}`, {
      status: 500,
    });
  }

  return new NextResponse(null, { status: 200 });
}
