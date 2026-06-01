/**
 * Canonical subject names and alias resolution for study sessions.
 * Keys are normalized (lowercase, trimmed, punctuation stripped except hyphens).
 */

export const SUBJECT_ALIASES: Record<string, string> = {
  // Mathematics
  math: "Mathematics",
  maths: "Mathematics",
  mathematics: "Mathematics",
  matematica: "Mathematics",
  calculus: "Mathematics",
  algebra: "Mathematics",
  geometry: "Mathematics",
  trigonometry: "Mathematics",
  arithmetic: "Mathematics",
  stats: "Statistics",
  statistics: "Statistics",

  // Physics
  physics: "Physics",
  phys: "Physics",
  phy: "Physics",
  ph: "Physics",

  // Chemistry
  chemistry: "Chemistry",
  chem: "Chemistry",
  che: "Chemistry",
  "organic chemistry": "Chemistry",
  "inorganic chemistry": "Chemistry",

  // Biology
  biology: "Biology",
  bio: "Biology",
  botany: "Biology",
  zoology: "Biology",
  microbiology: "Biology",

  // English
  english: "English",
  eng: "English",
  "english language": "English",
  "english literature": "English Literature",
  literature: "English Literature",
  lit: "English Literature",

  // Computer Science
  "computer science": "Computer Science",
  cs: "Computer Science",
  "comp sci": "Computer Science",
  coding: "Computer Science",
  programming: "Computer Science",
  software: "Computer Science",
  it: "Computer Science",
  "information technology": "Computer Science",

  // Economics
  economics: "Economics",
  econ: "Economics",
  eco: "Economics",
  microeconomics: "Economics",
  macroeconomics: "Economics",

  // Accounting
  accounting: "Accounting",
  acc: "Accounting",
  acct: "Accounting",
  accounts: "Accounting",
  accountancy: "Accounting",

  // History & social studies
  history: "History",
  hist: "History",
  his: "History",
  "world history": "History",
  "pak studies": "Pakistan Studies",
  "pakistan studies": "Pakistan Studies",
  "social studies": "Social Studies",

  // Geography
  geography: "Geography",
  geo: "Geography",
  geog: "Geography",

  // Urdu
  urdu: "Urdu",
  "اردو": "Urdu",

  // Arabic & Islamic studies
  arabic: "Arabic",
  arab: "Arabic",
  islamiat: "Islamiat",
  "islamic studies": "Islamiat",
  quran: "Quran",
  "quran studies": "Quran",
};

const MAX_LEVENSHTEIN_LEN = 50;

function normalizeLookupKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function levenshteinDistance(a: string, b: string): number {
  const sa = a.slice(0, MAX_LEVENSHTEIN_LEN);
  const sb = b.slice(0, MAX_LEVENSHTEIN_LEN);
  const m = sa.length;
  const n = sb.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = row[j];
      const cost = sa[i - 1] === sb[j - 1] ? 0 : 1;
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + cost
      );
      prev = temp;
    }
  }
  return row[n]!;
}

function similarityScore(input: string, profileSubject: string): number {
  const a = input.toLowerCase();
  const b = profileSubject.toLowerCase();
  if (!a || !b) return 0;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function matchProfileSubject(
  input: string,
  profileSubjects: string[]
): { name: string; score: number } | null {
  const normalizedInput = normalizeLookupKey(input);
  if (!normalizedInput) return null;

  let best: { name: string; score: number } | null = null;
  for (const profileSubject of profileSubjects) {
    const trimmed = profileSubject.trim();
    if (!trimmed) continue;
    const score = similarityScore(
      normalizedInput,
      normalizeLookupKey(trimmed)
    );
    if (!best || score > best.score) {
      best = { name: trimmed, score };
    }
  }

  if (best && best.score >= 0.75) return best;
  return null;
}

/**
 * Layer 1: alias map · Layer 2: profile fuzzy match · Layer 3: title case
 */
export function normalizeSubjectName(
  input: string,
  profileSubjects: string[] = []
): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  const key = normalizeLookupKey(trimmed);
  const alias = SUBJECT_ALIASES[key];
  if (alias) return alias;

  const profileMatch = matchProfileSubject(trimmed, profileSubjects);
  if (profileMatch) return profileMatch.name;

  return toTitleCase(trimmed);
}

export function normalizeSubjects(
  subjects: string[],
  profileSubjects: string[] = []
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const subject of subjects) {
    const canonical = normalizeSubjectName(subject, profileSubjects);
    const dedupeKey = canonical.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    result.push(canonical);
  }

  return result;
}

/**
 * Suggests a correction when input likely matches a profile subject with medium confidence.
 */
/** Lightweight client-side check before adding a subject pill. */
export function looksLikeSubjectName(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 2) return false;
  if (/^\d+$/.test(trimmed)) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  return true;
}

export function detectPossibleTypo(
  input: string,
  profileSubjects: string[]
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const key = normalizeLookupKey(trimmed);
  const basicCap = toTitleCase(trimmed);

  if (SUBJECT_ALIASES[key]) {
    return null;
  }

  const profileMatch = matchProfileSubject(trimmed, profileSubjects);
  if (!profileMatch) return null;

  const { name: canonical, score } = profileMatch;
  if (score >= 0.95) return null;

  if (score >= 0.75 && score < 0.95) {
    const sameAsInput =
      canonical.toLowerCase() === trimmed.toLowerCase() ||
      canonical === basicCap;
    if (!sameAsInput) {
      return `Did you mean '${canonical}'?`;
    }
  }

  return null;
}

/** Groups of distinct labels that normalize to the same canonical name. */
export function findDuplicateSubjectGroups(subjects: string[]): string[][] {
  const canonicalGroups: Record<string, string[]> = {};

  for (const subject of subjects) {
    const trimmed = subject.trim();
    if (!trimmed) continue;
    const canonical = normalizeSubjectName(trimmed, []);
    if (!canonicalGroups[canonical]) canonicalGroups[canonical] = [];
    const exists = canonicalGroups[canonical].some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) canonicalGroups[canonical].push(trimmed);
  }

  return Object.values(canonicalGroups).filter((group) => group.length > 1);
}
