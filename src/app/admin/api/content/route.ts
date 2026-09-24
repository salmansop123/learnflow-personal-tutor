import { adminBackendFetch, getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await adminBackendFetch("/admin/content", adminSession.email);
    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load content",
      },
      { status: 500 }
    );
  }
}
