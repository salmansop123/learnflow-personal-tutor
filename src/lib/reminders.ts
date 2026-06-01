import { serverApiFetch } from "@/lib/api-server";
import type { ReminderRow } from "@/types/study";

export type DueReminderRow = {
  id: string;
  title: string;
  body: string | null;
  scheduledAt: string;
  userEmail: string;
  userName: string | null;
};

export async function listReminders(userId: string): Promise<ReminderRow[]> {
  return serverApiFetch<ReminderRow[]>("/reminders", userId);
}

export async function createReminder(
  userId: string,
  data: {
    title: string;
    body?: string | null;
    scheduledAt: string;
    type?: string;
  }
): Promise<ReminderRow> {
  return serverApiFetch<ReminderRow>("/reminders", userId, {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      body: data.body ?? null,
      scheduledAt: data.scheduledAt,
      type: data.type ?? "STUDY",
    }),
  });
}

function getCronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("CRON_SECRET is not configured");
  }
  return secret;
}

function cronHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getCronSecret()}`,
  };
}

export async function fetchDueReminders(): Promise<DueReminderRow[]> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const res = await fetch(`${base}/api/v1/cron/reminders/due`, {
    headers: cronHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch due reminders (${res.status})`);
  }
  return res.json() as Promise<DueReminderRow[]>;
}

export async function deleteReminder(
  userId: string,
  reminderId: string
): Promise<void> {
  await serverApiFetch(`/reminders/${reminderId}`, userId, {
    method: "DELETE",
  });
}

export async function markReminderSent(reminderId: string): Promise<void> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const res = await fetch(
    `${base}/api/v1/cron/reminders/${reminderId}/sent`,
    {
      method: "POST",
      headers: cronHeaders(),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to mark reminder sent (${res.status})`);
  }
}
