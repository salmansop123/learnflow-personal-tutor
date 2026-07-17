import Stripe from "stripe";

import { planFromStripePriceId } from "@/lib/stripe";
import { syncStripeCustomerPlan, updateUserStripe } from "@/lib/users";
import type { UserPlan } from "@/types/user";

async function resolvePlanFromSubscription(
  subscription: Stripe.Subscription
): Promise<UserPlan | null> {
  const metadataPlan = subscription.metadata?.plan?.toUpperCase() as
    | UserPlan
    | undefined;
  if (
    metadataPlan === "PRO" ||
    metadataPlan === "PREMIUM_PLUS" ||
    metadataPlan === "ENTERPRISE"
  ) {
    return metadataPlan;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;
  return planFromStripePriceId(priceId);
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  customerId: string
) {
  const userId = subscription.metadata?.userId;
  const plan = await resolvePlanFromSubscription(subscription);
  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  if (userId && plan && isActive) {
    await updateUserStripe(userId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan,
    });
    return;
  }

  if (!isActive) {
    await syncStripeCustomerPlan(customerId, {
      stripeSubscriptionId: null,
      plan: "FREE",
    });
    return;
  }

  if (plan) {
    await syncStripeCustomerPlan(customerId, {
      stripeSubscriptionId: subscription.id,
      plan,
    });
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return new Response("Stripe is not configured", { status: 503 });
  }

  const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const userId = checkoutSession.metadata?.userId;
        const plan = checkoutSession.metadata?.plan?.toUpperCase() as
          | UserPlan
          | undefined;
        const customerId =
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : checkoutSession.customer?.id;
        const subscriptionId =
          typeof checkoutSession.subscription === "string"
            ? checkoutSession.subscription
            : checkoutSession.subscription?.id;

        if (userId && customerId) {
          await updateUserStripe(userId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId ?? null,
            plan:
              plan === "PRO" || plan === "PREMIUM_PLUS" ? plan : undefined,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await syncSubscription(subscription, customerId);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;
        await syncStripeCustomerPlan(customerId, {
          stripeSubscriptionId: null,
          plan: "FREE",
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook]", event.type, err);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
