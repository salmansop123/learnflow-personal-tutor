import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-route";
import { requireUserId } from "@/lib/notes-auth";
import { createReminder, listReminders } from "@/lib/reminders";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(2000).optional().nullable(),
  scheduledAt: z.string().datetime({ offset: true }),
  type: z.enum(["STUDY", "QUIZ", "TASK", "CUSTOM"]).optional().default("STUDY"),
});

export async function GET() {
  try {
    const userId = await requireUserId();
    const reminders = await listReminders(userId);
    return Response.json(reminders);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, createSchema);
    const reminder = await createReminder(userId, body);
    return Response.json(reminder, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
