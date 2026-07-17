import { auth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-route";
import { getAppUrl, getStripe, isStripeConfigured } from "@/lib/stripe";
import { getUserProfile } from "@/lib/users";

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return jsonError("Stripe is not configured", 503);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    const profile = await getUserProfile(session.user.id);
    if (!profile.stripeCustomerId) {
      return jsonError("No billing account found. Subscribe to a paid plan first.", 400);
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${getAppUrl()}/dashboard/billing`,
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    return handleRouteError(error);
  }
}
