import { NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api-route";
import { sendReminderEmail } from "@/lib/email";
import { fetchDueReminders, markReminderSent } from "@/lib/reminders";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const { searchParams } = new URL(req.url);
  return searchParams.get("secret") === secret;
}

/**
 * Vercel Cron invokes GET on this route every 5 minutes (see vercel.json).
 * Sends due reminders via Resend and marks them sent in the database.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service is not configured", processed: 0 },
      { status: 503 }
    );
  }

  const dashboardUrl =
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000/dashboard";

  try {
    const due = await fetchDueReminders();
    let processed = 0;
    let failed = 0;

    for (const reminder of due) {
      try {
        await sendReminderEmail(reminder.userEmail, {
          name: reminder.userName ?? "Student",
          title: reminder.title,
          body: reminder.body ?? undefined,
          link: dashboardUrl.startsWith("http")
            ? dashboardUrl
            : `https://${dashboardUrl}`,
        });
        await markReminderSent(reminder.id);
        processed += 1;
      } catch (err) {
        console.error(`Failed to process reminder ${reminder.id}:`, err);
        failed += 1;
      }
    }

    return NextResponse.json({
      processed,
      failed,
      total: due.length,
    });
  } catch (error) {
    const res = handleRouteError(error);
    const body = await res.json();
    return NextResponse.json(
      { error: body.error ?? "Cron failed", processed: 0 },
      { status: res.status }
    );
  }
}
