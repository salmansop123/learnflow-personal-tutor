"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { AiDetectionBar, type AiDetectionResult } from "@/components/quiz/AiDetectionBar";
import { Button } from "@/components/ui/button";
import {
  computeQuizResults,
  formatQuizDuration,
  marksForQuestion,
  performanceLabel,
  scoreCircleColor,
  type QuizResultsSummary,
} from "@/lib/quiz-results";
import {
  groupQuestionsByPaperSection,
  MARKS_PER_TYPE,
  paperSectionForQuestion,
  SECTION_LABELS,
} from "@/lib/quiz-paper";
import { getFillBlankDisplayParts } from "@/lib/quiz-parse";
import { cn } from "@/lib/utils";
import type { Question, QuestionResult, QuizSetupConfig } from "@/types/quiz";

function optionLabel(option: string, index: number): string {
  const letter = String.fromCharCode(65 + index);
  if (/^[A-D][\).\s]/i.test(option.trim())) return option;
  return `${letter}. ${option}`;
}

function isOptionSelected(option: string, index: number, userAnswer: string): boolean {
  const letter = String.fromCharCode(65 + index);
  return userAnswer === option || userAnswer === letter;
}

function ScoreCircle({
  percentage,
  correct,
  totalScored,
}: {
  percentage: number;
  correct: number;
  totalScored: number;
}) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFill(percentage));
    return () => cancelAnimationFrame(frame);
  }, [percentage]);

  const strokeOffset = circumference - (fill / 100) * circumference;
  const colorClass = scoreCircleColor(percentage);

  return (
    <div className="relative mx-auto h-44 w-44">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/30"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className={colorClass}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-2xl font-bold tabular-nums">
          {correct} / {totalScored}
        </p>
        <p className={cn("text-lg font-semibold tabular-nums", colorClass)}>
          {percentage}%
        </p>
      </div>
    </div>
  );
}

function FillBlankReview({
  question,
  userAnswer,
  isCorrect,
}: {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
}) {
  const { before, after } = getFillBlankDisplayParts(question.question);
  const hasInlineBlank = /_{3,}/.test(question.question);
  const answerClass = isCorrect
    ? "font-medium text-emerald-700 dark:text-emerald-400"
    : "font-medium text-red-600 dark:text-red-400";
  const answerSpan = (
    <span className={cn("mx-1 rounded px-1", answerClass)}>
      {userAnswer || "—"}
    </span>
  );

  return (
    <div className="space-y-2">
      {hasInlineBlank ? (
        <p className="text-sm leading-relaxed">
          {before}
          {before ? " " : null}
          {answerSpan}
          {after ? ` ${after}` : null}
        </p>
      ) : (
        <p className="text-sm leading-relaxed">
          {question.question} {answerSpan}
        </p>
      )}
      {!isCorrect ? (
        <p className="text-xs text-muted-foreground">
          Correct answer:{" "}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            {question.correctAnswer}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function McqReview({
  question,
  userAnswer,
  isCorrect,
}: {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{question.question}</p>
      <ul className="space-y-1.5">
        {question.options.map((option, i) => {
          const labeled = optionLabel(option, i);
          const selected = isOptionSelected(option, i, userAnswer);
          const isCorrectOption =
            isOptionSelected(option, i, question.correctAnswer) ||
            option === question.correctAnswer;

          let style = "border-border";
          if (selected && isCorrect) {
            style = "border-emerald-500/50 bg-emerald-500/10";
          } else if (selected && !isCorrect) {
            style = "border-red-500/50 bg-red-500/10";
          } else if (!selected && isCorrectOption && !isCorrect) {
            style = "border-emerald-500/40 bg-emerald-500/5";
          }

          return (
            <li
              key={option}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                style
              )}
            >
              {selected && isCorrect ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : selected && !isCorrect ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              ) : !selected && isCorrectOption && !isCorrect ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <span className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{labeled}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function QuizResults({
  score,
  correct,
  total,
  timeTaken,
  questions,
  results,
  answers = {},
  isSaving,
  savedAttemptId,
  error,
  onRetry,
  onRetake,
  onNewQuiz,
  quizSummary,
  aiDetectionResults = {},
  config,
}: {
  score: number;
  correct: number;
  total: number;
  timeTaken: number;
  questions: Question[];
  results: QuestionResult[];
  answers?: Record<string, string>;
  isSaving: boolean;
  savedAttemptId: string | null;
  error: string | null;
  onRetry: () => void;
  onRetake?: () => void;
  onNewQuiz?: () => void;
  quizSummary?: QuizResultsSummary | null;
  aiDetectionResults?: Record<string, AiDetectionResult | null>;
  config?: QuizSetupConfig | null;
}) {
  const summary = useMemo(() => {
    if (quizSummary) return quizSummary;
    return computeQuizResults(questions, answers).summary;
  }, [quizSummary, questions, answers]);

  const resultById = Object.fromEntries(
    results.map((r) => [r.questionId, r])
  );

  const percentage = summary.score;
  const totalScored = summary.totalScored;
  const sections = groupQuestionsByPaperSection(questions);
  let questionNumber = 0;

  return (
    <div className="space-y-8 pb-10">
      {summary.isPartial ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Partial Result — You cancelled this paper. Score is based on{" "}
          {summary.answered} answered question{summary.answered === 1 ? "" : "s"}{" "}
          only.
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-900 dark:text-emerald-100">
          Paper Complete!
        </div>
      )}

      <section className="flex flex-col items-center text-center">
        <ScoreCircle
          percentage={percentage}
          correct={summary.correct}
          totalScored={totalScored}
        />
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          {performanceLabel(percentage)}
        </p>
        {isSaving ? (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Saving your attempt…
          </p>
        ) : savedAttemptId ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Saved to your quiz history.
          </p>
        ) : null}
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "Total Questions", value: summary.total, tone: "" },
          { label: "Answered", value: summary.answered, tone: "" },
          { label: "Correct", value: summary.correct, tone: "text-emerald-600" },
          { label: "Incorrect", value: summary.incorrect, tone: "text-red-600" },
          {
            label: "Skipped",
            value: summary.skipped,
            tone: "text-muted-foreground",
          },
          {
            label: "Time Taken",
            value: formatQuizDuration(timeTaken),
            tone: "",
            mono: false,
          },
          {
            label: "Total Marks",
            value: summary.totalMarks,
            tone: "text-primary",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card px-3 py-3 text-center shadow-sm"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-semibold tabular-nums",
                stat.tone
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Per-section breakdown</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(({ section, questions: sectionQuestions }) => {
            const meta = SECTION_LABELS[section];
            const breakdown = summary.sectionBreakdown[section] ?? {
              correct: 0,
              total: sectionQuestions.length,
            };
            const sectionPct =
              breakdown.total > 0
                ? Math.round((breakdown.correct / breakdown.total) * 100)
                : 0;
            return (
              <div
                key={section}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <p className="text-sm font-medium">
                  Section {meta.letter} — {meta.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {breakdown.correct} / {breakdown.total} correct — {sectionPct}%
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${sectionPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Answer review</h2>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto rounded-xl border bg-card/50 p-4 sm:p-6">
          {sections.map(({ section, questions: sectionQuestions }) => (
            <div key={section} className="space-y-4">
              <h3 className="text-base font-bold">
                Section {SECTION_LABELS[section].letter} —{" "}
                {SECTION_LABELS[section].title}
              </h3>
              {sectionQuestions.map((q) => {
                questionNumber += 1;
                const r = resultById[q.id];
                const maxMarks = MARKS_PER_TYPE[paperSectionForQuestion(q)];
                const earned = r?.isCorrect ? maxMarks : 0;
                const userAnswer = r?.userAnswer ?? "";
                const ok = r?.isCorrect ?? false;
                const skipped = r?.skipped ?? userAnswer.length === 0;
                const detection = aiDetectionResults[q.id];

                return (
                  <article
                    key={q.id}
                    className="rounded-lg border border-border/60 bg-card p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">
                        Question {questionNumber}
                        {skipped ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            (skipped)
                          </span>
                        ) : null}
                      </p>
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {earned} / {maxMarks} marks
                      </span>
                    </div>

                    {q.type === "mcq" ? (
                      <McqReview
                        question={q}
                        userAnswer={userAnswer}
                        isCorrect={ok}
                      />
                    ) : q.type === "fill_blank" ? (
                      <FillBlankReview
                        question={q}
                        userAnswer={userAnswer}
                        isCorrect={ok}
                      />
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">{q.question}</p>
                        <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm leading-relaxed">
                          {userAnswer || (
                            <span className="text-muted-foreground">
                              No answer provided
                            </span>
                          )}
                        </div>
                        {detection ? (
                          <AiDetectionBar result={detection} />
                        ) : null}
                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2">
                          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                            Expected Answer / Key Points
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {q.correctAnswer}
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                      {q.explanation}
                    </p>
                  </article>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={onRetake ?? onRetry}>
          Retake this quiz
        </Button>
        <Button type="button" variant="outline" onClick={onNewQuiz ?? onRetry}>
          New quiz
        </Button>
      </div>

      {config ? (
        <p className="text-center text-xs text-muted-foreground">
          {config.subject}
          {config.topic ? ` · ${config.topic}` : ""}
        </p>
      ) : null}
    </div>
  );
}
