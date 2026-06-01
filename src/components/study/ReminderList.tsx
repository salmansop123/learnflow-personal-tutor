"use client";

import { format } from "date-fns";
import { Bell, Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteReminderAction } from "@/app/dashboard/study/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { toast, toastError } from "@/lib/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReminderRow } from "@/types/study";

function parseScheduledAt(iso: string): Date {
  const trimmed = iso.trim();
  const hasOffset =
    trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed);
  const normalized = hasOffset
    ? trimmed.includes("T")
      ? trimmed
      : trimmed.replace(" ", "T")
    : `${trimmed.replace(" ", "T")}Z`;
  return new Date(normalized);
}

export function ReminderList({ reminders }: { reminders: ReminderRow[] }) {
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pending = reminders.filter((r) => !r.sent);
  const sent = reminders.filter((r) => r.sent);
  const confirmReminder = reminders.find((r) => r.id === confirmId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reminders</CardTitle>
          <CardDescription>
            {pending.length} scheduled · {sent.length} sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No reminders yet"
              description="Schedule a study nudge above and we will email you when it is due."
              className="py-6"
            />
          ) : (
            <ul className="space-y-2">
              {reminders.map((reminder) => {
                const scheduled = parseScheduledAt(reminder.scheduledAt);
                return (
                  <li
                    key={reminder.id}
                    className="group flex items-start gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:border-border hover:bg-muted/30"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        reminder.sent ? "stat-icon-green" : "stat-icon-blue"
                      )}
                    >
                      {reminder.sent ? (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Bell className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{reminder.title}</p>
                      {reminder.body ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {reminder.body}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground capitalize">
                        {reminder.type.toLowerCase()} ·{" "}
                        {format(scheduled, "MMM d, h:mm a")}
                        {reminder.sent ? " · Sent" : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={isPending}
                      className="opacity-70 transition-opacity group-hover:opacity-100"
                      onClick={() => setConfirmId(reminder.id)}
                      aria-label="Delete reminder"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete reminder?"
        description={
          confirmReminder
            ? `Are you sure you want to delete "${confirmReminder.title}"? You will not receive an email for this reminder.`
            : "Are you sure you want to delete this reminder?"
        }
        confirmLabel="Delete reminder"
        isLoading={isPending}
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (!confirmId) return;
          startTransition(async () => {
            try {
              await deleteReminderAction(confirmId);
              setConfirmId(null);
              toast.success("Reminder deleted");
              router.refresh();
            } catch (err) {
              toastError(err, "Failed to delete reminder");
            }
          });
        }}
      />
    </>
  );
}
