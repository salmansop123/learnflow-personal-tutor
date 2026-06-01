import type { Question, QuestionType } from "@/types/quiz";

const QUESTION_TYPES: QuestionType[] = [
  "mcq",
  "fill_blank",
  "short",
  "concept",
  "long",
];

function normalizeType(value: unknown): QuestionType {
  const s = String(value ?? "mcq").toLowerCase().replace("-", "_");
  if (QUESTION_TYPES.includes(s as QuestionType)) return s as QuestionType;
  return "mcq";
}

const FILL_BLANK_MARKER = /_{3,}/g;

/** Text before and after the single answer slot (handles multiple ___ from AI). */
export function getFillBlankDisplayParts(question: string): {
  before: string;
  after: string;
} {
  const firstIndex = question.search(FILL_BLANK_MARKER);
  if (firstIndex === -1) {
    return { before: question, after: "" };
  }

  let lastEnd = firstIndex;
  const re = new RegExp(FILL_BLANK_MARKER.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(question)) !== null) {
    lastEnd = match.index + match[0].length;
  }

  const before = question.slice(0, firstIndex).replace(/\s+$/, "");
  const after = question
    .slice(lastEnd)
    .replace(/^\s*_+\s*/, "")
    .trimStart();

  return { before, after };
}

/** Collapse multiple blank markers into exactly one `___`. */
export function normalizeFillBlankQuestionText(text: string): string {
  if (!/_{3,}/.test(text)) return text;

  const { before, after } = getFillBlankDisplayParts(text);
  if (!before && !after) return text.replace(/_{3,}/g, "___");

  if (before && after) return `${before} ___ ${after}`;
  if (before) return `${before} ___`;
  return `___ ${after}`;
}

function normalizeQuestion(raw: Record<string, unknown>, index: number): Question {
  const type = normalizeType(raw.type);
  const options = Array.isArray(raw.options)
    ? raw.options.map(String)
    : type === "mcq"
      ? ["A", "B", "C", "D"]
      : [];

  const sectionRaw = raw.section ?? raw.type;
  const section = normalizeType(sectionRaw);

  let questionText = String(raw.question ?? "Question");
  if (type === "fill_blank") {
    questionText = normalizeFillBlankQuestionText(questionText);
  }

  return {
    id: String(raw.id ?? `q-${index + 1}`),
    type,
    section,
    question: questionText,
    options,
    correctAnswer: String(raw.correctAnswer ?? raw.correct_answer ?? ""),
    explanation: String(raw.explanation ?? ""),
    difficulty: (["easy", "medium", "hard"].includes(String(raw.difficulty))
      ? raw.difficulty
      : "medium") as Question["difficulty"],
    timeLimit: Math.max(
      15,
      Math.min(
        300,
        Number(raw.timeLimit ?? raw.time_limit ?? (type === "long" ? 180 : 60)) ||
          (type === "long" ? 180 : 60)
      )
    ),
  };
}

export function parseQuizQuestionsPayload(data: unknown): Question[] {
  let items: unknown[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.questions)) items = obj.questions;
    else if (Array.isArray(obj.data)) items = obj.data;
  }

  if (items.length === 0) {
    throw new Error("No questions returned from the AI");
  }

  return items.map((item, i) =>
    normalizeQuestion(
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : { question: String(item) },
      i
    )
  );
}

export function parseQuizJsonText(raw: string): Question[] {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as unknown;
  return parseQuizQuestionsPayload(parsed);
}

export function isAnswerCorrect(
  question: Question,
  userAnswer: string
): boolean {
  const expected = question.correctAnswer.trim().toLowerCase();
  const given = userAnswer.trim().toLowerCase();
  if (!given) return false;
  if (question.type === "mcq") {
    return (
      given === expected ||
      question.options.some(
        (opt, idx) =>
          given === opt.toLowerCase() &&
          (expected === opt.toLowerCase() ||
            expected === String(idx) ||
            expected === String.fromCharCode(65 + idx).toLowerCase())
      )
    );
  }
  if (
    question.type === "fill_blank" ||
    question.type === "short" ||
    question.type === "long"
  ) {
    if (question.type === "long") {
      const keywords = expected
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 4);
      const matchCount = keywords.filter((k) => given.includes(k)).length;
      return (
        matchCount >= Math.max(2, Math.ceil(keywords.length * 0.35)) ||
        given.length >= Math.min(80, expected.length * 0.4)
      );
    }
    return given === expected || expected.includes(given) || given.includes(expected);
  }
  return given === expected || expected.split(/\s+/).some((w) => w.length > 3 && given.includes(w));
}
