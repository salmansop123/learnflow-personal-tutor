"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearActiveSession } from "@/lib/active-study-session-storage";
import { toast, toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useStudyStore } from "@/store/useStudyStore";

function splitEvenly(totalMins: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(totalMins / count);
  const remainder = totalMins % count;
  return Array.from({ length: count }, (_, i) =>
    i < remainder ? base + 1 : base
  );
}

export function SubjectTimeLogModal() {
  const router = useRouter();
  const pathname = usePathname();
  const pendingTimeLog = useStudyStore((s) => s.pendingTimeLog);
  const pendingQueueLength = useStudyStore((s) => s.pendingTimeLogs.length);
  const dequeueNextPendingTimeLog = useStudyStore(
    (s) => s.dequeueNextPendingTimeLog
  );
  const [timeInputs, setTimeInputs] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!pendingTimeLog) {
      setTimeInputs({});
      return;
    }
    const initial: Record<string, number> = {};
    for (const subject of pendingTimeLog.subjects) {
      initial[subject] = 0;
    }
    setTimeInputs(initial);
  }, [pendingTimeLog]);

  const totalEntered = useMemo(
    () =>
      Object.values(timeInputs).reduce(
        (sum, value) => sum + (Number.isFinite(value) ? value : 0),
        0
      ),
    [timeInputs]
  );

  const durationMins = pendingTimeLog?.durationMins ?? 0;

  const totalColorClass =
    totalEntered === durationMins
      ? "text-emerald-600"
      : totalEntered < durationMins
        ? "text-amber-600"
        : "text-red-600";

  function dismissModal() {
    dequeueNextPendingTimeLog();
    clearActiveSession();
  }

  function handleSkip() {
    dismissModal();
  }

  function handleSplitEvenly() {
    if (!pendingTimeLog) return;
    const split = splitEvenly(
      pendingTimeLog.durationMins,
      pendingTimeLog.subjects.length
    );
    const next: Record<string, number> = {};
    pendingTimeLog.subjects.forEach((subject, index) => {
      next[subject] = split[index] ?? 0;
    });
    setTimeInputs(next);
  }

  function updateSubjectMinutes(subject: string, raw: string) {
    const parsed = raw === "" ? 0 : parseInt(raw, 10);
    const minutes = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
    setTimeInputs((prev) => ({
      ...prev,
      [subject]: Math.min(minutes, durationMins),
    }));
  }

  async function handleSave() {
    if (!pendingTimeLog) return;
    const payload: Record<string, number> = {};
    for (const [subject, minutes] of Object.entries(timeInputs)) {
      if (minutes > 0) payload[subject] = minutes;
    }
    if (Object.keys(payload).length === 0) return;

    setIsSaving(true);
    try {
      const res = await fetch(
        `/api/study/sessions/${pendingTimeLog.sessionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "logTime",
            subjectTimeLog: payload,
          }),
        }
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to save time breakdown");
      }
      dismissModal();
      toast.success(
        "Time breakdown saved! Your subject chart has been updated."
      );
      if (pathname === "/dashboard") {
        window.setTimeout(() => router.refresh(), 300);
      }
    } catch (err) {
      toastError(err, "Failed to save time breakdown");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {pendingTimeLog ? (
        <motion.div
          key={pendingTimeLog.sessionId}
          role="dialog"
          aria-modal="true"
          aria-labelledby="subject-time-log-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          style={{ pointerEvents: "auto" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 h-8 w-8 shrink-0 text-emerald-500"
                aria-hidden
              />
              <div>
                <h2
                  id="subject-time-log-title"
                  className="text-xl font-bold text-slate-900 dark:text-slate-100"
                >
                  Session Complete!
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You studied for {pendingTimeLog.durationMins} minutes. How did
                  you split your time?
                </p>
              </div>
            </div>

            {pendingQueueLength > 0 ? (
              <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                Another session is waiting.
              </p>
            ) : null}

            <div className="mt-6 space-y-3">
              {pendingTimeLog.subjects.map((subject) => (
                <div
                  key={subject}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0 flex-1 font-semibold text-slate-900 dark:text-slate-100">
                    {subject}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      max={durationMins}
                      value={timeInputs[subject] ?? 0}
                      onChange={(e) =>
                        updateSubjectMinutes(subject, e.target.value)
                      }
                      placeholder="0"
                      className="h-9 w-20 text-right tabular-nums"
                      disabled={isSaving}
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className={cn("text-sm font-medium tabular-nums", totalColorClass)}>
                Total entered: {totalEntered} / {durationMins} min
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSplitEvenly}
                disabled={isSaving || pendingTimeLog.subjects.length === 0}
              >
                Split evenly
              </Button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={handleSkip}
                disabled={isSaving}
              >
                Skip for now
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || totalEntered <= 0}
              >
                {isSaving ? "Saving…" : "Save breakdown"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
