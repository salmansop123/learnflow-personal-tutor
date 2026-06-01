"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { COMMON_SUBJECTS } from "@/lib/profile-constants";
import { cn } from "@/lib/utils";

export function SubjectPillInput({
  value,
  onChange,
  placeholder = "Type a subject and press Enter",
  suggestionSubjects,
  disabled = false,
  onRequestAddSubject,
  afterInput,
}: {
  value: string[];
  onChange: (subjects: string[]) => void;
  placeholder?: string;
  /** Profile or custom suggestions; falls back to COMMON_SUBJECTS */
  suggestionSubjects?: string[];
  disabled?: boolean;
  /** When set, Enter/comma/suggestions call this instead of adding raw text directly */
  onRequestAddSubject?: (raw: string) => void;
  /** Rendered between the text input and the pill list (e.g. typo suggestion banner) */
  afterInput?: ReactNode;
}) {
  const [input, setInput] = useState("");

  function addSubject(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setInput("");
    if (onRequestAddSubject) {
      onRequestAddSubject(trimmed);
      return;
    }
    const exists = value.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (!exists) onChange([...value, trimmed]);
  }

  function removeSubject(subject: string) {
    onChange(value.filter((s) => s !== subject));
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={input}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSubject(input);
          }
        }}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw.includes(",")) {
            raw.split(",").forEach((part) => addSubject(part));
            return;
          }
          setInput(raw);
        }}
        placeholder={placeholder}
        className={cn(
          "flex h-11 w-full rounded-lg border border-input bg-white px-3 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      />
      {afterInput}
      <div className="flex flex-wrap gap-2">
        {value.map((subject) => (
          <span
            key={subject}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-800"
          >
            {subject}
            <button
              type="button"
              onClick={() => removeSubject(subject)}
              className="rounded-full p-0.5 hover:bg-sky-200"
              aria-label={`Remove ${subject}`}
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      {(suggestionSubjects ?? COMMON_SUBJECTS).filter(
        (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
      ).length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {(suggestionSubjects ?? COMMON_SUBJECTS)
            .filter(
              (s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())
            )
            .slice(0, 12)
            .map((s) => (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => addSubject(s)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:opacity-50"
              >
                + {s}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}
