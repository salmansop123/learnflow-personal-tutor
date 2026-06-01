import { isAnswerCorrect } from "@/lib/quiz-parse";
import {
  countAnswered,
  groupQuestionsByPaperSection,
  MARKS_PER_TYPE,
  paperSectionForQuestion,
  type PaperSection,
} from "@/lib/quiz-paper";
import type { Question, QuestionResult } from "@/types/quiz";

export type SectionBreakdown = Partial<
  Record<PaperSection, { correct: number; total: number }>
>;

export type QuizResultsSummary = {
  correct: number;
  total: number;
  totalScored: number;
  score: number;
  answered: number;
  incorrect: number;
  skipped: number;
  totalMarks: number;
  isPartial: boolean;
  partialReason: string | null;
  sectionBreakdown: SectionBreakdown;
};

export function formatQuizDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m} min ${s} sec`;
}

export function performanceLabel(percentage: number): string {
  if (percentage >= 90) return "Excellent! Outstanding performance.";
  if (percentage >= 80) return "Great job! Strong understanding.";
  if (percentage >= 70) return "Good work. A few areas to review.";
  if (percentage >= 60) return "Fair. Review the topics you missed.";
  return "Needs improvement. Focus on the weak areas.";
}

export function scoreCircleColor(percentage: number): string {
  if (percentage >= 80) return "text-emerald-500";
  if (percentage >= 60) return "text-amber-500";
  return "text-red-500";
}

export function marksForQuestion(q: Question): number {
  return MARKS_PER_TYPE[paperSectionForQuestion(q)];
}

export function computeQuizResults(
  questions: Question[],
  answers: Record<string, string>,
  options: { partial?: boolean } = {}
): { results: QuestionResult[]; summary: QuizResultsSummary } {
  const partial = options.partial ?? false;
  const answered = countAnswered(questions, answers);

  const results: QuestionResult[] = questions.map((q) => {
    const userAnswer = (answers[q.id] ?? "").trim();
    const hasAnswer = userAnswer.length > 0;
    const isCorrect = hasAnswer ? isAnswerCorrect(q, userAnswer) : false;
    return {
      questionId: q.id,
      userAnswer,
      isCorrect,
      skipped: !hasAnswer,
    };
  });

  const correct = results.filter((r) => r.isCorrect).length;
  const skipped = results.filter((r) => r.skipped).length;
  const incorrect = results.filter(
    (r) => !r.skipped && !r.isCorrect
  ).length;

  const totalScored = partial ? answered : questions.length;
  const score =
    totalScored > 0 ? Math.round((correct / totalScored) * 100) : 0;

  const totalMarks = results.reduce((sum, r, i) => {
    if (!r.isCorrect) return sum;
    return sum + marksForQuestion(questions[i]!);
  }, 0);

  const sectionBreakdown: SectionBreakdown = {};
  for (const { section, questions: sectionQuestions } of groupQuestionsByPaperSection(
    questions
  )) {
    const sectionResults = sectionQuestions.map(
      (q) => results.find((r) => r.questionId === q.id)!
    );
    sectionBreakdown[section] = {
      correct: sectionResults.filter((r) => r.isCorrect).length,
      total: sectionQuestions.length,
    };
  }

  return {
    results,
    summary: {
      correct,
      total: questions.length,
      totalScored,
      score,
      answered,
      incorrect,
      skipped,
      totalMarks,
      isPartial: partial,
      partialReason: partial ? "student_cancelled" : null,
      sectionBreakdown,
    },
  };
}
