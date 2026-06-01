import { z } from "zod";

import { handleRouteError } from "@/lib/api-route";
import { serverApiFetch } from "@/lib/api-server";
import { requireUserId } from "@/lib/notes-auth";
import { normalizeSubjectName, normalizeSubjects } from "@/lib/subject-normalizer";

const mergeSchema = z.object({
  from: z.array(z.string().min(1).max(120)).min(1),
  into: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = mergeSchema.parse(await req.json());

    const into = normalizeSubjectName(body.into, []);
    const from = body.from
      .map((name) => name.trim())
      .filter((name) => name.toLowerCase() !== into.toLowerCase());
    const uniqueFrom = normalizeSubjects(from, []).filter(
      (name) => name.toLowerCase() !== into.toLowerCase()
    );

    if (uniqueFrom.length === 0) {
      return Response.json(
        { error: "No source subjects to merge" },
        { status: 400 }
      );
    }

    const result = await serverApiFetch<{
      sessionsUpdated: number;
      message: string;
    }>("/study/subjects/merge", userId, {
      method: "POST",
      body: JSON.stringify({ from: uniqueFrom, into }),
    });

    return Response.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
