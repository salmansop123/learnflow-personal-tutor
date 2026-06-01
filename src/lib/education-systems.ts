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

export interface EducationLevelOption {
  id: string;
  displayLabel: string;
  tier: EducationTier;
  track?: "academic" | "vocational";
  gradeInputLabel: string;
  gradeExamples: string;
  requiresTrackSelection?: boolean;
}

export interface EducationSystem {
  archetype: EducationArchetype;
  displayName: string;
  description: string;
  levels: EducationLevelOption[];
}

function level(
  id: string,
  displayLabel: string,
  tier: EducationTier,
  gradeExamples: string,
  opts?: Partial<
    Pick<
      EducationLevelOption,
      "gradeInputLabel" | "track" | "requiresTrackSelection"
    >
  >
): EducationLevelOption {
  return {
    id,
    displayLabel,
    tier,
    gradeInputLabel: opts?.gradeInputLabel ?? "Which class or year are you in?",
    gradeExamples,
    track: opts?.track,
    requiresTrackSelection: opts?.requiresTrackSelection,
  };
}

export const EDUCATION_SYSTEMS: Record<EducationArchetype, EducationSystem> = {
  SOUTH_ASIAN: {
    archetype: "SOUTH_ASIAN",
    displayName: "South Asian",
    description: "Pakistan, Bangladesh, Sri Lanka, Nepal",
    levels: [
      level("sa-primary", "Primary School", "PRIMARY", "Class 1 – Class 5", {
        gradeInputLabel: "Which class are you in?",
      }),
      level("sa-middle", "Middle School", "LOWER_SECONDARY", "Class 6 – Class 8"),
      level(
        "sa-secondary",
        "Secondary School (Matric / SSC)",
        "UPPER_SECONDARY",
        "Class 9, Class 10"
      ),
      level(
        "sa-intermediate",
        "Intermediate / College (FA / FSc / ICS / ICom)",
        "POST_SECONDARY",
        "1st Year, 2nd Year",
        { gradeInputLabel: "Which year are you in?" }
      ),
      level(
        "sa-vocational",
        "Technical / Vocational (DAE / Diploma)",
        "VOCATIONAL",
        "1st Year, 2nd Year, 3rd Year"
      ),
      level(
        "sa-undergrad",
        "Bachelor's Degree",
        "UNDERGRADUATE",
        "1st Year, Semester 1–8",
        { gradeInputLabel: "Which year or semester?" }
      ),
      level("sa-masters", "Master's / MPhil", "POSTGRADUATE", "Semester 1–4"),
      level("sa-phd", "PhD", "DOCTORAL", "1st Year – 5th Year"),
    ],
  },
  INDIAN: {
    archetype: "INDIAN",
    displayName: "Indian",
    description: "India",
    levels: [
      level("in-primary", "Primary School", "PRIMARY", "Class 1–5"),
      level("in-middle", "Middle School", "LOWER_SECONDARY", "Class 6–8"),
      level("in-secondary", "Secondary (10th Board)", "UPPER_SECONDARY", "Class 9, Class 10"),
      level(
        "in-higher-sec",
        "Higher Secondary / Junior College (11th–12th)",
        "POST_SECONDARY",
        "Class 11, Class 12 — Science / Commerce / Arts"
      ),
      level("in-iti", "ITI / Diploma / Polytechnic", "VOCATIONAL", "1st, 2nd, 3rd Year"),
      level(
        "in-undergrad",
        "Bachelor's (BA / BSc / BTech / BCom)",
        "UNDERGRADUATE",
        "1st Year – 4th Year"
      ),
      level("in-masters", "Master's", "POSTGRADUATE", "Year 1, Year 2"),
      level("in-phd", "PhD", "DOCTORAL", "Year 1–5"),
    ],
  },
  BRITISH: {
    archetype: "BRITISH",
    displayName: "British",
    description: "UK, Australia, NZ, Malaysia, UAE, and related curricula",
    levels: [
      level("br-primary", "Primary School", "PRIMARY", "Year 1–6"),
      level("br-secondary", "Secondary School", "LOWER_SECONDARY", "Year 7–9"),
      level("br-gcse", "GCSE / O-Levels", "UPPER_SECONDARY", "Year 10, Year 11"),
      level(
        "br-sixth",
        "Sixth Form / A-Levels",
        "POST_SECONDARY",
        "Year 12 (Lower Sixth), Year 13 (Upper Sixth)"
      ),
      level("br-foundation", "Foundation Year", "POST_SECONDARY", "Foundation Year"),
      level("br-btec", "BTEC / HND / Apprenticeship", "VOCATIONAL", "Level 2, Level 3, HNC, HND"),
      level("br-undergrad", "Bachelor's Degree", "UNDERGRADUATE", "1st, 2nd, 3rd Year"),
      level("br-masters", "Master's", "POSTGRADUATE", "Year 1, Year 2"),
      level("br-phd", "PhD / DPhil", "DOCTORAL", "Year 1–4"),
    ],
  },
  NORTH_AMERICAN: {
    archetype: "NORTH_AMERICAN",
    displayName: "North American",
    description: "USA, Canada",
    levels: [
      level("na-elementary", "Elementary School", "PRIMARY", "Kindergarten – Grade 5"),
      level("na-middle", "Middle School", "LOWER_SECONDARY", "Grade 6 – Grade 8"),
      level(
        "na-high",
        "High School",
        "UPPER_SECONDARY",
        "Grade 9 (Freshman) – Grade 12 (Senior)"
      ),
      level(
        "na-community",
        "Community College / Associates",
        "VOCATIONAL",
        "1st Year, 2nd Year"
      ),
      level(
        "na-undergrad",
        "College / University (Bachelor's)",
        "UNDERGRADUATE",
        "Freshman, Sophomore, Junior, Senior"
      ),
      level(
        "na-grad",
        "Graduate School (Master's / MBA)",
        "POSTGRADUATE",
        "Year 1, Year 2"
      ),
      level("na-phd", "PhD / Doctoral Program", "DOCTORAL", "Year 1–6"),
    ],
  },
  EUROPEAN_CONTINENTAL: {
    archetype: "EUROPEAN_CONTINENTAL",
    displayName: "European (Continental)",
    description: "Germany, France, Netherlands, and continental Europe",
    levels: [
      level(
        "eu-primary",
        "Primary School",
        "PRIMARY",
        "Class / Year 1–4 or 1–6 depending on country"
      ),
      level("eu-lower-sec", "Lower Secondary", "LOWER_SECONDARY", "Class 5–9 or 6–10"),
      level(
        "eu-upper-academic",
        "Upper Secondary — Academic Track (Gymnasium / Lycée / VWO)",
        "POST_SECONDARY",
        "Klasse 10–13, Année Terminale",
        { track: "academic" }
      ),
      level(
        "eu-upper-vocational",
        "Upper Secondary — Vocational Track (Berufsschule / BTS / MBO)",
        "VOCATIONAL",
        "1st Year, 2nd Year, 3rd Year",
        { track: "vocational" }
      ),
      level(
        "eu-undergrad",
        "Bachelor's / Licence (3 years)",
        "UNDERGRADUATE",
        "Year 1, Year 2, Year 3"
      ),
      level("eu-masters", "Master's (2 years)", "POSTGRADUATE", "Year 1, Year 2"),
      level("eu-phd", "PhD / Doktorat", "DOCTORAL", "Year 1–4"),
    ],
  },
  EAST_ASIAN: {
    archetype: "EAST_ASIAN",
    displayName: "East Asian",
    description: "China, Japan, South Korea, Taiwan",
    levels: [
      level("ea-elementary", "Elementary School", "PRIMARY", "Grade 1–6"),
      level("ea-middle", "Middle School", "LOWER_SECONDARY", "Grade 7–9"),
      level(
        "ea-high",
        "High School",
        "UPPER_SECONDARY",
        "Grade 10–12 (Year 1–3 of High School)"
      ),
      level(
        "ea-vocational",
        "Vocational High School / College",
        "VOCATIONAL",
        "Year 1–3"
      ),
      level("ea-undergrad", "Undergraduate / University", "UNDERGRADUATE", "Year 1–4"),
      level("ea-masters", "Master's", "POSTGRADUATE", "Year 1–3"),
      level("ea-phd", "PhD", "DOCTORAL", "Year 1–4"),
    ],
  },
  GENERIC: {
    archetype: "GENERIC",
    displayName: "General",
    description: "International / other countries",
    levels: [
      level(
        "gen-primary",
        "Primary / Elementary School",
        "PRIMARY",
        "Grade / Year 1–6"
      ),
      level(
        "gen-lower",
        "Lower Secondary / Middle School",
        "LOWER_SECONDARY",
        "Grade / Year 7–9"
      ),
      level(
        "gen-upper",
        "Upper Secondary / High School",
        "UPPER_SECONDARY",
        "Grade / Year 10–12"
      ),
      level(
        "gen-post-sec",
        "Post-Secondary / Pre-University",
        "POST_SECONDARY",
        "Year 1, Year 2"
      ),
      level(
        "gen-vocational",
        "Vocational / Technical / Diploma",
        "VOCATIONAL",
        "Year 1, Year 2, Year 3"
      ),
      level(
        "gen-undergrad",
        "Undergraduate / Bachelor's",
        "UNDERGRADUATE",
        "Year 1–4"
      ),
      level("gen-masters", "Postgraduate / Master's", "POSTGRADUATE", "Year 1, Year 2"),
      level("gen-phd", "PhD / Doctorate", "DOCTORAL", "Year 1–5"),
    ],
  },
};

const TIER_GUIDANCE: Record<EducationTier, string> = {
  PRIMARY:
    "Use very simple language. No technical jargon. Use toys, animals, and everyday objects as examples.",
  LOWER_SECONDARY:
    "Clear simple language. Introduce basic concepts only. Use relatable daily-life examples.",
  UPPER_SECONDARY:
    "Standard secondary level. Introduce technical terms with clear definitions alongside them.",
  POST_SECONDARY:
    "Pre-university depth. Subject-specific terminology is acceptable. Use exam-focused examples.",
  VOCATIONAL:
    "Practical focus. Use trade-specific terminology. Prioritise hands-on applied examples.",
  UNDERGRADUATE:
    "University depth. Academic writing style. Assume the student has foundational knowledge.",
  POSTGRADUATE:
    "Research level. Assume strong domain knowledge. Reference key academic concepts directly.",
  DOCTORAL:
    "Expert peer-level discussion. Reference cutting-edge research and advanced theory where relevant.",
};

export function getSystemForArchetype(
  archetype: EducationArchetype
): EducationSystem {
  return EDUCATION_SYSTEMS[archetype] ?? EDUCATION_SYSTEMS.GENERIC;
}

export function getLevelsForArchetype(
  archetype: EducationArchetype
): EducationLevelOption[] {
  return getSystemForArchetype(archetype).levels;
}

export function getTierGuidance(tier: EducationTier): string {
  return TIER_GUIDANCE[tier] ?? TIER_GUIDANCE.UPPER_SECONDARY;
}

export function findLevelById(
  archetype: EducationArchetype,
  levelId: string
): EducationLevelOption | undefined {
  return getLevelsForArchetype(archetype).find((l) => l.id === levelId);
}
