import {
  adminBackendFetch,
  getAdminCredentials,
  getAdminSession,
  maskAdminEmail,
} from "@/lib/admin-auth";

export async function GET() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const backend = await adminBackendFetch<{
      dbStatus: string;
      tableCounts: Record<string, number>;
    }>("/admin/system", adminSession.email);

    const credentials = getAdminCredentials();
    const adminSlots = Array.from({ length: 10 }, (_, i) => {
      const slot = i + 1;
      const email = process.env[`ADMIN_EMAIL_${slot}`]?.trim() ?? "";
      const active = Boolean(email);
      return {
        slot,
        email: active ? maskAdminEmail(email) : null,
        status: active ? ("Active" as const) : ("Empty" as const),
      };
    });

    return Response.json({
      dbStatus: backend.dbStatus,
      adminCount: credentials.length,
      adminEmails: credentials.map((c) => c.email),
      envVarsPresent: {
        OPENROUTER_API_KEY: Boolean(process.env.OPENROUTER_API_KEY),
        RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
        ADMIN_SESSION_SECRET: Boolean(process.env.ADMIN_SESSION_SECRET),
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      tableCounts: backend.tableCounts,
      adminSlots,
      currentAdmin: adminSession.email,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load system",
      },
      { status: 500 }
    );
  }
}
