import type { EducationArchetype } from "@/lib/education-systems";
import type { EducationLevel, UniversityLevel } from "@/types/profile";

const ARCHETYPE_LABELS: Record<EducationArchetype, string> = {
  SOUTH_ASIAN: "South Asian System",
  INDIAN: "Indian System",
  BRITISH: "British / Commonwealth System",
  NORTH_AMERICAN: "North American System",
  EUROPEAN_CONTINENTAL: "European Continental System",
  EAST_ASIAN: "East Asian System",
  GENERIC: "General System",
};

const LEGACY_LEVEL_LABELS: Record<EducationLevel, string> = {
  SCHOOL: "School",
  COLLEGE: "College",
  UNIVERSITY: "University",
  JOB_TEST: "Job / Test prep",
};

const UNIVERSITY_LEVEL_LABELS: Record<UniversityLevel, string> = {
  BACHELORS: "Bachelor's Degree",
  MASTERS: "Master's / MPhil",
  PHD: "PhD",
};

export function formatEducationArchetype(
  archetype: string | null | undefined
): string | null {
  if (!archetype) return null;
  return (
    ARCHETYPE_LABELS[archetype as EducationArchetype] ??
    archetype.replace(/_/g, " ")
  );
}

export function formatLegacyEducationLevel(
  level: EducationLevel | null | undefined
): string | null {
  if (!level) return null;
  return LEGACY_LEVEL_LABELS[level] ?? level;
}

export function formatEducationTrack(
  track: string | null | undefined
): string | null {
  if (track === "academic") return "Academic Track";
  if (track === "vocational") return "Vocational Track";
  return track ?? null;
}

export function formatUniversityLevel(
  level: UniversityLevel | null | undefined
): string | null {
  if (!level) return null;
  return UNIVERSITY_LEVEL_LABELS[level] ?? level;
}
