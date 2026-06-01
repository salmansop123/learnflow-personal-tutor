"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { endStudySessionAction } from "@/app/dashboard/study/actions";
import {
  clearActiveSession,
  loadActiveSession,
} from "@/lib/active-study-session-storage";
import { useStudyStore } from "@/store/useStudyStore";

function parseUtcMs(iso: string): number {
  const trimmed = iso.trim();
  const hasOffset =
    trimmed.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(trimmed);
  const normalized = hasOffset
    ? trimmed.includes("T")
      ? trimmed
      : trimmed.replace(" ", "T")
    : `${trimmed.replace(" ", "T")}Z`;
  return new Date(normalized).getTime();
}

function elapsedSinceUtc(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - parseUtcMs(iso)) / 1000));
}

/**
 * Keeps active session timing accurate across dashboard tab navigation
 * and page refresh via localStorage + store sync.
 */
export function GlobalStudyTimer() {
  const router = useRouter();
  const setActiveSessionId = useStudyStore((s) => s.setActiveSessionId);
  const enqueuePendingTimeLog = useStudyStore((s) => s.enqueuePendingTimeLog);
  const setIsEndingSession = useStudyStore((s) => s.setIsEndingSession);
  const autoEndRef = useRef(false);

  useEffect(() => {
    const stored = loadActiveSession();
    if (stored) {
      setActiveSessionId(stored.sessionId);
    }

    const interval = window.setInterval(() => {
      const active = loadActiveSession();
      if (!active) {
        autoEndRef.current = false;
        return;
      }

      setActiveSessionId(active.sessionId);

      const elapsed = elapsedSinceUtc(active.startedAt);
      const targetMins = active.durationMins ?? null;
      if (
        targetMins != null &&
        targetMins > 0 &&
        elapsed >= targetMins * 60 &&
        !autoEndRef.current &&
        !useStudyStore.getState().isEndingSession
      ) {
        autoEndRef.current = true;
        setIsEndingSession(true);
        const durationMins = Math.max(1, Math.round(elapsed / 60));
        void (async () => {
          try {
            await endStudySessionAction(active.sessionId, durationMins);
            enqueuePendingTimeLog({
              sessionId: active.sessionId,
              subjects: active.subjects,
              durationMins,
            });
            clearActiveSession();
            setActiveSessionId(null);
            router.refresh();
          } catch {
            autoEndRef.current = false;
          } finally {
            setIsEndingSession(false);
          }
        })();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    enqueuePendingTimeLog,
    router,
    setActiveSessionId,
    setIsEndingSession,
  ]);

  return null;
}
