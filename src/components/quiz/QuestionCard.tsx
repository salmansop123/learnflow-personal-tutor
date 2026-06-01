"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";

export function QuestionCard({
  question,
  index,
  total,
  timeLeft,
  draftAnswer,
  onDraftChange,
  onSubmit,
}: {
  question: Question;
  index: number;
  total: number;
  timeLeft: number;
  draftAnswer: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const urgent = timeLeft <= 10;
  const isLong = question.type === "long";

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {index + 1} of {total}
          {isLong ? (
            <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
              Long answer
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "font-mono tabular-nums",
            urgent && "font-semibold text-destructive"
          )}
        >
          {timeLeft}s
        </span>
      </div>

      <p className="text-lg font-medium leading-relaxed">{question.question}</p>

      {question.type === "mcq" ? (
        <div className="grid gap-2">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onDraftChange(option)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-muted",
                draftAnswer === option && "border-primary bg-primary/5"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      ) : isLong ? (
        <textarea
          value={draftAnswer}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Write a detailed explanation…"
          rows={6}
          className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed"
        />
      ) : (
        <Input
          value={draftAnswer}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={
            question.type === "fill_blank"
              ? "Fill in the blank…"
              : "Your answer…"
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.type !== "long") onSubmit();
          }}
        />
      )}

      <Button
        type="button"
        onClick={onSubmit}
        disabled={!draftAnswer.trim()}
      >
        Submit answer
      </Button>
    </div>
  );
}
