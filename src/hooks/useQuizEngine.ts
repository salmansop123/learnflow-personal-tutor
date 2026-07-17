"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "@/lib/toast";
import { computeQuizResults, type QuizResultsSummary } from "@/lib/quiz-results";
import { saveQuizAttemptClient } from "@/lib/quiz";
import { totalTimeLimitSeconds } from "@/lib/quiz-paper";
import type {
  Question,
  QuestionResult,
  QuizAttemptPayload,
  QuizEndOptions,
  QuizPhase,
  QuizSetupConfig,
} from "@/types/quiz";

export function useQuizEngine() {
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [config, setConfig] = useState<QuizSetupConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [quizSummary, setQuizSummary] = useState<QuizResultsSummary | null>(null);
  const [aiDetectionResults, setAiDetectionResults] = useState<
    Record<string, { aiProbability: number; confidence: string } | null>
  >({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAttemptId, setSavedAttemptId] = useState<string | null>(null);
  const [timeTakenSeconds, setTimeTakenSeconds] = useState(0);
  const startedAtRef = useRef<number>(Date.now());
  const endingRef = useRef(false);
  const endQuizRef = useRef<(options?: QuizEndOptions) => void>(() => {});

  const scoreSummary = useCallback(() => {
    if (quizSummary) {
      return {
        correct: quizSummary.correct,
        total: quizSummary.totalScored,
        score: quizSummary.score,
      };
    }
    const correct = results.filter((r) => r.isCorrect).length;
    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, score };
  }, [quizSummary, results, questions.length]);

  const persistQuizAttempt = useCallback(
    (payload: QuizAttemptPayload, opts?: { timedOut?: boolean }) => {
      setIsSaving(true);
      void saveQuizAttemptClient(payload)
        .then((attempt) => {
          setSavedAttemptId(attempt.id);
          if (!opts?.timedOut) {
            toast.success("Quiz attempt saved.");
          }
        })
        .catch((e) => {
          setError(
            e instanceof Error ? e.message : "Failed to save quiz attempt"
          );
        })
        .finally(() => {
          setIsSaving(false);
        });
    },
    []
  );

  const endQuiz = useCallback(
    (options?: QuizEndOptions) => {
      if (questions.length === 0 || endingRef.current) return;
      endingRef.current = true;

      if (options?.timedOut) {
        toast.info("Time's up! Your paper has been submitted automatically.");
      }

      try {
        const { results: computedResults, summary } = computeQuizResults(
          questions,
          answers,
          { partial: options?.partial }
        );

        const timeTaken = Math.round((Date.now() - startedAtRef.current) / 1000);

        setResults(computedResults);
        setQuizSummary(summary);
        setAiDetectionResults(options?.aiDetectionResults ?? {});
        setTimeTakenSeconds(timeTaken);
        setError(null);
        setPhase("results");

        const payload: QuizAttemptPayload = {
          subject: config?.subject ?? "General",
          topic: config?.topic ?? null,
          difficulty: config?.difficulty ?? "medium",
          totalQuestions: summary.total,
          correctAnswers: summary.correct,
          score: summary.score,
          timeTaken,
          isPartial: summary.isPartial,
          partialReason: summary.partialReason,
          sectionBreakdownJson: JSON.stringify(summary.sectionBreakdown),
          questionsJson: JSON.stringify({
            config,
            questions,
            answers,
            results: computedResults,
            summary,
            aiDetectionResults: options?.aiDetectionResults ?? {},
          }),
        };

        persistQuizAttempt(payload, { timedOut: options?.timedOut });
      } catch (e) {
        endingRef.current = false;
        setIsSaving(false);
        const message =
          e instanceof Error ? e.message : "Failed to submit quiz";
        setError(message);
        toast.error(message);
      }
    },
    [questions, answers, config, persistQuizAttempt]
  );

  endQuizRef.current = endQuiz;

  useEffect(() => {
    if (phase !== "active" || questions.length === 0) return;

    const totalTime = totalTimeLimitSeconds(questions);
    setTimeLeft(totalTime);

    const interval = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(interval);
          endQuizRef.current({ timedOut: true });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, questions]);

  const answerQuestion = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const addTimeExtension = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setTimeLeft((t) => t + seconds);
  }, []);

  const startQuiz = useCallback(async (setup: QuizSetupConfig) => {
    setConfig(setup);
    setPhase("loading");
    setError(null);
    setQuestions([]);
    setAnswers({});
    setResults([]);
    setQuizSummary(null);
    setAiDetectionResults({});
    setSavedAttemptId(null);
    endingRef.current = false;
    startedAtRef.current = Date.now();

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: setup.subject,
          topic: setup.topic,
          difficulty: setup.difficulty,
          questionCounts: setup.questionCounts,
          referenceContext: setup.referenceContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const payload = err as { error?: string; message?: string };
        throw new Error(
          payload.message ?? payload.error ?? "Failed to generate quiz"
        );
      }

      const data = (await res.json()) as { questions: Question[] };
      if (!data.questions?.length) {
        throw new Error("No questions generated");
      }

      setQuestions(data.questions);
      setPhase("active");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz");
      setPhase("setup");
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("setup");
    setConfig(null);
    setQuestions([]);
    setAnswers({});
    setResults([]);
    setQuizSummary(null);
    setAiDetectionResults({});
    setTimeLeft(0);
    setError(null);
    setSavedAttemptId(null);
    setIsSaving(false);
    setTimeTakenSeconds(0);
    endingRef.current = false;
  }, []);

  return {
    phase,
    config,
    questions,
    answers,
    results,
    quizSummary,
    aiDetectionResults,
    timeLeft,
    error,
    isSaving,
    savedAttemptId,
    timeTakenSeconds,
    scoreSummary,
    startQuiz,
    answerQuestion,
    addTimeExtension,
    endQuiz,
    reset,
  };
}
