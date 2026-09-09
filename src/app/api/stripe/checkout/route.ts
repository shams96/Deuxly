import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripe = getStripe();
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("POST /api/stripe/checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
