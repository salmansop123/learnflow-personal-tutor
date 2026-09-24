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
  const path = qs ? `/admin/users?${qs}` : "/admin/users";

  try {
    const data = await adminBackendFetch(path, adminSession.email);
    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load users",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { userId?: string; plan?: string };
    if (!body.userId || !body.plan) {
      return Response.json(
        { error: "userId and plan are required" },
        { status: 400 }
      );
    }

    const updated = await adminBackendFetch<{
      id: string;
      email: string;
      plan: string;
      oldPlan?: string;
    }>(`/admin/users/${body.userId}/plan`, adminSession.email, {
      method: "PATCH",
      body: JSON.stringify({ plan: body.plan }),
    });

    const meta = getRequestMeta(request);
    await logAdminAction(adminSession.email, "UPDATE_USER_PLAN", {
      targetType: "user",
      targetId: body.userId,
      details: `Plan changed from ${updated.oldPlan ?? "?"} to ${updated.plan}`,
      ...meta,
    });

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update plan",
      },
      { status: 500 }
    );
  }
}
