import {
  adminBackendFetch,
  getAdminSession,
  getRequestMeta,
  logAdminAction,
} from "@/lib/admin-auth";

type Params = { params: { id: string } };

export async function GET(request: Request, { params }: Params) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await adminBackendFetch(
      `/admin/users/${params.id}`,
      adminSession.email
    );

    const meta = getRequestMeta(request);
    await logAdminAction(adminSession.email, "VIEW_USER", {
      targetType: "user",
      targetId: params.id,
      details: "Opened user detail panel",
      ...meta,
    });

    return Response.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load user";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get("reason") ?? undefined;
    const qs = reason ? `?reason=${encodeURIComponent(reason)}` : "";

    const data = await adminBackendFetch(
      `/admin/users/${params.id}${qs}`,
      adminSession.email,
      { method: "DELETE" }
    );

    const meta = getRequestMeta(request);
    await logAdminAction(adminSession.email, "USER_BAN", {
      targetType: "user",
      targetId: params.id,
      details: reason ?? "User deactivated",
      ...meta,
    });

    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to deactivate user",
      },
      { status: 500 }
    );
  }
}
