"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createReminderAction } from "@/app/dashboard/study/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast, toastError } from "@/lib/toast";

export function ReminderForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;

    const scheduled = new Date(scheduledAt);
    if (scheduled.getTime() <= Date.now()) {
      toast.error("Pick a future date and time.");
      return;
    }

    startTransition(async () => {
      try {
        await createReminderAction({
          title: title.trim(),
          body: body.trim() || undefined,
          scheduledAt: scheduled.toISOString(),
        });
        setTitle("");
        setBody("");
        setScheduledAt("");
        toast.success(
          "Reminder scheduled. You will receive an email when it is due."
        );
        router.refresh();
      } catch (err) {
        toastError(err, "Failed to save reminder");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Set reminder</CardTitle>
        <CardDescription>
          Schedule a study nudge we email you via Resend when it is due.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Reminder title"
            required
          />
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Optional message in email"
          />
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving…" : "Schedule reminder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
