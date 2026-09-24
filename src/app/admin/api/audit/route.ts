import {
  adminBackendFetch,
  getAdminSession,
  getRequestMeta,
  logAdminAction,
} from "@/lib/admin-auth";

export async function GET(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const path = qs ? `/admin/audit?${qs}` : "/admin/audit";

  try {
    const data = await adminBackendFetch(path, adminSession.email);

    const { searchParams: sp } = new URL(request.url);
    if (sp.get("logView") === "1") {
      const meta = getRequestMeta(request);
      await logAdminAction(adminSession.email, "VIEW_AUDIT_LOG", {
        details: "Viewed audit log",
        ...meta,
      });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load audit log",
      },
      { status: 500 }
    );
  }
}
