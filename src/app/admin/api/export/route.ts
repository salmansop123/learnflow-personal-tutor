import {
  getAdminSession,
  getRequestMeta,
  logAdminAction,
} from "@/lib/admin-auth";

/** Log CSV export action from the users page. */
export async function POST(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meta = getRequestMeta(request);
  let count = 0;
  try {
    const body = (await request.json()) as { count?: number };
    count = body.count ?? 0;
  } catch {
    /* ignore */
  }

  await logAdminAction(adminSession.email, "EXPORT_USERS_CSV", {
    details: `Exported ${count} users to CSV`,
    ...meta,
  });

  return Response.json({ success: true });
}
