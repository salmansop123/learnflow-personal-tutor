import { generateText } from "ai";
import { z } from "zod";

import { handleRouteError, jsonError, parseJsonBody } from "@/lib/api-route";
import { auth } from "@/lib/auth";
import { getQuizModel } from "@/lib/openrouter";

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "fill_blank", "short", "concept", "long"]),
  question: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

type QuizQuestionSummary = z.infer<typeof questionSchema>;

const requestSchema = z.object({
  questions: z.array(questionSchema).min(1),
  currentTimeRemaining: z.number().int().min(0),
  extensionRequested: z.number().int().min(1).max(60),
});

const responseSchema = z.object({
  granted: z.number(),
  reason: z.string(),
});

function summarizeQuestions(questions: QuizQuestionSummary[]): string {
  return questions
    .map((q, i) => {
      const preview =
        q.question.length > 80
          ? `${q.question.slice(0, 80)}...`
          : q.question;
      return `Q${i + 1} (${q.type}, ${q.difficulty}): ${preview}`;
    })
    .join("\n");
}

function countByType(questions: QuizQuestionSummary[], types: string[]): number {
  return questions.filter((q) => types.includes(q.type)).length;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return jsonError("OPENROUTER_API_KEY is not configured", 503);
    }

    const body = await parseJsonBody(req, requestSchema);
    const shortCount = countByType(body.questions, ["short", "concept"]);
    const longCount = countByType(body.questions, ["long"]);

    const prompt = `You are a quiz time management agent. A student is taking a quiz and has requested more time.

Current time remaining: ${body.currentTimeRemaining} seconds
Time extension requested: ${body.extensionRequested} minutes

Quiz questions summary:
${summarizeQuestions(body.questions)}

Short answer questions: ${shortCount}
Long answer questions: ${longCount}

Your task: decide if the student genuinely needs more time based on the complexity of the remaining questions. Consider:
- How many short and long questions exist (these need more time)
- The difficulty level of the questions
- Whether ${body.currentTimeRemaining} seconds is reasonable for the remaining work

Rules you must follow:
- You may grant a maximum of 15 minutes (900 seconds) total extension regardless of what is requested
- If the current remaining time is already generous (more than 3 minutes per remaining unanswered question), grant 0 extra time
- If the questions are genuinely complex and time is short, grant between 1 and 15 minutes
- Return ONLY a JSON object with no markdown: { "granted": number (seconds), "reason": string (one sentence explaining your decision) }`;

    const { text } = await generateText({
      model: getQuizModel(),
      prompt,
    });

    const raw = JSON.parse(text.trim()) as unknown;
    const parsed = responseSchema.parse(raw);
    const granted = Math.max(0, Math.min(900, Math.round(parsed.granted)));

    return Response.json({
      granted,
      reason: parsed.reason.trim() || "No reason provided.",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("Failed to parse time extension response", 502);
    }
    return handleRouteError(error);
  }
}
