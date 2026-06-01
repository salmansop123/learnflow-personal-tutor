import { auth } from "@/lib/auth";
import { handleRouteError, jsonError } from "@/lib/api-route";
import { serverApiFetch } from "@/lib/api-server";
import type { StudentProfile } from "@/types/profile";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Unauthorized", 401);
    }
    const profile = await serverApiFetch<StudentProfile>(
      "/profile/reset",
      session.user.id,
      { method: "POST" }
    );
    return Response.json(profile);
  } catch (error) {
    return handleRouteError(error);
  }
}
