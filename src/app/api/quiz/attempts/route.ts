import { z } from "zod";

import { handleRouteError, jsonError } from "@/lib/api-route";
import { requireUserId } from "@/lib/notes-auth";
import { saveQuizAttempt } from "@/lib/quiz";
import type { QuizAttemptPayload } from "@/types/quiz";

const quizAttemptSchema = z.object({
  subject: z.string().min(1).max(120),
  topic: z.string().max(200).nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  totalQuestions: z.number().int().min(1),
  correctAnswers: z.number().int().min(0),
  score: z.number().min(0).max(100),
  timeTaken: z.number().int().min(0),
  questionsJson: z.string().min(1),
  isPartial: z.boolean().optional(),
  partialReason: z.string().max(120).nullable().optional(),
  sectionBreakdownJson: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = quizAttemptSchema.parse(
      await req.json()
    ) as QuizAttemptPayload;
    const attempt = await saveQuizAttempt(userId, parsed);
    return Response.json(attempt, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
