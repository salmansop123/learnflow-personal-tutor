import { z } from "zod";

import { auth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-route";
import { getStripePriceId, getAppUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { getUserProfile, updateUserStripe } from "@/lib/users";

const checkoutSchema = z.object({
  plan: z.enum(["PRO", "PREMIUM_PLUS"]),
  interval: z.enum(["monthly", "yearly"]),
});

export async function POST(req: Request) {
  try {
    if (!isStripeConfigured()) {
      return jsonError("Stripe is not configured", 503);
    }

    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return jsonError("Unauthorized", 401);
    }

    const { plan, interval } = checkoutSchema.parse(await req.json());
    const priceId = getStripePriceId(plan, interval);
    if (!priceId) {
      return jsonError(
        `Stripe price is not configured for ${plan} (${interval})`,
        503
      );
    }

    const profile = await getUserProfile(session.user.id);
    const stripe = getStripe();
    const appUrl = getAppUrl();

    let customerId = profile.stripeCustomerId ?? null;

    if (!customerId) {
      const existing = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      });
      if (existing.data[0]) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: profile.name ?? undefined,
          metadata: { userId: session.user.id },
        });
        customerId = customer.id;
      }

      await updateUserStripe(session.user.id, {
        stripeCustomerId: customerId,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/billing?checkout=success`,
      cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
      metadata: {
        userId: session.user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          plan,
        },
      },
      allow_promotion_codes: true,
    });

    if (!checkoutSession.url) {
      return jsonError("Failed to create checkout session", 500);
    }

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    return handleRouteError(error);
  }
}
