"use client";

import { format } from "date-fns";
import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SavedQuizAttempt } from "@/lib/quiz";
import type { Question, QuestionResult } from "@/types/quiz";
import { cn } from "@/lib/utils";

type StoredAttemptPayload = {
  questions?: Question[];
  answers?: Record<string, string>;
  results?: QuestionResult[];
};

function formatTimeTaken(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins} min ${secs} sec`;
  return `${secs} sec`;
}

function scoreBadgeClass(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300";
  if (score >= 60) return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
  return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300";
}

function parseAttemptDetail(questionsJson: string | null | undefined): StoredAttemptPayload {
  if (!questionsJson) return {};
  try {
    return JSON.parse(questionsJson) as StoredAttemptPayload;
  } catch {
    return {};
  }
}

function QuizHistoryCard({ attempt }: { attempt: SavedQuizAttempt }) {
  const [expanded, setExpanded] = useState(false);
  const detail = parseAttemptDetail(attempt.questionsJson);
  const questions = detail.questions ?? [];
  const resultsById = Object.fromEntries(
    (detail.results ?? []).map((r) => [r.questionId, r])
  );
  const answers = detail.answers ?? {};

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="font-semibold">{attempt.subject}</p>
            {attempt.topic ? (
              <p className="text-sm text-muted-foreground">{attempt.topic}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {format(new Date(attempt.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                scoreBadgeClass(attempt.score)
              )}
            >
              {Math.round(attempt.score)}%
            </span>
            <span className="rounded-full border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
              {attempt.difficulty}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tabular-nums">
              {attempt.correctAnswers} / {attempt.totalQuestions}
            </p>
            <p className="text-xs text-muted-foreground">
              {attempt.totalQuestions} questions · {formatTimeTaken(attempt.timeTaken)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setExpanded((v) => !v)}
          >
            View Details
            {expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>

        {expanded ? (
          <div className="mt-4 space-y-3 border-t pt-4">
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Question breakdown is not available for this attempt.
              </p>
            ) : (
              questions.map((q, i) => {
                const r = resultsById[q.id];
                const ok = r?.isCorrect ?? false;
                const userAnswer = r?.userAnswer ?? answers[q.id] ?? "—";
                return (
                  <div
                    key={q.id}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-start gap-2">
                      {ok ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
                          aria-hidden
                        />
                      ) : (
                        <XCircle
                          className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium">
                          {i + 1}. {q.question}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            ok ? "text-muted-foreground" : "text-destructive"
                          )}
                        >
                          Your answer: {userAnswer}
                          {!ok ? ` · Correct: ${q.correctAnswer}` : ""}
                        </p>
                        <p className="mt-2 text-muted-foreground">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function QuizHistory({ attempts }: { attempts: SavedQuizAttempt[] }) {
  if (attempts.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Your Quiz History</h2>
        <p className="text-sm text-muted-foreground">
          Quiz results are saved permanently and cannot be deleted.
        </p>
      </div>
      <div className="space-y-3">
        {attempts.map((attempt) => (
          <QuizHistoryCard key={attempt.id} attempt={attempt} />
        ))}
      </div>
    </section>
  );
}
