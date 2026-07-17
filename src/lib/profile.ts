import { ApiRequestError, serverApiFetch } from "@/lib/api-server";
import { resolveLearningStyles } from "@/lib/profile-habits";
import type {
  OnboardingFormData,
  ProfileUpdateInput,
  StudentProfile,
} from "@/types/profile";

export function isStaleUserError(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    error.status === 404 &&
    error.message.toLowerCase().includes("user not found")
  );
}

export async function getProfileOptional(
  userId: string
): Promise<StudentProfile | null> {
  try {
    return await serverApiFetch<StudentProfile>("/profile", userId);
  } catch (error) {
    if (isStaleUserError(error)) return null;
    throw error;
  }
}

export function getProfileCompletionScore(profile: StudentProfile): number {
  const checks: boolean[] = [
    Boolean(profile.fullName || profile.name),
    Boolean(profile.language),
    Boolean(profile.educationLevel || profile.educationTier),
    Boolean(profile.educationLevelLabel || profile.gradeOrYear),
    Boolean(profile.gradeOrYear),
    profile.subjectNames.length > 0,
    resolveLearningStyles(profile).length > 0,
    profile.educationLevel !== "UNIVERSITY" || Boolean(profile.universityLevel),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export async function getProfile(userId: string): Promise<StudentProfile> {
  const profile = await getProfileOptional(userId);
  if (!profile) {
    throw new ApiRequestError("User not found", 404);
  }
  return profile;
}

export async function updateProfile(
  userId: string,
  data: ProfileUpdateInput
): Promise<StudentProfile> {
  return serverApiFetch<StudentProfile>("/profile", userId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

async function clientProfileFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? "Request failed"
    );
  }
  return data;
}

export async function submitOnboarding(
  data: OnboardingFormData
): Promise<StudentProfile> {
  return clientProfileFetch<StudentProfile>("/api/profile/onboarding", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchProfileClient(): Promise<StudentProfile> {
  return clientProfileFetch<StudentProfile>("/api/profile");
}

export async function updateProfileClient(
  data: ProfileUpdateInput
): Promise<StudentProfile> {
  return clientProfileFetch<StudentProfile>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function resetProfileClient(): Promise<StudentProfile> {
  return clientProfileFetch<StudentProfile>("/api/profile/reset", {
    method: "POST",
  });
}
