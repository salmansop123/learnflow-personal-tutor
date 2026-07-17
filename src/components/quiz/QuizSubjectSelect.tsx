"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { fetchProfileClient, updateProfileClient } from "@/lib/profile";
import { normalizeSubjectName } from "@/lib/subject-normalizer";
import { cn } from "@/lib/utils";

function subjectPillClass(selected: boolean) {
  return cn(
    "inline-flex min-h-[36px] items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
    selected
      ? "border-sky-500 bg-sky-100 text-sky-800"
      : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-800 dark:border-border dark:bg-background dark:text-foreground"
  );
}

export function QuizSubjectSelect({
  value,
  onChange,
  disabled,
  error,
}: {
  value: string;
  onChange: (subject: string) => void;
  disabled?: boolean;
  error?: string | null;
}) {
  const [profileSubjects, setProfileSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [customInput, setCustomInput] = useState("");
  const [selectionSource, setSelectionSource] = useState<"profile" | "custom">(
    "profile"
  );

  useEffect(() => {
    let cancelled = false;
    fetchProfileClient()
      .then((profile) => {
        if (cancelled) return;
        setProfileSubjects(profile.subjectNames ?? []);
      })
      .catch(() => {
        if (!cancelled) setProfileSubjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectionSource === "custom") {
      setCustomInput(value);
    } else if (!value) {
      setCustomInput("");
    }
  }, [value, selectionSource]);

  const selectProfileSubject = (subject: string) => {
    setSelectionSource("profile");
    setCustomInput("");
    onChange(subject);
  };

  const applyCustomSubject = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const normalized = normalizeSubjectName(trimmed, profileSubjects);
    setSelectionSource("custom");
    onChange(normalized);
    setCustomInput(normalized);
    void saveSubjectToProfile(normalized);
  };

  async function saveSubjectToProfile(subject: string) {
    if (
      profileSubjects.some((s) => s.toLowerCase() === subject.toLowerCase())
    ) {
      return;
    }
    try {
      const updated = await updateProfileClient({
        subjectNames: [...profileSubjects, subject],
      });
      setProfileSubjects(updated.subjectNames ?? []);
    } catch {
      /* quiz can still use the typed subject */
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <span className="text-sm font-medium">Subject</span>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">
          Subject <span className="text-destructive">*</span>
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          One subject per quiz. Pick from your profile or type your own.
        </p>
      </div>

      {profileSubjects.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            From your profile
          </p>
          <div className="flex flex-wrap gap-2">
            {profileSubjects.map((subject) => (
              <button
                key={subject}
                type="button"
                disabled={disabled}
                onClick={() => selectProfileSubject(subject)}
                className={subjectPillClass(
                  selectionSource === "profile" &&
                    value.toLowerCase() === subject.toLowerCase()
                )}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Add subjects in your{" "}
          <Link href="/dashboard/profile" className="text-primary underline">
            profile
          </Link>{" "}
          for quick selection, or type a subject below.
        </p>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="quiz-custom-subject"
          className="text-xs font-medium text-muted-foreground"
        >
          Or type a subject
        </label>
        <div className="flex gap-2">
          <input
            id="quiz-custom-subject"
            type="text"
            value={customInput}
            disabled={disabled}
            onChange={(e) => {
              setCustomInput(e.target.value);
              setSelectionSource("custom");
              onChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyCustomSubject();
              }
            }}
            onBlur={applyCustomSubject}
            placeholder="e.g. Linear Algebra"
            className="flex h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
      </div>

      {value.trim() ? (
        <p className="text-xs text-muted-foreground">
          Selected: <strong className="text-foreground">{value}</strong>
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
