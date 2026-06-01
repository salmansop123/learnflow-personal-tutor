export type EducationLevel = "SCHOOL" | "COLLEGE" | "UNIVERSITY" | "JOB_TEST";

export type UniversityLevel = "BACHELORS" | "MASTERS" | "PHD";

export type EducationTier =
  | "PRIMARY"
  | "LOWER_SECONDARY"
  | "UPPER_SECONDARY"
  | "POST_SECONDARY"
  | "VOCATIONAL"
  | "UNDERGRADUATE"
  | "POSTGRADUATE"
  | "DOCTORAL";

export type EducationArchetype =
  | "SOUTH_ASIAN"
  | "INDIAN"
  | "BRITISH"
  | "NORTH_AMERICAN"
  | "EUROPEAN_CONTINENTAL"
  | "EAST_ASIAN"
  | "GENERIC";

export type LearningStyle =
  | "SHORT_NOTES"
  | "DETAILED_EXPLANATIONS"
  | "VISUAL_LEARNING"
  | "QUIZ_BASED";

export type StudyTime = "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";

export type UserPlan = "FREE" | "PRO" | "PREMIUM_PLUS" | "ENTERPRISE";

export interface StudentProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: UserPlan;
  language: string;
  onboardingComplete: boolean;
  fullName: string | null;
  age: number | null;
  country: string | null;
  educationLevel: EducationLevel | null;
  educationArchetype: string | null;
  educationTier: string | null;
  educationLevelLabel: string | null;
  educationTrack: string | null;
  educationArchetypeOverride: boolean;
  gradeOrYear: string | null;
  universityLevel: UniversityLevel | null;
  totalSubjects: number | null;
  subjectNames: string[];
  weakSubjects: string[];
  strongSubjects: string[];
  dailyStudyHoursGoal: number | null;
  preferredStudyTime: StudyTime | null;
  preferredStudyTimes: StudyTime[];
  learningGoals: string | null;
  learningStyle: LearningStyle | null;
  learningStyles: LearningStyle[];
  examType: string | null;
  examPrepDetails: string | null;
  profileCompletedAt: string | null;
}

export interface OnboardingFormData {
  fullName: string;
  language: string;
  age?: number | null;
  country?: string | null;
  educationLevel: EducationLevel;
  educationArchetype: string;
  educationTier: string;
  educationLevelLabel: string;
  educationTrack?: string | null;
  educationArchetypeOverride: boolean;
  /** Selected level id from education-systems */
  educationLevelId?: string;
  gradeOrYear: string;
  universityLevel?: UniversityLevel | null;
  subjectNames: string[];
  weakSubjects: string[];
  strongSubjects: string[];
  dailyStudyHoursGoal?: number | null;
  preferredStudyTime?: StudyTime | null;
  preferredStudyTimes?: StudyTime[];
  learningGoals?: string | null;
  learningStyle?: LearningStyle;
  learningStyles: LearningStyle[];
  examType?: string | null;
  examPrepDetails?: string | null;
}

export interface ProfileUpdateInput {
  name?: string;
  language?: string;
  fullName?: string | null;
  age?: number | null;
  country?: string | null;
  educationLevel?: EducationLevel | null;
  educationArchetype?: string | null;
  educationTier?: string | null;
  educationLevelLabel?: string | null;
  educationTrack?: string | null;
  educationArchetypeOverride?: boolean;
  educationLevelId?: string;
  gradeOrYear?: string | null;
  universityLevel?: UniversityLevel | null;
  totalSubjects?: number | null;
  subjectNames?: string[];
  weakSubjects?: string[];
  strongSubjects?: string[];
  dailyStudyHoursGoal?: number | null;
  preferredStudyTime?: StudyTime | null;
  preferredStudyTimes?: StudyTime[];
  learningGoals?: string | null;
  learningStyle?: LearningStyle | null;
  learningStyles?: LearningStyle[];
  examType?: string | null;
  examPrepDetails?: string | null;
  onboardingComplete?: boolean;
}
