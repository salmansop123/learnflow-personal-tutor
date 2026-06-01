"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { updateUserProfile } from "@/lib/users";
import type { EducationLevel } from "@/types/profile";
import type { UserProfile } from "@/types/user";

export async function updateProfileAction(data: {
  name: string;
  language: string;
  educationLevel: EducationLevel | null;
}): Promise<UserProfile> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const profile = await updateUserProfile(session.user.id, {
    name: data.name.trim(),
    language: data.language,
    educationLevel: data.educationLevel || null,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/ai-tutor");
  return profile;
}
