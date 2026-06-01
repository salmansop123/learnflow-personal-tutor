import { generateText } from "ai";
import { z } from "zod";

import { handleRouteError, jsonError, parseJsonBody } from "@/lib/api-route";
import { auth } from "@/lib/auth";
import { getQuizModel } from "@/lib/openrouter";
import { buildValidationPrompt } from "@/lib/profile-change-utils";

const requestSchema = z.object({
  changes: z.record(z.string(), z.unknown()).refine(
    (c) => Object.keys(c).length > 0,
    { message: "At least one change is required" }
  ),
});

const fieldResultSchema = z.object({
  valid: z.boolean(),
  message: z.string(),
});

const responseSchema = z.object({
  valid: z.boolean(),
  fieldResults: z.record(z.string(), fieldResultSchema),
  summary: z.string(),
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

    const { changes } = await parseJsonBody(req, requestSchema);
    const prompt = buildValidationPrompt(changes);

    const { text } = await generateText({
      model: getQuizModel(),
      prompt,
    });

    const raw = JSON.parse(text.trim()) as unknown;
    const parsed = responseSchema.parse(raw);

    for (const field of Object.keys(changes)) {
      if (!parsed.fieldResults[field]) {
        parsed.fieldResults[field] = { valid: true, message: "" };
      }
    }

    const allValid = Object.values(parsed.fieldResults).every((r) => r.valid);
    return Response.json({
      valid: parsed.valid && allValid,
      fieldResults: parsed.fieldResults,
      summary: parsed.summary.trim(),
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError("Failed to parse validation response", 502);
    }
    return handleRouteError(error);
  }
}
