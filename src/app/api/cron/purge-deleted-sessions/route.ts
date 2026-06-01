import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-route";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const { searchParams } = new URL(req.url);
  return searchParams.get("secret") === secret;
}

/**
 * Vercel Cron (daily) permanently removes study sessions soft-deleted
 * more than 30 days ago. See vercel.json.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured", removed: 0 },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `${base}/api/v1/cron/purge-deleted-sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Purge failed (${res.status})`);
    }
    const data = (await res.json()) as { removed: number };
    return NextResponse.json({ removed: data.removed ?? 0 });
  } catch (error) {
    const res = handleRouteError(error);
    const body = (await res.json()) as { error?: string };
    return NextResponse.json(
      { error: body.error ?? "Cron failed", removed: 0 },
      { status: res.status }
    );
  }
}
