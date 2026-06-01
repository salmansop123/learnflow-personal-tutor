"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  endStudySessionAction,
  startStudySessionAction,
} from "@/app/dashboard/study/actions";
import {
  clearActiveSession,
  loadActiveSession,
  saveActiveSession,
} from "@/lib/active-study-session-storage";
import { useStudyStore } from "@/store/useStudyStore";
import type { StudySessionRow } from "@/types/study";

const DURATION_PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
] as const;

/** API datetimes are UTC but often serialized without a Z suffix. */
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

function normalizeSubjectsList(subjects: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of subjects) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function useStudySession(
  initialActive: StudySessionRow | null,
  subjects: string[],
  setSubjects: React.Dispatch<React.SetStateAction<string[]>>
) {
  const router = useRouter();
  const {
    activeSessionId,
    setActiveSessionId,
    enqueuePendingTimeLog,
    setSessionRestoredNotice,
    isEndingSession,
    setIsEndingSession,
  } = useStudyStore();
  const [sessionSubjects, setSessionSubjects] = useState<string[]>(() =>
    initialActive?.subjects?.length
      ? initialActive.subjects
      : initialActive?.subject
        ? [initialActive.subject]
        : []
  );
  const [startedAt, setStartedAt] = useState<string | null>(
    initialActive?.startedAt ?? null
  );
  const [targetDurationMins, setTargetDurationMins] = useState<number | null>(
    null
  );
  const [customDurationMins, setCustomDurationMins] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [pausedElapsed, setPausedElapsed] = useState<number | null>(null);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerOriginMsRef = useRef<number | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);
  const autoEndTriggeredRef = useRef(false);
  const restoredFromStorageRef = useRef(false);

  const sessionId = activeSessionId ?? initialActive?.id ?? null;
  const isActive = Boolean(sessionId && startedAt);

  const syncTimerOrigin = useCallback(
    (startedAtIso: string | null, resetToZero = false) => {
      if (resetToZero || !startedAtIso) {
        timerOriginMsRef.current = Date.now();
        setDisplaySeconds(0);
        return;
      }
      const serverElapsed = elapsedSinceUtc(startedAtIso);
      timerOriginMsRef.current = Date.now() - serverElapsed * 1000;
      setDisplaySeconds(serverElapsed);
    },
    []
  );

  const resolvedTargetMins = useCallback((): number | null => {
    if (targetDurationMins !== null) return targetDurationMins;
    const custom = parseInt(customDurationMins, 10);
    if (!Number.isNaN(custom) && custom > 0) return custom;
    return null;
  }, [targetDurationMins, customDurationMins]);

  useEffect(() => {
    if (initialActive) {
      const activeSubjects =
        initialActive.subjects?.length > 0
          ? initialActive.subjects
          : initialActive.subject
            ? [initialActive.subject]
            : [];
      setActiveSessionId(initialActive.id);
      setStartedAt(initialActive.startedAt);
      setSessionSubjects(activeSubjects);
      setSubjects(activeSubjects);
      setIsPaused(false);
      setPausedElapsed(null);
      pauseStartedAtRef.current = null;
      totalPausedMsRef.current = 0;
      autoEndTriggeredRef.current = false;
      restoredFromStorageRef.current = false;
      syncTimerOrigin(initialActive.startedAt);
      saveActiveSession({
        sessionId: initialActive.id,
        subjects: activeSubjects,
        startedAt: initialActive.startedAt,
        durationMins: resolvedTargetMins(),
      });
      return;
    }

    const stored = loadActiveSession();
    if (stored) {
      restoredFromStorageRef.current = true;
      setActiveSessionId(stored.sessionId);
      setStartedAt(stored.startedAt);
      setSessionSubjects(stored.subjects);
      setSubjects(stored.subjects);
      if (stored.durationMins != null && stored.durationMins > 0) {
        setTargetDurationMins(stored.durationMins);
      }
      setIsPaused(false);
      setPausedElapsed(null);
      pauseStartedAtRef.current = null;
      totalPausedMsRef.current = 0;
      autoEndTriggeredRef.current = false;
      syncTimerOrigin(stored.startedAt);
      setSessionRestoredNotice(true);
      return;
    }

    if (!restoredFromStorageRef.current) {
      setActiveSessionId(null);
      setStartedAt(null);
      timerOriginMsRef.current = null;
      setDisplaySeconds(0);
      autoEndTriggeredRef.current = false;
    }
  }, [
    initialActive,
    setActiveSessionId,
    setSubjects,
    setSessionRestoredNotice,
    syncTimerOrigin,
    resolvedTargetMins,
  ]);

  useEffect(() => {
    if (!sessionId || !startedAt || sessionSubjects.length === 0) return;
    saveActiveSession({
      sessionId,
      subjects: sessionSubjects,
      startedAt,
      durationMins: resolvedTargetMins(),
    });
  }, [
    sessionId,
    startedAt,
    sessionSubjects,
    targetDurationMins,
    customDurationMins,
    resolvedTargetMins,
  ]);

  const computeElapsed = useCallback((): number => {
    if (!timerOriginMsRef.current) return 0;
    if (isPaused && pausedElapsed !== null) return pausedElapsed;
    const raw =
      Math.floor((Date.now() - timerOriginMsRef.current) / 1000) -
      Math.floor(totalPausedMsRef.current / 1000);
    return Math.max(0, raw);
  }, [isPaused, pausedElapsed]);

  useEffect(() => {
    if (!isActive || !startedAt) {
      if (!isActive) {
        timerOriginMsRef.current = null;
        setDisplaySeconds(0);
      }
      return;
    }

    if (isPaused) {
      if (pausedElapsed !== null) setDisplaySeconds(pausedElapsed);
      return;
    }

    const tick = () => setDisplaySeconds(computeElapsed());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isActive, startedAt, isPaused, pausedElapsed, computeElapsed]);

  const targetSeconds = (() => {
    const mins = resolvedTargetMins();
    return mins ? mins * 60 : null;
  })();

  const remainingSeconds =
    isActive && targetSeconds !== null
      ? Math.max(0, targetSeconds - displaySeconds)
      : null;

  const finishSession = useCallback(async () => {
    if (!sessionId || isEndingSession) return;
    setIsEndingSession(true);
    setIsPending(true);
    setError(null);
    try {
      const elapsed =
        isPaused && pausedElapsed !== null ? pausedElapsed : computeElapsed();
      const durationMins = Math.max(1, Math.round(elapsed / 60));
      await endStudySessionAction(sessionId, durationMins);

      enqueuePendingTimeLog({
        sessionId,
        subjects: sessionSubjects,
        durationMins,
      });

      clearActiveSession();
      setActiveSessionId(null);
      setStartedAt(null);
      setIsPaused(false);
      setPausedElapsed(null);
      pauseStartedAtRef.current = null;
      totalPausedMsRef.current = 0;
      timerOriginMsRef.current = null;
      setDisplaySeconds(0);
      autoEndTriggeredRef.current = false;
      restoredFromStorageRef.current = false;
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to end session");
    } finally {
      setIsPending(false);
      setIsEndingSession(false);
    }
  }, [
    sessionId,
    isEndingSession,
    setIsEndingSession,
    isPaused,
    pausedElapsed,
    computeElapsed,
    sessionSubjects,
    setActiveSessionId,
    enqueuePendingTimeLog,
    router,
  ]);

  useEffect(() => {
    if (!isActive || isPaused || remainingSeconds === null) return;
    if (remainingSeconds > 0) {
      autoEndTriggeredRef.current = false;
      return;
    }
    if (autoEndTriggeredRef.current || isPending) return;
    autoEndTriggeredRef.current = true;
    void finishSession();
  }, [
    isActive,
    isPaused,
    remainingSeconds,
    isPending,
    finishSession,
  ]);

  const pauseSession = useCallback(() => {
    if (!isActive || isPaused) return;
    const elapsed = computeElapsed();
    setPausedElapsed(elapsed);
    setDisplaySeconds(elapsed);
    pauseStartedAtRef.current = Date.now();
    setIsPaused(true);
  }, [isActive, isPaused, computeElapsed]);

  const resumeSession = useCallback(() => {
    if (!isActive || !isPaused) return;
    if (pauseStartedAtRef.current) {
      totalPausedMsRef.current += Date.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }
    setIsPaused(false);
    setPausedElapsed(null);
  }, [isActive, isPaused]);

  const startSession = useCallback(async (subjectsOverride?: string[]) => {
    setError(null);
    syncTimerOrigin(null, true);
    setIsPending(true);
    try {
      const normalized = normalizeSubjectsList(subjectsOverride ?? subjects);
      const row = await startStudySessionAction(normalized);
      const activeSubjects =
        row.subjects?.length > 0
          ? row.subjects
          : row.subject
            ? [row.subject]
            : normalized;
      const targetMins = resolvedTargetMins();
      setActiveSessionId(row.id);
      setStartedAt(row.startedAt);
      setSessionSubjects(activeSubjects);
      setSubjects(activeSubjects);
      setIsPaused(false);
      setPausedElapsed(null);
      pauseStartedAtRef.current = null;
      totalPausedMsRef.current = 0;
      autoEndTriggeredRef.current = false;
      restoredFromStorageRef.current = false;
      setSessionRestoredNotice(false);
      syncTimerOrigin(row.startedAt);
      saveActiveSession({
        sessionId: row.id,
        subjects: activeSubjects,
        startedAt: row.startedAt,
        durationMins: targetMins,
      });
      router.refresh();
      return true;
    } catch (e) {
      timerOriginMsRef.current = null;
      setDisplaySeconds(0);
      setError(e instanceof Error ? e.message : "Failed to start session");
      return false;
    } finally {
      setIsPending(false);
    }
  }, [
    subjects,
    setActiveSessionId,
    setSubjects,
    router,
    syncTimerOrigin,
    resolvedTargetMins,
    setSessionRestoredNotice,
  ]);

  return {
    sessionSubjects,
    isActive,
    isPaused,
    displaySeconds,
    remainingSeconds,
    targetDurationMins,
    setTargetDurationMins,
    customDurationMins,
    setCustomDurationMins,
    durationPresets: DURATION_PRESETS,
    isPending,
    error,
    setError,
    startSession,
    pauseSession,
    resumeSession,
    endSession: finishSession,
  };
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
