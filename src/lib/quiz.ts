import { serverApiFetch } from "@/lib/api-server";
import type { QuizAttemptPayload } from "@/types/quiz";

export type SavedQuizAttempt = {
  id: string;
  subject: string;
  topic: string | null;
  difficulty: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeTaken: number | null;
  isPartial?: boolean;
  partialReason?: string | null;
  sectionBreakdownJson?: string | null;
  createdAt: string;
  questionsJson?: string | null;
};

export async function listQuizAttempts(
  userId: string
): Promise<SavedQuizAttempt[]> {
  return serverApiFetch<SavedQuizAttempt[]>("/quiz/attempts", userId);
}

export async function listQuizAttemptsForSubject(
  userId: string,
  subject: string,
  limit = 10
): Promise<SavedQuizAttempt[]> {
  const qs = new URLSearchParams({
    subject,
    limit: String(limit),
  });
  return serverApiFetch<SavedQuizAttempt[]>(
    `/quiz/attempts?${qs.toString()}`,
    userId
  );
}

export function extractPreviousQuestionTexts(
  attempts: Pick<SavedQuizAttempt, "questionsJson">[]
): string[] {
  const previousQuestions: string[] = [];
  for (const attempt of attempts) {
    if (!attempt.questionsJson) continue;
    try {
      const parsed = JSON.parse(attempt.questionsJson) as unknown;
      const questions = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" &&
            parsed !== null &&
            "questions" in parsed &&
            Array.isArray((parsed as { questions: unknown }).questions)
          ? (parsed as { questions: { question?: string }[] }).questions
          : [];
      for (const q of questions) {
        if (q?.question) previousQuestions.push(q.question);
      }
    } catch {
      continue;
    }
  }
  return previousQuestions;
}

export async function saveQuizAttempt(
  userId: string,
  data: QuizAttemptPayload
): Promise<SavedQuizAttempt> {
  return serverApiFetch<SavedQuizAttempt>("/quiz/attempts", userId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function clientQuizFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? "Failed to save quiz attempt"
    );
  }
  return data;
}

export async function saveQuizAttemptClient(
  data: QuizAttemptPayload
): Promise<SavedQuizAttempt> {
  return clientQuizFetch<SavedQuizAttempt>("/api/quiz/attempts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
