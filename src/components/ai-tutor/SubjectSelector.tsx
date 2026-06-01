"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { COMMON_SUBJECTS } from "@/lib/profile-constants";
import { fetchProfileClient } from "@/lib/profile";
import { normalizeSubjectList, toggleSubject } from "@/lib/tutor-subjects";
import { SUBJECT_OPTIONS } from "@/types/ai";
import type { StudentProfile } from "@/types/profile";
import { cn } from "@/lib/utils";

export type TutorEducationContext = {
  educationLevel: string | null;
  educationTier: string | null;
  educationArchetype: string | null;
};

function subjectPillClass(selected: boolean) {
  return cn(
    "inline-flex min-h-[36px] items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
    selected
      ? "border-sky-500 bg-sky-100 text-sky-800"
      : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-800"
  );
}

export function SubjectSelector({
  value,
  onChange,
  className,
  onEducationContext,
}: {
  value: string[];
  onChange: (subjects: string[]) => void;
  className?: string;
  onEducationContext?: (context: TutorEducationContext) => void;
}) {
  const [profileSubjects, setProfileSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [customInput, setCustomInput] = useState("");

  const selected = useMemo(() => normalizeSubjectList(value), [value]);

  useEffect(() => {
    let cancelled = false;
    fetchProfileClient()
      .then((p: StudentProfile) => {
        if (cancelled) return;
        const names = p.subjectNames ?? [];
        setProfileSubjects(names);
        onEducationContext?.({
          educationLevel: p.educationLevel ?? null,
          educationTier: p.educationTier ?? null,
          educationArchetype: p.educationArchetype ?? null,
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init profile subjects once
  }, [onEducationContext]);

  const suggestedPool = useMemo(() => {
    const pool = [
      ...profileSubjects,
      ...SUBJECT_OPTIONS,
      ...COMMON_SUBJECTS,
    ] as string[];
    const seen = new Set<string>();
    return pool.filter((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [profileSubjects]);

  function addCustomSubject() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    onChange(normalizeSubjectList([...selected, trimmed]));
    setCustomInput("");
  }

  function removeSelected(subject: string) {
    onChange(selected.filter((s) => s !== subject));
  }

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <span className="text-sm font-medium">Subjects</span>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div>
        <p className="text-sm font-medium">Subjects</p>
        <p className="text-xs text-muted-foreground">
          Select one or more topics, or add your own. Questions can cover any
          selected subject. You can also skip this and start chatting directly.
        </p>
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((subject) => (
            <span key={subject} className={subjectPillClass(true)}>
              {subject}
              <button
                type="button"
                onClick={() => removeSelected(subject)}
                className="rounded-full p-0.5 hover:bg-sky-200/80"
                aria-label={`Remove ${subject}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {profileSubjects.length > 0 ? (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              From your profile
            </p>
            <div className="flex flex-wrap gap-2">
              {profileSubjects.map((subject) => {
                const isOn = selected.some(
                  (s) => s.toLowerCase() === subject.toLowerCase()
                );
                return (
                  <button
                    key={`profile-${subject}`}
                    type="button"
                    onClick={() => onChange(toggleSubject(selected, subject))}
                    className={subjectPillClass(isOn)}
                  >
                    {subject}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Suggested subjects
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedPool
              .filter(
                (s) =>
                  !profileSubjects.some(
                    (p) => p.toLowerCase() === s.toLowerCase()
                  )
              )
              .slice(0, 12)
              .map((subject) => {
                const isOn = selected.some(
                  (s) => s.toLowerCase() === subject.toLowerCase()
                );
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => onChange(toggleSubject(selected, subject))}
                    className={subjectPillClass(isOn)}
                  >
                    {subject}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomSubject();
            }
          }}
          placeholder="Add a custom subject…"
          className="flex h-10 min-w-0 flex-1 rounded-md border border-input bg-white px-3 text-sm dark:bg-background"
        />
        <button
          type="button"
          onClick={addCustomSubject}
          disabled={!customInput.trim()}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md border border-input bg-white px-3 text-sm font-medium hover:bg-muted disabled:opacity-50 dark:bg-background"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add
        </button>
      </div>
    </div>
  );
}
