import { z } from "zod";

import { handleRouteError, parseJsonBody } from "@/lib/api-route";
import { serverApiFetch } from "@/lib/api-server";
import { requireUserId } from "@/lib/notes-auth";
import { getProfile } from "@/lib/profile";
import { normalizeSubjectName } from "@/lib/subject-normalizer";
import type { StudySessionRow } from "@/types/study";

const patchSessionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("end"),
    endedAt: z.string().optional(),
    durationMins: z.number().int().min(1),
    notes: z.string().max(2000).nullable().optional(),
  }),
  z.object({
    action: z.literal("logTime"),
    subjectTimeLog: z.record(z.string(), z.number()),
  }),
  z.object({
    action: z.literal("restore"),
  }),
]);

export async function PATCH(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userId = await requireUserId();
    const body = await parseJsonBody(req, patchSessionSchema);

    let patchBody = body;
    if (body.action === "logTime") {
      const profile = await getProfile(userId).catch(() => null);
      const profileSubjects = profile?.subjectNames ?? [];
      const normalizedLog: Record<string, number> = {};
      for (const [subject, minutes] of Object.entries(body.subjectTimeLog)) {
        const normalized = normalizeSubjectName(subject, profileSubjects);
        normalizedLog[normalized] =
          (normalizedLog[normalized] ?? 0) + Math.max(0, Math.round(minutes));
      }
      patchBody = {
        action: "logTime",
        subjectTimeLog: normalizedLog,
      };
    }

    const session = await serverApiFetch<StudySessionRow>(
      `/study/sessions/${params.sessionId}`,
      userId,
      {
        method: "PATCH",
        body: JSON.stringify(patchBody),
      }
    );

    return Response.json(session);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userId = await requireUserId();
    const url = new URL(req.url);
    const permanent = url.searchParams.get("permanent") === "true";
    const reason = url.searchParams.get("reason");

    const query = new URLSearchParams();
    if (permanent) query.set("permanent", "true");
    if (reason) query.set("reason", reason);
    const qs = query.toString();

    const result = await serverApiFetch<StudySessionRow | null>(
      `/study/sessions/${params.sessionId}${qs ? `?${qs}` : ""}`,
      userId,
      { method: "DELETE" }
    );

    if (result === null) {
      return Response.json({ ok: true });
    }
    return Response.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
