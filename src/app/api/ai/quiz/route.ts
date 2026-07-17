import { generateText } from "ai";
import { z } from "zod";

import { buildAISystemPrompt } from "@/lib/ai-context";
import { parseQuizJsonText } from "@/lib/quiz-parse";
import { handleRouteError, jsonError, parseJsonBody } from "@/lib/api-route";
import { consumeAiUsage } from "@/lib/ai-usage";
import { requireUserId } from "@/lib/notes-auth";
import { getQuizModel } from "@/lib/openrouter";
import { getProfile } from "@/lib/profile";
import {
  extractPreviousQuestionTexts,
  listQuizAttemptsForSubject,
} from "@/lib/quiz";
import { totalQuestionCount } from "@/lib/quiz-paper";
import type { QuizQuestionCounts } from "@/types/quiz";

const questionCountsSchema = z
  .object({
    mcq: z.number().int().min(1).max(30).optional(),
    fill_blank: z.number().int().min(1).max(20).optional(),
    short: z.number().int().min(1).max(10).optional(),
    long: z.number().int().min(1).max(5).optional(),
  })
  .refine(
    (counts) =>
      (counts.mcq ?? 0) +
        (counts.fill_blank ?? 0) +
        (counts.short ?? 0) +
        (counts.long ?? 0) >=
      1,
    { message: "At least one question type must have a count" }
  );

const requestSchema = z.object({
  subject: z.string().min(1).max(120),
  topic: z.string().max(200).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCounts: questionCountsSchema,
  referenceContext: z.string().max(32_000).optional(),
});

function buildSubjectTopicInstruction(subject: string, topic?: string): string {
  const trimmedTopic = topic?.trim();
  if (trimmedTopic) {
    return `Generate questions strictly about the subject: ${subject}.
Focus specifically on this topic within that subject: ${trimmedTopic}. Only generate questions that are directly relevant to this topic. Do not drift into other topics.`;
  }
  return `Generate questions strictly about the subject: ${subject}.
Cover a broad range of important concepts from ${subject} at the student's education level.`;
}

function buildSectionsInstruction(counts: QuizQuestionCounts): string {
  const lines: string[] = [
    "Generate the paper in exactly this structure with these exact counts:",
  ];

  if (counts.mcq) {
    lines.push(
      `- Multiple Choice Questions (MCQ): ${counts.mcq} questions. Each must have exactly 4 options labeled A, B, C, D. Only one correct answer.`
    );
  }
  if (counts.fill_blank) {
    lines.push(
      `- Fill in the Blank: ${counts.fill_blank} questions. Each question must contain exactly ONE blank marker written as three underscores: ___. Never use multiple ___ in the same question. Provide the correct word or phrase for that single blank.`
    );
  }
  if (counts.short) {
    lines.push(
      `- Short Answer Questions: ${counts.short} questions. Each requires a concise answer of 2-5 sentences.`
    );
  }
  if (counts.long) {
    lines.push(
      `- Long Answer / Essay Questions: ${counts.long} questions. Each requires a detailed answer of at least 2-3 paragraphs.`
    );
  }

  lines.push(
    "",
    "Generate ONLY the types listed above. Generate EXACTLY the number specified for each type. Do not add extra questions."
  );

  return lines.join("\n");
}

function buildNoRepeatBlock(previousQuestions: string[]): string {
  if (previousQuestions.length === 0) return "";
  const listed = previousQuestions
    .slice(0, 30)
    .map((q, i) => `${i + 1}. ${q}`)
    .join("\n");
  return `
IMPORTANT: The following questions have already been asked in previous quiz sessions for this subject. You MUST NOT repeat these questions or create any question that is semantically similar to them. Generate completely fresh questions that test different concepts, angles, or details:
${listed}`;
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    if (!process.env.OPENROUTER_API_KEY) {
      return jsonError("OPENROUTER_API_KEY is not configured", 503);
    }

    const body = await parseJsonBody(req, requestSchema);
    await consumeAiUsage(userId, "quiz");
    const profile = await getProfile(userId);
    const profileContext = buildAISystemPrompt(profile, {
      subject: body.subject,
    });

    const previousAttempts = await listQuizAttemptsForSubject(
      userId,
      body.subject,
      10
    );
    const previousQuestions = extractPreviousQuestionTexts(previousAttempts);

    const subjectTopicInstruction = buildSubjectTopicInstruction(
      body.subject,
      body.topic
    );
    const sectionsInstruction = buildSectionsInstruction(body.questionCounts);
    const noRepeatBlock = buildNoRepeatBlock(previousQuestions);
    const total = totalQuestionCount(body.questionCounts);

    const prompt = `${profileContext}

Generate exactly ${total} quiz questions as JSON, organized by section.

${subjectTopicInstruction}
Difficulty: ${body.difficulty}

${sectionsInstruction}
${body.referenceContext?.trim() ? `\nReference material (base questions on this content):\n${body.referenceContext.trim().slice(0, 24000)}` : "\nNo reference document was uploaded. Generate appropriate questions from the subject, topic, and student profile context."}
${noRepeatBlock}

Return ONLY valid JSON with this shape (no markdown):
{
  "questions": [
    {
      "id": "unique-string",
      "type": "mcq" | "fill_blank" | "short" | "concept" | "long",
      "section": "mcq" | "fill_blank" | "short" | "long",
      "question": "string",
      "options": ["A","B","C","D"],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "easy" | "medium" | "hard",
      "timeLimit": 60
    }
  ]
}

Rules:
- Each question object MUST include a "section" field matching its type (mcq, fill_blank, short, or long).
- For mcq, provide exactly 4 options and correctAnswer matching one option text.
- For fill_blank, short, long use options: [].
- For fill_blank: the "question" string must include exactly one ___ placeholder (not two or three).
- For long: multi-sentence theory/explanation questions; correctAnswer is a model answer paragraph; timeLimit 120-300.
- timeLimit is seconds per question (30-300).`;

    const { text } = await generateText({
      model: getQuizModel(),
      prompt,
    });

    const questions = parseQuizJsonText(text);
    return Response.json({ questions });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("Failed to parse quiz JSON from AI", 502);
    }
    return handleRouteError(error);
  }
}
