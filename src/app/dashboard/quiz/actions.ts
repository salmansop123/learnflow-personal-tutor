"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { saveQuizAttempt } from "@/lib/quiz";
import type { QuizAttemptPayload } from "@/types/quiz";

export async function saveQuizAttemptAction(data: QuizAttemptPayload) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const attempt = await saveQuizAttempt(session.user.id, data);
  revalidatePath("/dashboard/quiz");
  revalidatePath("/dashboard");
  return attempt;
}
