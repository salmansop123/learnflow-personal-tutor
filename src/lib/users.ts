import { serverApiFetch } from "@/lib/api-server";
import type { EducationLevel } from "@/types/profile";
import type { UserProfile } from "@/types/user";

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await serverApiFetch<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    plan: UserProfile["plan"];
    language: string;
    educationLevel: EducationLevel | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }>("/users/me", userId);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    plan: user.plan,
    language: user.language,
    educationLevel: user.educationLevel,
    stripeCustomerId: user.stripeCustomerId ?? null,
    stripeSubscriptionId: user.stripeSubscriptionId ?? null,
  };
}

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    language?: string;
    educationLevel?: EducationLevel | null;
  }
): Promise<UserProfile> {
  return serverApiFetch<UserProfile>("/users/me", userId, {
    method: "PATCH",
    body: JSON.stringify({
      name: data.name,
      language: data.language,
      educationLevel: data.educationLevel,
    }),
  });
}

export async function updateUserPlan(
  userId: string,
  plan: string
): Promise<UserProfile> {
  return serverApiFetch<UserProfile>("/users/me/plan", userId, {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
}

export async function updateUserStripe(
  userId: string,
  data: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    plan?: string;
  }
): Promise<UserProfile> {
  return serverApiFetch<UserProfile>("/users/me/stripe", userId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function syncStripeCustomerPlan(
  customerId: string,
  data: {
    stripeSubscriptionId?: string | null;
    plan?: string;
  }
): Promise<UserProfile> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/users/stripe/customer/${encodeURIComponent(customerId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Stripe sync failed (${res.status})`);
  }

  return res.json() as Promise<UserProfile>;
}
