import Stripe from "stripe";

import type { BillingInterval } from "@/lib/pricing";
import type { UserPlan } from "@/types/user";

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET
  );
}

export function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secret, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return stripeClient;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}

const PRICE_ENV_KEYS: Record<
  UserPlan,
  Record<BillingInterval, string | undefined>
> = {
  FREE: { monthly: undefined, yearly: undefined },
  PRO: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  PREMIUM_PLUS: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_PLUS_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_PLUS_YEARLY,
  },
  ENTERPRISE: { monthly: undefined, yearly: undefined },
};

export function getStripePriceId(
  plan: UserPlan,
  interval: BillingInterval
): string | null {
  if (plan === "FREE" || plan === "ENTERPRISE") return null;
  return PRICE_ENV_KEYS[plan][interval] ?? null;
}

export function planFromStripePriceId(priceId: string): UserPlan | null {
  const entries: [UserPlan, BillingInterval][] = [
    ["PRO", "monthly"],
    ["PRO", "yearly"],
    ["PREMIUM_PLUS", "monthly"],
    ["PREMIUM_PLUS", "yearly"],
  ];

  for (const [plan, interval] of entries) {
    const envPrice = getStripePriceId(plan, interval);
    if (envPrice && envPrice === priceId) return plan;
  }
  return null;
}

export function isPaidPlan(plan: UserPlan): boolean {
  return plan === "PRO" || plan === "PREMIUM_PLUS";
}
