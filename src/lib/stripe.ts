import Stripe from "stripe";

export function getStripe() {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(apiKey, {
    apiVersion: "2026-07-29.dahlia",
  });
}

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY ?? "",
    name: "Monthly",
  },
  yearly: {
    priceId: process.env.STRIPE_PRICE_ID_YEARLY ?? "",
    name: "Yearly",
  },
} as const;
