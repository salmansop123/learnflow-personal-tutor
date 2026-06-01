"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, Info, Loader2 } from "lucide-react";

import type { AiDetectionResult } from "@/components/quiz/AiDetectionBar";
import { PaperQuestionCard } from "@/components/quiz/PaperQuestionCard";
import { Button } from "@/components/ui/button";
import {
  countAnswered,
  formatPaperTimer,
  groupQuestionsByPaperSection,
  MARKS_PER_TYPE,
  paperSectionForQuestion,
  SECTION_LABELS,
  sectionMarks,
} from "@/lib/quiz-paper";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";
import type { QuizSetupConfig } from "@/types/quiz";

const EXTENSION_REQUEST_MINUTES = 10;
const AI_DETECTION_MIN_CHARS = 80;
const AI_DETECTION_DEBOUNCE_MS = 3000;
const EXTENSION_NOTICE_MS = 5000;

type ExtensionNotice = {
  granted: number;
  reason: string;
};

function isTextAnswerType(q: Question): boolean {
  const section = paperSectionForQuestion(q);
  return section === "short" || section === "long";
}

export function QuizInterface({
  phase,
  questions,
  answers,
  config,
  timeLeft,
  studentName,
  onAnswerChange,
  onSubmitPaper,
  onCancelPaper,
  onAddTimeExtension,
  isSubmitting,
}: {
  phase: "loading" | "active";
  questions: Question[];
  answers: Record<string, string>;
  config: QuizSetupConfig | null;
  timeLeft: number;
  studentName?: string | null;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmitPaper: (opts?: {
    aiDetectionResults?: Record<string, AiDetectionResult | null>;
  }) => void;
  onCancelPaper?: (opts?: {
    aiDetectionResults?: Record<string, AiDetectionResult | null>;
  }) => void;
  onAddTimeExtension?: (seconds: number) => void;
  isSubmitting?: boolean;
}) {
  const [extensionLoading, setExtensionLoading] = useState(false);
  const [hasRequestedExtension, setHasRequestedExtension] = useState(false);
  const [extensionNotice, setExtensionNotice] = useState<ExtensionNotice | null>(
    null
  );
  const [showExtensionTooltip, setShowExtensionTooltip] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [aiDetectionResults, setAiDetectionResults] = useState<
    Record<string, AiDetectionResult | null>
  >({});
  const [aiDetectionLoading, setAiDetectionLoading] = useState<
    Record<string, boolean>
  >({});

  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const detectionRequestIdRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      for (const id of Object.keys(debounceTimersRef.current)) {
        clearTimeout(debounceTimersRef.current[id]);
      }
    };
  }, []);

  useEffect(() => {
    if (!extensionNotice) return;
    const timer = window.setTimeout(() => setExtensionNotice(null), EXTENSION_NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [extensionNotice]);

  const runAiDetection = useCallback(async (questionId: string, text: string) => {
    const requestId = (detectionRequestIdRef.current[questionId] ?? 0) + 1;
    detectionRequestIdRef.current[questionId] = requestId;

    setAiDetectionLoading((prev) => ({ ...prev, [questionId]: true }));

    try {
      const res = await fetch("/api/ai/quiz/detect-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) return;

      const data = (await res.json()) as AiDetectionResult;
      if (detectionRequestIdRef.current[questionId] !== requestId) return;

      setAiDetectionResults((prev) => ({
        ...prev,
        [questionId]: data,
      }));
    } catch {
      // Silent — detection must not interrupt the student
    } finally {
      if (detectionRequestIdRef.current[questionId] === requestId) {
        setAiDetectionLoading((prev) => ({ ...prev, [questionId]: false }));
      }
    }
  }, []);

  const scheduleAiDetection = useCallback(
    (questionId: string, text: string) => {
      const existing = debounceTimersRef.current[questionId];
      if (existing) clearTimeout(existing);

      if (text.length < AI_DETECTION_MIN_CHARS) {
        setAiDetectionResults((prev) => {
          if (prev[questionId] == null) return prev;
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
        setAiDetectionLoading((prev) => {
          if (!prev[questionId]) return prev;
          const next = { ...prev };
          delete next[questionId];
          return next;
        });
        detectionRequestIdRef.current[questionId] =
          (detectionRequestIdRef.current[questionId] ?? 0) + 1;
        return;
      }

      debounceTimersRef.current[questionId] = setTimeout(() => {
        void runAiDetection(questionId, text);
      }, AI_DETECTION_DEBOUNCE_MS);
    },
    [runAiDetection]
  );

  const handleAnswerChange = useCallback(
    (question: Question, value: string) => {
      onAnswerChange(question.id, value);
      if (isTextAnswerType(question)) {
        scheduleAiDetection(question.id, value);
      }
    },
    [onAnswerChange, scheduleAiDetection]
  );

  const handleRequestExtension = useCallback(async () => {
    if (hasRequestedExtension) {
      setShowExtensionTooltip(true);
      window.setTimeout(() => setShowExtensionTooltip(false), 3000);
      return;
    }

    setExtensionLoading(true);
    try {
      const res = await fetch("/api/ai/quiz/extend-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          currentTimeRemaining: timeLeft,
          extensionRequested: EXTENSION_REQUEST_MINUTES,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Failed to request extra time"
        );
      }

      const data = (await res.json()) as ExtensionNotice;
      setHasRequestedExtension(true);
      setExtensionNotice(data);

      if (data.granted > 0) {
        onAddTimeExtension?.(data.granted);
      }
    } catch {
      setExtensionNotice({
        granted: 0,
        reason: "Could not process your request. Please continue with the time remaining.",
      });
      setHasRequestedExtension(true);
    } finally {
      setExtensionLoading(false);
    }
  }, [
    hasRequestedExtension,
    questions,
    timeLeft,
    onAddTimeExtension,
  ]);

  if (phase === "loading") {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border bg-card p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Generating your quiz paper…
        </p>
      </div>
    );
  }

  if (phase !== "active" || questions.length === 0) {
    return null;
  }

  const sections = groupQuestionsByPaperSection(questions);
  let questionNumber = 0;
  const answered = countAnswered(questions, answers);
  const unanswered = questions.length - answered;

  const submitDetectionSnapshot = () => ({ ...aiDetectionResults });

  const handleConfirmSubmit = () => {
    setShowSubmitConfirm(false);
    onSubmitPaper({ aiDetectionResults: submitDetectionSnapshot() });
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    onCancelPaper?.({ aiDetectionResults: submitDetectionSnapshot() });
  };
  const grantedMinutes =
    extensionNotice && extensionNotice.granted > 0
      ? Math.round(extensionNotice.granted / 60)
      : 0;

  return (
    <div className="flex min-h-[70vh] flex-col overflow-hidden rounded-xl border bg-card">
      <header className="sticky top-0 z-10 shrink-0 border-b bg-card/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-lg font-semibold">{config?.subject ?? "Quiz"}</p>
            {config?.topic ? (
              <p className="text-sm text-muted-foreground">{config.topic}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {studentName ? `${studentName} · ` : ""}
              {questions.length} questions
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <p
                className="font-mono text-2xl font-bold tabular-nums text-primary"
                aria-live="polite"
              >
                {formatPaperTimer(timeLeft)}
              </p>
              {hasRequestedExtension ? (
                <span className="text-[10px] text-muted-foreground">
                  Time extension used
                </span>
              ) : (
                <div className="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-xs"
                    onClick={() => void handleRequestExtension()}
                    disabled={extensionLoading || isSubmitting}
                    title={
                      hasRequestedExtension
                        ? "You can only request extra time once per quiz"
                        : undefined
                    }
                  >
                    {extensionLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Need more time?
                  </Button>
                  {showExtensionTooltip ? (
                    <p className="absolute right-0 top-full z-20 mt-1 max-w-[220px] rounded-md border bg-popover px-2 py-1 text-[10px] text-popover-foreground shadow-sm">
                      You can only request extra time once per quiz
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            {extensionNotice ? (
              <div
                className={cn(
                  "max-w-sm rounded-md border px-2.5 py-1.5 text-[11px] leading-snug",
                  extensionNotice.granted > 0
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                )}
                role="status"
              >
                <p className="flex items-start gap-1.5">
                  {extensionNotice.granted > 0 ? (
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  <span>
                    {extensionNotice.granted > 0
                      ? `AI granted you ${grantedMinutes} extra minute${grantedMinutes === 1 ? "" : "s"}. Reason: ${extensionNotice.reason}`
                      : `No extra time granted. Reason: ${extensionNotice.reason}`}
                  </span>
                </p>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {answered} of {questions.length} questions answered
              {unanswered > 0
                ? ` · ${unanswered} skipped (OK to submit)`
                : ""}
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          You do not need to answer every question. Leave any question blank and
          submit when you are ready — skipped questions are marked incorrect.
        </p>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting || showSubmitConfirm}
            >
              {isSubmitting ? "Submitting…" : "Submit paper"}
            </Button>
          </div>
          {showSubmitConfirm ? (
            <div className="max-w-md rounded-lg border bg-muted/30 p-4 shadow-sm">
              <h3 className="text-sm font-semibold">Submit your paper?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You have answered {answered} of {questions.length} questions.
                {unanswered > 0
                  ? ` ${unanswered} question${unanswered === 1 ? " was" : "s were"} not attempted and will be marked incorrect. You can still submit.`
                  : " All questions have an answer."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                >
                  Yes, submit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSubmitConfirm(false)}
                  disabled={isSubmitting}
                >
                  Keep working
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          {sections.map(({ section, questions: sectionQuestions }) => {
            const meta = SECTION_LABELS[section];
            const marks = sectionMarks(section, sectionQuestions.length);
            return (
              <section key={section} className="space-y-4">
                <h2 className="text-lg font-bold">
                  Section {meta.letter} — {meta.title} ({marks}{" "}
                  {marks === 1 ? "mark" : "marks"})
                </h2>
                <div className="space-y-4">
                  {sectionQuestions.map((q) => {
                    questionNumber += 1;
                    const num = questionNumber;
                    return (
                      <PaperQuestionCard
                        key={q.id}
                        question={q}
                        questionNumber={num}
                        marks={MARKS_PER_TYPE[section]}
                        value={answers[q.id] ?? ""}
                        onChange={(v) => handleAnswerChange(q, v)}
                        aiDetection={aiDetectionResults[q.id] ?? null}
                        aiDetectionLoading={aiDetectionLoading[q.id] ?? false}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="flex flex-col items-center gap-3 border-t pt-6 pb-4">
            <p className="text-center text-xs text-muted-foreground">
              Finished or stuck on a question? Submit now — unanswered items
              count as incorrect.
            </p>
            <Button
              type="button"
              size="lg"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={isSubmitting || showSubmitConfirm}
            >
              {isSubmitting ? "Submitting…" : "Submit paper"}
            </Button>
            {onCancelPaper ? (
              <Button
                type="button"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isSubmitting}
              >
                Cancel paper (score answered only)
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCancelConfirm && onCancelPaper ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Close dialog"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelConfirm(false)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18 }}
              className="relative z-10 w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <AlertTriangle className="h-6 w-6" aria-hidden />
                </div>
                <h2 className="mt-4 text-lg font-semibold">Cancel this paper?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  If you cancel now, only the questions you have answered will be
                  scored. Unanswered questions will not be included in your result.
                  Your partial result will still be saved to your quiz history.
                </p>
                <div className="mt-4 w-full rounded-lg bg-muted/50 px-4 py-3 text-sm">
                  <p>Answered: {answered} questions</p>
                  <p className="text-muted-foreground">
                    Unanswered: {unanswered} questions
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  className="bg-amber-600 text-white hover:bg-amber-700"
                  onClick={handleConfirmCancel}
                  disabled={isSubmitting}
                >
                  Cancel and see my results
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isSubmitting}
                >
                  Go back to paper
                </Button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
