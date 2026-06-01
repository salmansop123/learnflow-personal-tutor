import { handleRouteError } from "@/lib/api-route";
import { serverApiFetch } from "@/lib/api-server";
import { requireUserId } from "@/lib/notes-auth";
import type { SubjectTotalStats } from "@/types/study";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    const date = new URL(req.url).searchParams.get("date") ?? undefined;
    const stats = await serverApiFetch<SubjectTotalStats[]>(
      date ? `/study/stats?date=${encodeURIComponent(date)}` : "/study/stats",
      userId
    );
    return Response.json(stats);
  } catch (error) {
    return handleRouteError(error);
  }
}
