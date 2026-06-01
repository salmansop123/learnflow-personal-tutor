import { needsExamStepForTier } from "@/lib/education-legacy";
import type {
  EducationLevel,
  LearningStyle,
  StudentProfile,
  StudyTime,
} from "@/types/profile";

export const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "ur", label: "Urdu" },
  { id: "ar", label: "Arabic" },
  { id: "fr", label: "French" },
  { id: "es", label: "Spanish" },
  { id: "de", label: "German" },
  { id: "zh", label: "Chinese" },
] as const;

export const COUNTRY_OPTIONS = [
  "Pakistan",
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "UAE",
  "Saudi Arabia",
  "Germany",
  "France",
  "Other",
] as const;

export const EDUCATION_OPTIONS: {
  id: EducationLevel;
  label: string;
  description: string;
}[] = [
  { id: "SCHOOL", label: "School", description: "K-12" },
  { id: "COLLEGE", label: "College", description: "Undergraduate" },
  { id: "UNIVERSITY", label: "University", description: "Degree programs" },
  { id: "JOB_TEST", label: "Job / Test prep", description: "Exams & interviews" },
];

export function getEducationDisplayLabel(profile: StudentProfile): string | null {
  if (profile.educationLevelLabel?.trim()) return profile.educationLevelLabel;
  const legacy = EDUCATION_OPTIONS.find((e) => e.id === profile.educationLevel);
  return legacy?.label ?? null;
}

export const UNIVERSITY_OPTIONS = [
  { id: "BACHELORS" as const, label: "Bachelor's", description: "Undergrad" },
  { id: "MASTERS" as const, label: "Master's", description: "Graduate" },
  { id: "PHD" as const, label: "PhD", description: "Doctoral" },
];

export const LEARNING_STYLE_OPTIONS: {
  id: LearningStyle;
  label: string;
  description: string;
}[] = [
  { id: "SHORT_NOTES", label: "Short notes", description: "Bullets & summaries" },
  {
    id: "DETAILED_EXPLANATIONS",
    label: "Detailed",
    description: "Full explanations",
  },
  { id: "VISUAL_LEARNING", label: "Visual", description: "Diagrams & layouts" },
  { id: "QUIZ_BASED", label: "Quiz-based", description: "Socratic Q&A" },
];

export const STUDY_TIME_OPTIONS: { id: StudyTime; label: string }[] = [
  { id: "MORNING", label: "Morning" },
  { id: "AFTERNOON", label: "Afternoon" },
  { id: "EVENING", label: "Evening" },
  { id: "NIGHT", label: "Night" },
];

export const EXAM_OPTIONS = [
  { id: "ECAT", label: "ECAT", description: "Engineering" },
  { id: "MDCAT", label: "MDCAT", description: "Medical" },
  { id: "NTS", label: "NTS", description: "National test" },
  { id: "CSS", label: "CSS", description: "Civil service" },
  { id: "IELTS", label: "IELTS", description: "English" },
  { id: "TOEFL", label: "TOEFL", description: "English" },
  { id: "SAT", label: "SAT", description: "College admission" },
  { id: "GRE", label: "GRE", description: "Graduate" },
  { id: "GATE", label: "GATE", description: "Engineering India" },
  { id: "IIT-JEE", label: "IIT-JEE", description: "Engineering India" },
  { id: "NEET", label: "NEET", description: "Medical India" },
  { id: "Government Job", label: "Gov job", description: "Public sector" },
  {
    id: "Technical Interview",
    label: "Tech interview",
    description: "Coding interviews",
  },
  { id: "Other", label: "Other", description: "Custom test" },
];

export const COMMON_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Economics",
  "Accounting",
  "Statistics",
  "Urdu",
  "Islamiat",
];

export const ONBOARDING_DRAFT_KEY = "learnflow_onboarding_draft";

export function needsExamStep(
  level: EducationLevel | "",
  tier?: string | null
): boolean {
  if (tier && needsExamStepForTier(tier)) return true;
  return level === "UNIVERSITY" || level === "JOB_TEST";
}

export function getOnboardingStepCount(
  level: EducationLevel | "",
  tier?: string | null
): number {
  return needsExamStep(level, tier) ? 5 : 4;
}
