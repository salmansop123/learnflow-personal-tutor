import { auth } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ success: true });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return Response.json({ success: true });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  try {
    await fetch(getApiUrl("/auth/logout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "X-User-Id": session.user.id,
        "X-Forwarded-For": ip,
        "User-Agent": userAgent,
      },
    });
  } catch {
    /* never block sign-out */
  }

  return Response.json({ success: true });
}
