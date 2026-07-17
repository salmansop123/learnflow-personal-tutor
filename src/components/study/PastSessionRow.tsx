"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteStudySessionAction } from "@/app/dashboard/study/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, toastError } from "@/lib/toast";
import type { StudySessionRow } from "@/types/study";

function formatSessionDuration(mins: number | null): string {
  if (mins == null) return "—";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function PastSessionRow({ session }: { session: StudySessionRow }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const displaySubjects =
    session.subjects?.length > 0
      ? session.subjects.join(", ")
      : session.subject;

  return (
    <>
      <li className="group flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted/30">
        <span className="min-w-0 truncate font-medium">{displaySubjects}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-muted-foreground">
            {formatSessionDuration(session.durationMins)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => setConfirmOpen(true)}
            aria-label="Delete session"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </li>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isPending && setConfirmOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-session-title"
            className="relative z-10 w-full max-w-md rounded-xl border bg-card p-5 shadow-lg"
          >
            <h3
              id="delete-session-title"
              className="text-lg font-semibold text-foreground"
            >
              Delete this session?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The session will move to Deleted Sessions. You can restore it
              later.
            </p>
            <Input
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Add a reason (optional) e.g. 'Created by mistake'"
              className="mt-4"
              disabled={isPending}
            />
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setConfirmOpen(false);
                  setDeleteReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      await deleteStudySessionAction(
                        session.id,
                        deleteReason.trim() || null
                      );
                      setConfirmOpen(false);
                      setDeleteReason("");
                      toast.success("Session moved to Deleted Sessions");
                      router.refresh();
                    } catch (err) {
                      toastError(err, "Failed to delete session");
                    }
                  })
                }
              >
                {isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
