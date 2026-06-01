import { serverApiFetch } from "@/lib/api-server";
import { getProfile } from "@/lib/profile";
import type { EducationLevel } from "@/types/profile";
import type { UserProfile } from "@/types/user";

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const p = await getProfile(userId);
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    image: p.image,
    plan: p.plan,
    language: p.language,
    educationLevel: p.educationLevel,
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
