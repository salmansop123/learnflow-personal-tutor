import { getTierGuidance, type EducationTier } from "@/lib/education-systems";
import { getCountryName, resolveCountryCode } from "@/lib/country-education";
import { resolveLearningStyles, resolveStudyTimes } from "@/lib/profile-habits";
import type { StudentProfile } from "@/types/profile";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ur: "Urdu",
  ar: "Arabic",
  fr: "French",
  es: "Spanish",
  de: "German",
  zh: "Chinese",
};

const LEARNING_STYLE_INSTRUCTIONS: Record<string, string> = {
  SHORT_NOTES:
    "Prefer concise bullet points and short summaries over long paragraphs.",
  DETAILED_EXPLANATIONS:
    "Provide thorough, step-by-step explanations with full context.",
  VISUAL_LEARNING:
    "Describe diagrams, charts, and visual layouts in words; use spatial analogies.",
  QUIZ_BASED:
    "Use Socratic questioning — ask guiding questions before giving answers.",
};

function displayName(profile: StudentProfile): string {
  return profile.fullName ?? profile.name ?? "the student";
}

function buildEducationLine(profile: StudentProfile): string {
  const archetype = profile.educationArchetype ?? "GENERIC";
  const tier = profile.educationTier ?? "UPPER_SECONDARY";
  const label =
    profile.educationLevelLabel ??
    profile.educationLevel ??
    "Secondary School";
  const grade = profile.gradeOrYear ?? "";
  const track = profile.educationTrack ?? "";
  const countryCode = resolveCountryCode(profile.country);
  const countryDisplay = countryCode
    ? getCountryName(countryCode)
    : profile.country ?? "";

  const ARCHETYPE_CONTEXT: Record<string, string> = {
    SOUTH_ASIAN: `Student follows the South Asian education system (${countryDisplay || "South Asia"}). Their Intermediate/College level is a 2-year post-secondary board program (FA/FSc/ICS), NOT a university — do not treat it as undergraduate level.`,
    INDIAN: `Student follows the Indian education system. Board exam oriented. Higher Secondary (11th–12th) is pre-university, not undergraduate.`,
    BRITISH: `Student follows the British curriculum system.${track ? " " + (track === "academic" ? "Academic track." : "Vocational track.") : ""}`,
    NORTH_AMERICAN: `Student follows the North American education system. In this context, College and University both mean a 4-year undergraduate institution.`,
    EUROPEAN_CONTINENTAL:
      track === "academic"
        ? `Student is in the European academic secondary track (Gymnasium/Lycée). This is university-preparatory — treat explanations at near-undergraduate depth.`
        : track === "vocational"
          ? `Student is in the European vocational secondary track (Berufsschule/BTS). Focus on practical, applied explanations relevant to their trade or field.`
          : `Student follows the European continental education system.`,
    EAST_ASIAN: `Student follows the East Asian education system (${countryDisplay || "East Asia"}). Curriculum is exam-driven and rigorous.`,
    GENERIC: `Student follows a general education system.`,
  };

  return [
    `Student education level: ${label}${grade ? ", " + grade : ""}.`,
    ARCHETYPE_CONTEXT[archetype] ?? "",
    `Academic tier: ${tier}.`,
    getTierGuidance(
      (
        [
          "PRIMARY",
          "LOWER_SECONDARY",
          "UPPER_SECONDARY",
          "POST_SECONDARY",
          "VOCATIONAL",
          "UNDERGRADUATE",
          "POSTGRADUATE",
          "DOCTORAL",
        ] as const
      ).includes(tier as EducationTier)
        ? (tier as EducationTier)
        : "UPPER_SECONDARY"
    ),
  ]
    .filter(Boolean)
    .join(" ");
}

function resolveTutorSubjects(
  profile: StudentProfile,
  options?: { subject?: string; subjects?: string[] }
): string {
  if (options?.subjects && options.subjects.length > 0) {
    return options.subjects.join(", ");
  }
  if (options?.subject?.trim()) {
    return options.subject.trim();
  }
  if (profile.subjectNames.length > 0) {
    return profile.subjectNames.join(", ");
  }
  return "general learning";
}

export function buildAISystemPrompt(
  profile: StudentProfile,
  options?: { subject?: string; subjects?: string[] }
): string {
  const name = displayName(profile);
  const lang =
    LANGUAGE_LABELS[profile.language] ?? profile.language ?? "English";
  const educationLine = buildEducationLine(profile);
  const subject = resolveTutorSubjects(profile, options);
  const multiSubject =
    (options?.subjects?.length ?? 0) > 1 ||
    subject.includes(",");
  const weak =
    profile.weakSubjects.length > 0
      ? profile.weakSubjects.join(", ")
      : null;
  const strong =
    profile.strongSubjects.length > 0
      ? profile.strongSubjects.join(", ")
      : null;
  const styles = resolveLearningStyles(profile);
  const style =
    styles.length > 0
      ? styles
          .map((s) => LEARNING_STYLE_INSTRUCTIONS[s])
          .filter(Boolean)
          .join(" ")
      : "Adapt explanations to the student's level.";
  const times = resolveStudyTimes(profile);
  const timeHint =
    times.length > 0
      ? `Preferred study times: ${times.join(", ")}.`
      : "";
  const goals = profile.learningGoals
    ? `Learning goals: ${profile.learningGoals}`
    : "";
  const exam =
    profile.examType || profile.examPrepDetails
      ? `Exam preparation: ${profile.examType ?? "custom"}${profile.examPrepDetails ? ` — ${profile.examPrepDetails}` : ""}`
      : "";
  const hours = profile.dailyStudyHoursGoal
    ? `Daily study goal: ${profile.dailyStudyHoursGoal} hours.`
    : "";

  return `You are LearnFlow, a personalized AI tutor for ${name}.

Student profile:
- ${educationLine}
- Current topic${multiSubject ? "s" : ""}/subject${multiSubject ? "s" : ""}: ${subject}${multiSubject ? ". The student may ask about any of these; answer using the subject that best matches each question." : ""}
- Preferred response language: ${lang} (always respond in ${lang}, even if the student writes in another language)
${weak ? `- Weak subjects (give extra support): ${weak}` : ""}
${strong ? `- Strong subjects: ${strong}` : ""}
${goals}
${exam}
${hours}

Teaching style:
- ${style}
- ${timeHint}

Rules:
- Explain concepts clearly at the student's level
- Use examples, analogies, and step-by-step breakdowns when helpful
- If asked to generate a quiz or assignment, use structured format
- Be encouraging and supportive
- Reference the student's goals and exam prep when relevant`;
}
