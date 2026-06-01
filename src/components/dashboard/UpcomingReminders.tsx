import { format } from "date-fns";
import Link from "next/link";
import { Bell } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UpcomingReminderRow } from "@/types/dashboard";

export function UpcomingReminders({
  reminders,
}: {
  reminders: UpcomingReminderRow[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Upcoming reminders</CardTitle>
          <CardDescription>Scheduled study nudges</CardDescription>
        </div>
        <Link
          href="/dashboard/study"
          className="text-sm font-medium text-primary hover:underline"
        >
          Manage
        </Link>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No upcoming reminders"
            description="Schedule a study nudge and we will email you when it is due."
            actionLabel="Set a reminder"
            actionHref="/dashboard/study"
            className="py-8"
          />
        ) : (
          <ul className="space-y-3">
            {reminders.map((reminder) => (
              <li
                key={reminder.id}
                className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
              >
                <Bell
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{reminder.title}</p>
                  {reminder.body ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {reminder.body}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground capitalize">
                    {reminder.type.toLowerCase()} ·{" "}
                    {format(new Date(reminder.scheduledAt), "MMM d, h:mm a")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
