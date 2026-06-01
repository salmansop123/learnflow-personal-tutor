import { generateText } from "ai";
import { z } from "zod";

import { handleRouteError, jsonError, parseJsonBody } from "@/lib/api-route";
import { auth } from "@/lib/auth";
import { getQuizModel } from "@/lib/openrouter";

const requestSchema = z.object({
  text: z.string().min(50).max(32_000),
});

const responseSchema = z.object({
  aiProbability: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return jsonError("OPENROUTER_API_KEY is not configured", 503);
    }

    const { text } = await parseJsonBody(req, requestSchema);

    const prompt = `Analyze the following text and estimate the probability that it was written by an AI language model rather than a human student. Consider writing patterns, vocabulary sophistication, sentence structure variation, presence of hedging language, and naturalness of expression.

Text to analyze:
${text}

Return ONLY a JSON object with no markdown: { "aiProbability": number (0-100, integer), "confidence": "low" | "medium" | "high" }`;

    const { text: rawResponse } = await generateText({
      model: getQuizModel(),
      prompt,
    });

    const raw = JSON.parse(rawResponse.trim()) as unknown;
    const parsed = responseSchema.parse(raw);
    const aiProbability = Math.max(
      0,
      Math.min(100, Math.round(parsed.aiProbability))
    );

    return Response.json({
      aiProbability,
      confidence: parsed.confidence,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("Failed to parse AI detection response", 502);
    }
    return handleRouteError(error);
  }
}
