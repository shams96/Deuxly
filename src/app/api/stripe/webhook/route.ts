import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as unknown as {
          metadata?: { userId?: string };
          customer?: string;
          subscription?: string;
        };
        const userId = session.metadata?.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (userId && customerId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId ?? undefined,
              subscriptionStatus: "premium",
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as {
          customer: string;
        };
        const customerId = subscription.customer;

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: "free",
            stripeSubscriptionId: null,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as unknown as {
          customer: string;
          status: string;
          id: string;
        };
        const customerId = subscription.customer;
        const status = subscription.status;

        let subscriptionStatus = "free";
        if (status === "active" || status === "trialing") {
          subscriptionStatus = "premium";
        }

        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus,
            stripeSubscriptionId: subscription.id,
          },
        });
        break;
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("POST /api/stripe/webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
