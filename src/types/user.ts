import type { EducationLevel } from "@/types/profile";

export type UserPlan = "FREE" | "PRO" | "PREMIUM_PLUS" | "ENTERPRISE";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: UserPlan;
  language: string;
  educationLevel: EducationLevel | null;
}
