import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-route";
import { ApiRequestError } from "@/lib/api-server";
import { requireUserId } from "@/lib/notes-auth";
import { deleteNote, getNote, updateNote } from "@/lib/notes";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().max(100000).optional(),
  subject: z.string().max(120).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  fileUrl: z.string().max(2000).optional().nullable(),
  aiSummary: z.string().max(50000).optional().nullable(),
  aiSummaryGeneratedAt: z.string().datetime().optional().nullable(),
});

type RouteContext = { params: { id: string } };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const userId = await requireUserId();
    const note = await getNote(userId, params.id);
    return Response.json(note);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }
    return handleRouteError(error);
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, updateSchema);
    const note = await updateNote(userId, params.id, body);
    return Response.json(note);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }
    return handleRouteError(error);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const userId = await requireUserId();
    await deleteNote(userId, params.id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }
    return handleRouteError(error);
  }
}
