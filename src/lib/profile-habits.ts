import type { LearningStyle, StudyTime } from "@/types/profile";

type ProfileHabitsSource = {
  learningStyles?: LearningStyle[];
  learningStyle?: LearningStyle | null;
  preferredStudyTimes?: StudyTime[];
  preferredStudyTime?: StudyTime | null;
};

export function resolveLearningStyles(
  profile: ProfileHabitsSource
): LearningStyle[] {
  if (profile.learningStyles?.length) {
    return profile.learningStyles;
  }
  if (profile.learningStyle) {
    return [profile.learningStyle];
  }
  return [];
}

export function resolveStudyTimes(profile: ProfileHabitsSource): StudyTime[] {
  if (profile.preferredStudyTimes?.length) {
    return profile.preferredStudyTimes;
  }
  if (profile.preferredStudyTime) {
    return [profile.preferredStudyTime];
  }
  return [];
}
