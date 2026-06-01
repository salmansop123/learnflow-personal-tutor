import type { Question, QuestionType, QuizQuestionCounts } from "@/types/quiz";

export type PaperSection = "mcq" | "fill_blank" | "short" | "long";

export const PAPER_SECTION_ORDER: PaperSection[] = [
  "mcq",
  "fill_blank",
  "short",
  "long",
];

export const SECTION_LABELS: Record<
  PaperSection,
  { letter: string; title: string }
> = {
  mcq: { letter: "A", title: "Multiple Choice Questions" },
  fill_blank: { letter: "B", title: "Fill in the Blank" },
  short: { letter: "C", title: "Short Answer Questions" },
  long: { letter: "D", title: "Long Answer / Essay Questions" },
};

export const MARKS_PER_TYPE: Record<PaperSection, number> = {
  mcq: 1,
  fill_blank: 1,
  short: 3,
  long: 8,
};

export function paperSectionForQuestion(q: Question): PaperSection {
  const section = (q.section ?? q.type) as string;
  if (section === "mcq") return "mcq";
  if (section === "fill_blank") return "fill_blank";
  if (section === "long") return "long";
  return "short";
}

export function totalQuestionCount(counts: QuizQuestionCounts): number {
  return (
    (counts.mcq ?? 0) +
    (counts.fill_blank ?? 0) +
    (counts.short ?? 0) +
    (counts.long ?? 0)
  );
}

export function questionTypesFromCounts(
  counts: QuizQuestionCounts
): QuestionType[] {
  const types: QuestionType[] = [];
  if (counts.mcq) types.push("mcq");
  if (counts.fill_blank) types.push("fill_blank");
  if (counts.short) types.push("short");
  if (counts.long) types.push("long");
  return types;
}

export function groupQuestionsByPaperSection(
  questions: Question[]
): { section: PaperSection; questions: Question[] }[] {
  const groups: { section: PaperSection; questions: Question[] }[] = [];

  for (const sectionKey of PAPER_SECTION_ORDER) {
    const sectionQuestions = questions.filter(
      (q) => paperSectionForQuestion(q) === sectionKey
    );
    if (sectionQuestions.length > 0) {
      groups.push({ section: sectionKey, questions: sectionQuestions });
    }
  }
  return groups;
}

export function sectionMarks(section: PaperSection, count: number): number {
  return MARKS_PER_TYPE[section] * count;
}

export function formatPaperTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function totalTimeLimitSeconds(questions: Question[]): number {
  return questions.reduce((sum, q) => sum + q.timeLimit, 0);
}

export function countAnswered(
  questions: Question[],
  answers: Record<string, string>
): number {
  return questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
}
