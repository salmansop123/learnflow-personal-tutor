import { z } from "zod";

import { handleRouteError } from "@/lib/api-route";
import { serverApiFetch } from "@/lib/api-server";
import { requireUserId } from "@/lib/notes-auth";
import { getProfile } from "@/lib/profile";
import { normalizeSubjects } from "@/lib/subject-normalizer";
import type { StudySessionRow } from "@/types/study";

const createSessionSchema = z.object({
  subjects: z
    .array(z.string().min(1).max(120))
    .min(1, { message: "Please enter at least one subject" }),
  notes: z.string().max(2000).nullable().optional(),
});

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const showDeleted =
      new URL(req.url).searchParams.get("deleted") === "true";
    const path = showDeleted
      ? "/study/sessions?deleted=true"
      : "/study/sessions";
    const sessions = await serverApiFetch<StudySessionRow[]>(path, userId);
    return Response.json(sessions);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const raw = await req.json();
    const body = createSessionSchema.parse(raw);

    const profile = await getProfile(userId).catch(() => null);
    const profileSubjects = profile?.subjectNames ?? [];
    const normalizedSubjects = normalizeSubjects(body.subjects, profileSubjects);

    const session = await serverApiFetch<StudySessionRow>("/study/sessions", userId, {
      method: "POST",
      body: JSON.stringify({
        subjects: normalizedSubjects,
        notes: body.notes ?? null,
      }),
    });

    return Response.json(session, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
