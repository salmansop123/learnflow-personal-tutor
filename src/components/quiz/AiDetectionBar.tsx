"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type AiDetectionResult = {
  aiProbability: number;
  confidence: string;
};

function probabilityStyles(probability: number): {
  bar: string;
  text: string;
} {
  if (probability < 30) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400",
    };
  }
  if (probability <= 70) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
    };
  }
  return {
    bar: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  };
}

export function AiDetectionBar({
  loading,
  result,
}: {
  loading?: boolean;
  result: AiDetectionResult | null;
}) {
  if (loading) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        <span>Analyzing…</span>
      </div>
    );
  }

  if (!result) return null;

  const { aiProbability } = result;
  const styles = probabilityStyles(aiProbability);

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div
        className="h-[4px] flex-1 overflow-hidden rounded-full bg-muted"
        role="presentation"
      >
        <div
          className={cn("h-full rounded-full transition-all", styles.bar)}
          style={{ width: `${aiProbability}%` }}
        />
      </div>
      <span
        className={cn(
          "shrink-0 text-[10px] font-medium tabular-nums",
          styles.text
        )}
      >
        {aiProbability}% AI
      </span>
      <button
        type="button"
        className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground"
        title="This is an estimate of how likely this answer was AI-generated. It does not affect your score."
        aria-label="About AI detection estimate"
      >
        ?
      </button>
    </div>
  );
}
