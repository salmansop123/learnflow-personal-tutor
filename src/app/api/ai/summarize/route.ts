import { streamText } from "ai";
import { z } from "zod";

import { buildAISystemPrompt } from "@/lib/ai-context";
import { handleRouteError, jsonError, parseJsonBody } from "@/lib/api-route";
import { requireUserId } from "@/lib/notes-auth";
import { getSummaryModel } from "@/lib/openrouter";
import { getProfile } from "@/lib/profile";

const bodySchema = z.object({
  content: z.string().min(1).max(50000),
  noteId: z.string().optional().nullable(),
  subject: z.string().max(120).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    if (!process.env.OPENROUTER_API_KEY) {
      return jsonError("OPENROUTER_API_KEY is not configured", 503);
    }

    const body = await parseJsonBody(req, bodySchema);
    const profile = await getProfile(userId);
    const profileContext = buildAISystemPrompt(profile, {
      subject: body.subject ?? undefined,
    });

    const prompt = `${profileContext}

Summarize the following study notes in clear bullet points. Keep key facts and definitions. Use the student's preferred language. Return only the summary text, no preamble.

${body.content}`;

    const result = streamText({
      model: getSummaryModel(),
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return handleRouteError(error);
  }
}
