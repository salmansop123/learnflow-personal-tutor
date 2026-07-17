import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-route";
import { getApiUrl } from "@/lib/api";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const { searchParams } = new URL(req.url);
  return searchParams.get("secret") === secret;
}

/**
 * Reset daily AI chat counters. Schedule hourly so timezone edges are covered.
 * Lazy resets also run on each usage check.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const secret = process.env.CRON_SECRET!;
    const res = await fetch(getApiUrl("/cron/ai-usage/reset-daily"), {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: "Reset failed", details: data },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return handleRouteError(error);
  }
}
