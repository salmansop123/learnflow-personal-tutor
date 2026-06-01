"use client";

import { format, formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast, toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { StudySessionRow } from "@/types/study";

function formatSessionDate(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return iso;
  }
}

function sessionSubjectPills(session: StudySessionRow): string[] {
  if (session.subjects?.length) return session.subjects;
  if (session.subject) return [session.subject];
  return [];
}

function DeletedSessionCard({
  session,
  onRemoved,
  onRestoreFailed,
  onPermanentDeleteFailed,
}: {
  session: StudySessionRow;
  onRemoved: (id: string) => void;
  onRestoreFailed: (session: StudySessionRow) => void;
  onPermanentDeleteFailed: (session: StudySessionRow) => void;
}) {
  const router = useRouter();
  const [confirmPermanent, setConfirmPermanent] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const pills = sessionSubjectPills(session);
  const deletedAtLabel = session.deletedAt
    ? `Deleted ${formatDistanceToNow(new Date(session.deletedAt), { addSuffix: true })}`
    : "Deleted recently";

  async function handleRestore() {
    setIsRestoring(true);
    onRemoved(session.id);
    try {
      const res = await fetch(`/api/study/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to restore session");
      }
      toast.success("Session restored successfully");
      router.refresh();
    } catch (err) {
      onRestoreFailed(session);
      toastError(err, "Failed to restore session");
    } finally {
      setIsRestoring(false);
    }
  }

  async function handlePermanentDelete() {
    setIsDeleting(true);
    onRemoved(session.id);
    try {
      const res = await fetch(
        `/api/study/sessions/${session.id}?permanent=true`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to delete session");
      }
      toast.success("Session permanently deleted");
      router.refresh();
    } catch (err) {
      onPermanentDeleteFailed(session);
      toastError(err, "Failed to permanently delete session");
    } finally {
      setIsDeleting(false);
      setConfirmPermanent(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-[#FFF5F5] p-4 sm:flex-row sm:items-start sm:justify-between dark:border-red-900/40 dark:bg-red-950/20">
        <div
          className="min-w-0 border-l-4 border-[#EF4444] pl-3"
          style={{ borderLeftWidth: 4 }}
        >
          <div className="flex flex-wrap gap-1.5">
            {pills.map((name) => (
              <span
                key={name}
                className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            {formatSessionDate(session.startedAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            {session.durationMins != null
              ? `${session.durationMins} minutes`
              : "Session not completed"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{deletedAtLabel}</p>
          {session.deleteReason ? (
            <p className="mt-1 text-xs italic text-slate-500">
              Reason: {session.deleteReason}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"
            disabled={isRestoring || isDeleting}
            onClick={handleRestore}
          >
            {isRestoring ? "Restoring…" : "Restore"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400"
            disabled={isRestoring || isDeleting}
            onClick={() => setConfirmPermanent(true)}
          >
            Delete permanently
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmPermanent}
        title="Delete permanently?"
        description="Are you sure? This will permanently delete this session and cannot be undone."
        confirmLabel="Yes, delete permanently"
        isLoading={isDeleting}
        onCancel={() => setConfirmPermanent(false)}
        onConfirm={handlePermanentDelete}
      />
    </>
  );
}

export function DeletedSessionsPanel({
  deletedSessions: initialDeleted,
}: {
  deletedSessions: StudySessionRow[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [deletedSessions, setDeletedSessions] =
    useState<StudySessionRow[]>(initialDeleted);

  useEffect(() => {
    setDeletedSessions(initialDeleted);
  }, [initialDeleted]);

  if (deletedSessions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-lg border border-dashed border-red-300 bg-[#FFF5F5] px-4 py-3 text-left transition-colors hover:bg-red-50/80 dark:border-red-800 dark:bg-red-950/20 dark:hover:bg-red-950/40"
        )}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-start gap-3">
          <Trash2
            className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
            aria-hidden
          />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Deleted Sessions ({deletedSessions.length})
            </p>
            <p className="text-xs text-muted-foreground">
              Sessions deleted in the last 30 days. Restore any session to move
              it back.
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-red-500 transition-transform",
            expanded && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="deleted-sessions-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-1">
              {deletedSessions.map((session) => (
                <DeletedSessionCard
                  key={session.id}
                  session={session}
                  onRemoved={(id) =>
                    setDeletedSessions((prev) =>
                      prev.filter((s) => s.id !== id)
                    )
                  }
                  onRestoreFailed={(restored) =>
                    setDeletedSessions((prev) =>
                      prev.some((s) => s.id === restored.id)
                        ? prev
                        : [restored, ...prev]
                    )
                  }
                  onPermanentDeleteFailed={(item) =>
                    setDeletedSessions((prev) =>
                      prev.some((s) => s.id === item.id)
                        ? prev
                        : [item, ...prev]
                    )
                  }
                />
              ))}
              <p className="text-center text-xs text-muted-foreground">
                Deleted sessions are automatically removed after 30 days.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
