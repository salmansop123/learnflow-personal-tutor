import { getCountryOptions } from "@/lib/country-education";
import { formatEducationArchetype } from "@/lib/education-display";
import {
  LANGUAGE_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  STUDY_TIME_OPTIONS,
  UNIVERSITY_OPTIONS,
} from "@/lib/profile-constants";
import type {
  EducationLevel,
  LearningStyle,
  OnboardingFormData,
  StudentProfile,
  StudyTime,
  UniversityLevel,
} from "@/types/profile";
import { resolveLearningStyles, resolveStudyTimes } from "@/lib/profile-habits";

export const PROFILE_TRACKED_FIELDS = [
  "fullName",
  "language",
  "age",
  "country",
  "educationLevel",
  "educationArchetype",
  "educationTier",
  "educationLevelLabel",
  "educationTrack",
  "educationArchetypeOverride",
  "gradeOrYear",
  "universityLevel",
  "subjectNames",
  "weakSubjects",
  "strongSubjects",
  "dailyStudyHoursGoal",
  "preferredStudyTimes",
  "learningGoals",
  "learningStyles",
  "examType",
  "examPrepDetails",
] as const;

export type ProfileTrackedField = (typeof PROFILE_TRACKED_FIELDS)[number];

export type ProfileValidationResult = {
  valid: boolean;
  fieldResults: Record<string, { valid: boolean; message: string }>;
  summary: string;
};

const FIELD_LABELS: Record<string, string> = {
  fullName: "Full name",
  language: "Language",
  age: "Age",
  country: "Country",
  educationLevel: "Education level",
  educationArchetype: "Education system",
  educationTier: "Education tier",
  educationLevelLabel: "Education level label",
  educationTrack: "Education track",
  educationArchetypeOverride: "Custom education system",
  gradeOrYear: "Grade or year",
  universityLevel: "University level",
  subjectNames: "Subject names",
  weakSubjects: "Weak subjects",
  strongSubjects: "Strong subjects",
  dailyStudyHoursGoal: "Daily study hours goal",
  preferredStudyTimes: "Preferred study times",
  learningGoals: "Learning goals",
  learningStyles: "Learning styles",
  examType: "Exam type",
  examPrepDetails: "Exam preparation details",
};

const FIELD_EXPECTED: Record<string, string> = {
  subjectNames:
    "Real academic subject names (e.g. Mathematics, Physics). Not random text or placeholders.",
  weakSubjects: "Real academic subject names the student finds difficult.",
  strongSubjects: "Real academic subject names the student is strong in.",
  fullName: "A real person's name with at least a first name.",
  age: "A number between 5 and 80.",
  country: "A real country name or country code, or empty.",
  learningGoals: "Free text learning goals; any reasonable content is valid.",
  gradeOrYear: "A grade, year, or semester label (e.g. Grade 10, 2nd Year).",
  educationLevelLabel: "A readable education level name.",
  language: "A real language name or language code.",
  examType: "A real exam, test, or certification name, or a custom description.",
  dailyStudyHoursGoal: "A number between 0.5 and 16 hours.",
  preferredStudyTimes: "One or more of: morning, afternoon, evening, night.",
  learningStyles: "One or more valid learning style preferences.",
  educationArchetype: "A valid education system archetype.",
  educationTier: "A valid education tier.",
  educationLevel: "SCHOOL, COLLEGE, UNIVERSITY, or JOB_TEST.",
  universityLevel: "BACHELORS, MASTERS, or PHD when applicable.",
};

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

export function snapshotProfileForm(
  form: StudentProfile & OnboardingFormData
): Record<string, unknown> {
  return {
    fullName: form.fullName ?? form.name ?? "",
    language: form.language,
    age: form.age ?? null,
    country: form.country ?? null,
    educationLevel: form.educationLevel ?? null,
    educationArchetype: form.educationArchetype ?? null,
    educationTier: form.educationTier ?? null,
    educationLevelLabel: form.educationLevelLabel ?? "",
    educationTrack: form.educationTrack ?? null,
    educationArchetypeOverride: form.educationArchetypeOverride ?? false,
    gradeOrYear: form.gradeOrYear ?? "",
    universityLevel: form.universityLevel ?? null,
    subjectNames: form.subjectNames ?? [],
    weakSubjects: form.weakSubjects ?? [],
    strongSubjects: form.strongSubjects ?? [],
    dailyStudyHoursGoal: form.dailyStudyHoursGoal ?? null,
    preferredStudyTimes: resolveStudyTimes(form),
    learningGoals: form.learningGoals ?? null,
    learningStyles: resolveLearningStyles(form),
    examType: form.examType ?? null,
    examPrepDetails: form.examPrepDetails ?? null,
  };
}

export function computePendingChanges(
  current: Record<string, unknown>,
  original: Record<string, unknown>
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};
  for (const key of PROFILE_TRACKED_FIELDS) {
    const next = current[key];
    const prev = original[key];
    if (!valuesEqual(next, prev)) {
      changes[key] = next;
    }
  }
  return changes;
}

export function formatFieldLabel(field: string): string {
  return (
    FIELD_LABELS[field] ??
    field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())
  );
}

export function buildValidationPrompt(changes: Record<string, unknown>): string {
  const lines = Object.entries(changes).map(([field, value]) => {
    const expected =
      FIELD_EXPECTED[field] ??
      "A sensible value appropriate for this profile field.";
    return `Field: ${formatFieldLabel(field)}
New value: ${JSON.stringify(value)}
Expected: ${expected}`;
  });

  return `You are a profile validation agent for an educational platform. A student is updating their profile. Validate each changed field and check if the new value is appropriate for that field.

Changes to validate:
${lines.join("\n\n")}

Field validation rules:
- subjectNames, weakSubjects, strongSubjects: must be real academic subject names. Values like 'asdf', 'test123', 'hello', random strings, or non-subject words are invalid.
- fullName: must look like a real person's name. Should contain at least a first name. Numbers or special characters are suspicious.
- age: must be a number between 5 and 80. Values outside this range are suspicious.
- country: must be a real country name or be empty.
- learningGoals: free text is acceptable. Any content is valid.
- gradeOrYear: must look like a grade, year, or semester value (e.g. 'Grade 10', '2nd Year', 'Semester 4').
- educationLevelLabel: must look like an education level name.
- preferredLanguage: must be a real language name.
- examType: must be a real exam, test, or certification name, or a custom description.
- dailyStudyHoursGoal: must be a number between 0.5 and 16.
- All other fields: apply common sense validation.

For each field, determine:
1. Is the new value valid for this field? (true/false)
2. If invalid, what is wrong with it? (one sentence)
3. If valid but suspicious (might be a mistake), note it.

Return ONLY valid JSON with no markdown:
{
  "valid": boolean (true only if ALL fields pass validation),
  "fieldResults": {
    "[fieldName]": {
      "valid": boolean,
      "message": string (empty string if valid, explanation if invalid or suspicious)
    }
  },
  "summary": string (one sentence overall summary if there are any issues, empty string if all valid)
}`;
}

export function formatFieldValue(
  field: string,
  value: unknown
): string {
  if (value === null || value === undefined || value === "") {
    return "(empty)";
  }

  if (field === "country" && typeof value === "string") {
    const match = getCountryOptions().find((c) => c.code === value);
    return match ? `${match.emoji} ${match.name}` : value;
  }

  if (field === "language" && typeof value === "string") {
    const lang = LANGUAGE_OPTIONS.find((l) => l.id === value);
    return lang?.label ?? value;
  }

  if (field === "educationArchetype" && typeof value === "string") {
    return formatEducationArchetype(value) ?? value;
  }

  if (field === "learningStyles" && Array.isArray(value)) {
    return value
      .map(
        (id) =>
          LEARNING_STYLE_OPTIONS.find((o) => o.id === id)?.label ?? String(id)
      )
      .join(", ");
  }

  if (field === "preferredStudyTimes" && Array.isArray(value)) {
    return value
      .map(
        (id) => STUDY_TIME_OPTIONS.find((o) => o.id === id)?.label ?? String(id)
      )
      .join(", ");
  }

  if (field === "universityLevel" && typeof value === "string") {
    return (
      UNIVERSITY_OPTIONS.find((o) => o.id === value)?.label ?? value
    );
  }

  if (field === "educationArchetypeOverride" && typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "(empty)";
  }

  return String(value);
}

export function applySnapshotToForm(
  base: StudentProfile,
  snapshot: Record<string, unknown>
): StudentProfile & OnboardingFormData {
  const fullName = String(snapshot.fullName ?? base.fullName ?? base.name ?? "");
  return {
    ...base,
    fullName,
    name: fullName,
    language: String(snapshot.language ?? base.language),
    age: (snapshot.age as number | null | undefined) ?? null,
    country: (snapshot.country as string | null | undefined) ?? null,
    educationLevel:
      (snapshot.educationLevel as EducationLevel | null | undefined) ??
      base.educationLevel,
    educationArchetype: String(
      snapshot.educationArchetype ?? base.educationArchetype ?? "GENERIC"
    ),
    educationTier: String(snapshot.educationTier ?? base.educationTier ?? ""),
    educationLevelLabel: String(
      snapshot.educationLevelLabel ?? base.educationLevelLabel ?? ""
    ),
    educationTrack:
      (snapshot.educationTrack as string | null | undefined) ??
      base.educationTrack,
    educationArchetypeOverride: Boolean(snapshot.educationArchetypeOverride),
    gradeOrYear: String(snapshot.gradeOrYear ?? base.gradeOrYear ?? ""),
    universityLevel:
      (snapshot.universityLevel as UniversityLevel | null | undefined) ??
      base.universityLevel,
    subjectNames: (snapshot.subjectNames as string[]) ?? [],
    weakSubjects: (snapshot.weakSubjects as string[]) ?? [],
    strongSubjects: (snapshot.strongSubjects as string[]) ?? [],
    dailyStudyHoursGoal:
      (snapshot.dailyStudyHoursGoal as number | null | undefined) ?? null,
    preferredStudyTimes:
      (snapshot.preferredStudyTimes as StudyTime[]) ??
      resolveStudyTimes(base),
    learningGoals:
      (snapshot.learningGoals as string | null | undefined) ?? null,
    learningStyles:
      (snapshot.learningStyles as LearningStyle[]) ??
      resolveLearningStyles(base),
    examType: (snapshot.examType as string | null | undefined) ?? null,
    examPrepDetails:
      (snapshot.examPrepDetails as string | null | undefined) ?? null,
    educationLevelId: "",
  } as StudentProfile & OnboardingFormData;
}

export function pendingChangesToPatch(
  changes: Record<string, unknown>
): Record<string, unknown> {
  const patch = { ...changes };
  if (typeof changes.fullName === "string") {
    patch.name = changes.fullName;
  }
  return patch;
}
