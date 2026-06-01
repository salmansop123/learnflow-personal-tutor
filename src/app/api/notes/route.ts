import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-route";
import { ApiRequestError } from "@/lib/api-server";
import { requireUserId } from "@/lib/notes-auth";
import { createNote, getNote, listNotes } from "@/lib/notes";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().max(100000).optional().default(""),
  subject: z.string().max(120).optional().nullable(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  pinnedFrom: z.string().optional().nullable(),
  fileUrl: z.string().max(2000).optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("id");

    if (noteId) {
      try {
        const note = await getNote(userId, noteId);
        return Response.json(note);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) {
          return Response.json({ error: "Not found" }, { status: 404 });
        }
        throw error;
      }
    }

    const notes = await listNotes(userId, {
      q: searchParams.get("q") ?? undefined,
      subject: searchParams.get("subject") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
    });
    return Response.json(notes);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, createSchema);
    const note = await createNote(userId, {
      ...body,
      content: body.content ?? "",
    });
    return Response.json(note, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
