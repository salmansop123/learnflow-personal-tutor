"use client";

import { useEffect, useState } from "react";
import { Pause, Play, Square } from "lucide-react";

import { SubjectPillInput } from "@/components/profile/SubjectPillInput";
import {
  formatElapsed,
  useStudySession,
} from "@/hooks/useStudySession";
import { fetchProfileClient } from "@/lib/profile";
import {
  detectPossibleTypo,
  normalizeSubjectName,
  normalizeSubjects,
} from "@/lib/subject-normalizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useStudyStore } from "@/store/useStudyStore";
import type { StudySessionRow } from "@/types/study";

export function SessionTimer({
    activeSession,
    defaultSubject = "",
  }: {
    activeSession: StudySessionRow | null;
    defaultSubject?: string;
  }) {
    const initialSubjects =
      activeSession?.subjects?.length
        ? activeSession.subjects
        : activeSession?.subject
          ? [activeSession.subject]
          : [];

    const [subjects, setSubjects] = useState<string[]>(initialSubjects);
    const [subjectsError, setSubjectsError] = useState<string | null>(null);
    const [profileSubjectSuggestions, setProfileSubjectSuggestions] = useState<
      string[]
    >([]);
    const [typoBanner, setTypoBanner] = useState<{
      original: string;
      suggestion: string;
    } | null>(null);
    const [savedAsNote, setSavedAsNote] = useState<string | null>(null);

    useEffect(() => {
      let cancelled = false;
      fetchProfileClient()
        .then((profile) => {
          if (!cancelled) {
            setProfileSubjectSuggestions(profile.subjectNames ?? []);
          }
        })
        .catch(() => {
          if (!cancelled) setProfileSubjectSuggestions([]);
        });
      return () => {
        cancelled = true;
      };
    }, []);

    const sessionRestoredNotice = useStudyStore((s) => s.sessionRestoredNotice);
    const setSessionRestoredNotice = useStudyStore(
      (s) => s.setSessionRestoredNotice
    );

    const {
      sessionSubjects,
      isActive,
      isPaused,
      displaySeconds,
      remainingSeconds,
      targetDurationMins,
      setTargetDurationMins,
      customDurationMins,
      setCustomDurationMins,
      durationPresets,
      isPending,
      error,
      startSession,
      pauseSession,
      resumeSession,
      endSession,
    } = useStudySession(activeSession, subjects, setSubjects);

    const hasTarget = isActive && remainingSeconds !== null;

    function addPill(name: string) {
      setTypoBanner(null);
      setSubjects((prev) => {
        if (prev.some((s) => s.toLowerCase() === name.toLowerCase())) {
          return prev;
        }
        return [...prev, name];
      });
      setSubjectsError(null);
    }

    function handleSubjectAdd(rawInput: string) {
      const typo = detectPossibleTypo(rawInput, profileSubjectSuggestions);
      if (typo !== null) {
        const suggestion = normalizeSubjectName(
          rawInput,
          profileSubjectSuggestions
        );
        setTypoBanner({ original: rawInput, suggestion });
        return;
      }

      const normalized = normalizeSubjectName(
        rawInput,
        profileSubjectSuggestions
      );
      addPill(normalized);

      if (
        normalized.toLowerCase() !== rawInput.toLowerCase() &&
        normalized !== rawInput
      ) {
        setSavedAsNote(normalized);
        window.setTimeout(() => setSavedAsNote(null), 2000);
      }
    }

    async function handleStartSession() {
      if (subjects.length === 0) {
        setSubjectsError(
          "Please enter at least one subject to start your session."
        );
        return;
      }
      setSubjectsError(null);
      const finalSubjects = normalizeSubjects(
        subjects,
        profileSubjectSuggestions
      );
      setSubjects(finalSubjects);
      await startSession(finalSubjects);
    }

    return (
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Study session</CardTitle>
          <CardDescription>
            {isActive
              ? isPaused
                ? "Paused — resume or end to save your session."
                : "Timer running — pause or end when you are done."
              : "Start a session to track study time on your dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionRestoredNotice ? (
            <p
              className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
              role="status"
            >
              Your previous session was restored.{" "}
              <button
                type="button"
                className="underline underline-offset-2 hover:no-underline"
                onClick={() => setSessionRestoredNotice(false)}
              >
                Dismiss
              </button>
            </p>
          ) : null}
          {!isActive ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Subjects you will study{" "}
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </label>
              <SubjectPillInput
                value={subjects}
                onChange={(next) => {
                  setSubjects(next);
                  if (next.length > 0) setSubjectsError(null);
                }}
                onRequestAddSubject={handleSubjectAdd}
                afterInput={
                  typoBanner ? (
                    <div className="rounded-lg border border-amber-500 bg-[#FFFBEB] px-3 py-3 dark:bg-amber-950/30">
                      <p className="text-sm text-amber-900 dark:text-amber-100">
                        Did you mean{" "}
                        <strong>&apos;{typoBanner.suggestion}&apos;</strong>?
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-amber-500 text-white hover:bg-amber-600"
                          onClick={() => addPill(typoBanner.suggestion)}
                        >
                          Yes, use &apos;{typoBanner.suggestion}&apos;
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-amber-900 hover:bg-amber-100 dark:text-amber-100"
                          onClick={() => addPill(typoBanner.original)}
                        >
                          No, keep &apos;{typoBanner.original}&apos;
                        </Button>
                      </div>
                    </div>
                  ) : null
                }
                disabled={isPending}
                suggestionSubjects={profileSubjectSuggestions}
                placeholder="Type a subject and press Enter or comma to add"
              />
              {savedAsNote ? (
                <p
                  className="text-xs text-slate-400 transition-opacity duration-500"
                  role="status"
                >
                  Saved as &apos;{savedAsNote}&apos;
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Enter one or more subjects. Press Enter or comma to add each one.
              </p>
              {subjectsError ? (
                <p className="text-sm text-destructive">{subjectsError}</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Studying</p>
              <div className="flex flex-wrap gap-2">
                {sessionSubjects.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isActive ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Session duration (optional)</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={targetDurationMins === null && !customDurationMins ? "secondary" : "outline"}
                  onClick={() => {
                    setTargetDurationMins(null);
                    setCustomDurationMins("");
                  }}
                >
                  No limit
                </Button>
                {durationPresets.map((preset) => (
                  <Button
                    key={preset.minutes}
                    type="button"
                    size="sm"
                    variant={
                      targetDurationMins === preset.minutes ? "secondary" : "outline"
                    }
                    onClick={() => {
                      setTargetDurationMins(preset.minutes);
                      setCustomDurationMins("");
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                max={480}
                value={customDurationMins}
                onChange={(e) => {
                  setCustomDurationMins(e.target.value);
                  setTargetDurationMins(null);
                }}
                placeholder="Custom minutes"
                className="max-w-[140px]"
              />
            </div>
          ) : null}

          <div className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="font-mono text-4xl font-bold tabular-nums tracking-tight">
              {formatElapsed(displaySeconds)}
            </p>
            {hasTarget ? (
              <p
                className={cn(
                  "mt-1 text-sm tabular-nums",
                  remainingSeconds === 0
                    ? "font-medium text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                )}
              >
                {remainingSeconds === 0
                  ? "Target duration reached"
                  : `${formatElapsed(remainingSeconds!)} remaining`}
              </p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-2">
            {!isActive ? (
              <Button
                type="button"
                onClick={handleStartSession}
                disabled={isPending}
                className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="h-4 w-4" aria-hidden />
                Start session
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button
                    type="button"
                    onClick={resumeSession}
                    disabled={isPending}
                    className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="h-4 w-4" aria-hidden />
                    Resume
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={pauseSession}
                    disabled={isPending}
                    className="gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Pause className="h-4 w-4" aria-hidden />
                    Pause
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={endSession}
                  disabled={isPending}
                  className="gap-2"
                >
                  <Square className="h-4 w-4" aria-hidden />
                  End session
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
