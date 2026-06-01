"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { LANGUAGE_OPTIONS } from "@/lib/profile-constants";

const DISMISS_KEY = "learnflow_language_hint_dismissed";

export function LanguageHintBanner({
  preferredLanguage,
}: {
  preferredLanguage: string;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(
      localStorage.getItem(DISMISS_KEY) === preferredLanguage
    );
  }, [preferredLanguage]);

  if (dismissed) return null;

  const label =
    LANGUAGE_OPTIONS.find((l) => l.id === preferredLanguage)?.label ??
    preferredLanguage;

  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-sky-200/60 bg-sky-50/80 px-3 py-2 text-sm text-sky-900">
      <p className="flex-1">
        Your AI tutor is set to respond in <strong>{label}</strong>.{" "}
        <Link href="/dashboard/profile" className="underline">
          Change in Profile
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, preferredLanguage);
          setDismissed(true);
        }}
        className="shrink-0 rounded p-1 hover:bg-sky-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
