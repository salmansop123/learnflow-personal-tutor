import {
  adminBackendFetch,
  getAdminSession,
} from "@/lib/admin-auth";

export async function GET() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await adminBackendFetch<Record<string, unknown>>(
      "/admin/stats",
      adminSession.email
    );
    return Response.json(stats);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load stats",
      },
      { status: 500 }
    );
  }
}
