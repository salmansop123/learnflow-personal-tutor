import type { EducationTier } from "@/lib/education-systems";
import type { EducationLevel, UniversityLevel } from "@/types/profile";

/** Map tier to legacy EducationLevel enum for existing code paths */
export function legacyEducationLevelFromTier(
  tier: EducationTier
): EducationLevel {
  switch (tier) {
    case "UNDERGRADUATE":
    case "POSTGRADUATE":
    case "DOCTORAL":
      return "UNIVERSITY";
    case "VOCATIONAL":
    case "POST_SECONDARY":
      return "COLLEGE";
    case "PRIMARY":
    case "LOWER_SECONDARY":
    case "UPPER_SECONDARY":
    default:
      return "SCHOOL";
  }
}

export function universityLevelFromTier(
  tier: EducationTier
): UniversityLevel | null {
  switch (tier) {
    case "UNDERGRADUATE":
      return "BACHELORS";
    case "POSTGRADUATE":
      return "MASTERS";
    case "DOCTORAL":
      return "PHD";
    default:
      return null;
  }
}

export function needsExamStepForTier(tier: EducationTier | string | null): boolean {
  if (!tier) return false;
  return (
    tier === "UNDERGRADUATE" ||
    tier === "POSTGRADUATE" ||
    tier === "DOCTORAL"
  );
}
