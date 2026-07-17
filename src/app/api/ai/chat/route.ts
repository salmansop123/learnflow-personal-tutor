import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { handleRouteError } from "@/lib/api-route";
import {
  extractTextFromUIMessage,
  findLastUserMessage,
} from "@/lib/ai-messages";
import { buildAISystemPrompt } from "@/lib/ai-context";
import {
  AiUsageLimitError,
  consumeAiUsage,
  usageLimitResponse,
} from "@/lib/ai-usage";
import { appendConversationMessages } from "@/lib/conversations";
import { getTutorModel } from "@/lib/openrouter";
import { getProfile } from "@/lib/profile";
import {
  normalizeSubjectList,
  parseTutorSubjects,
} from "@/lib/tutor-subjects";

export const maxDuration = 60;

const uiMessagePartSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough();

const uiMessageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system"]),
    parts: z.array(uiMessagePartSchema).optional(),
  })
  .passthrough();

const bodySchema = z.object({
  messages: z.array(uiMessageSchema).min(1),
  conversationId: z.string().min(1).optional(),
  subject: z.string().max(500).optional(),
  subjects: z.array(z.string().max(120)).max(12).optional(),
  educationLevel: z.string().max(80).optional(),
  educationTier: z.string().max(40).nullable().optional(),
  educationArchetype: z.string().max(40).nullable().optional(),
  documentContext: z.string().max(32_000).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = bodySchema.parse(raw);
    const messages = body.messages as UIMessage[];

    try {
      await consumeAiUsage(session.user!.id, "chat");
    } catch (err) {
      if (err instanceof AiUsageLimitError) {
        return usageLimitResponse(err);
      }
      throw err;
    }

    const profile = await getProfile(session.user!.id);
    const modelMessages = await convertToModelMessages(messages);

    const subjects = normalizeSubjectList(
      body.subjects ?? parseTutorSubjects(body.subject)
    );
    let system = buildAISystemPrompt(profile, {
      subjects: subjects.length > 0 ? subjects : undefined,
      subject: subjects.length > 0 ? subjects.join(", ") : body.subject,
    });
    if (body.documentContext?.trim()) {
      system += `\n\n## Uploaded document context\nUse the following extracted text to answer the student's questions. Reference specific parts when helpful.\n\n${body.documentContext.trim()}`;
    }

    const lastUser = findLastUserMessage(messages);
    const userContent = lastUser ? extractTextFromUIMessage(lastUser) : "";

    if (body.conversationId && userContent) {
      try {
        await appendConversationMessages(session.user!.id, body.conversationId, [
          { role: "user", content: userContent },
        ]);
      } catch (err) {
        console.error("Failed to persist user message:", err);
      }
    }

    const result = streamText({
      model: getTutorModel(),
      system,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        if (!body.conversationId || !text?.trim()) return;

        try {
          await appendConversationMessages(session.user!.id, body.conversationId, [
            { role: "assistant", content: text },
          ]);
        } catch (err) {
          console.error("Failed to persist assistant message:", err);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const res = handleRouteError(error);
    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
