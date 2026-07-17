import { auth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-route";
import { getAiUsage } from "@/lib/ai-usage";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }
    const usage = await getAiUsage(session.user.id);
    return Response.json(usage);
  } catch (error) {
    return handleRouteError(error);
  }
}
