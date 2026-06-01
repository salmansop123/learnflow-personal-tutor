"use client";

import {
  AiDetectionBar,
  type AiDetectionResult,
} from "@/components/quiz/AiDetectionBar";
import { getFillBlankDisplayParts } from "@/lib/quiz-parse";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz";

function optionLabel(option: string, index: number): string {
  const letter = String.fromCharCode(65 + index);
  if (/^[A-D][\).\s]/i.test(option.trim())) return option;
  return `${letter}. ${option}`;
}

function FillBlankInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  const { before, after } = getFillBlankDisplayParts(question.question);
  const hasInlineBlank = /_{3,}/.test(question.question);

  if (!hasInlineBlank) {
    return (
      <div className="space-y-2">
        <p className="text-base leading-relaxed">{question.question}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Your answer…"
          aria-label="Fill in the blank"
        />
      </div>
    );
  }

  return (
    <p className="text-base leading-relaxed">
      {before}
      {before ? " " : null}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mx-1 inline-block h-9 min-w-[8rem] rounded-md border border-input bg-background px-2 text-sm align-middle"
        aria-label="Fill in the blank"
        placeholder="…"
      />
      {after ? ` ${after}` : null}
    </p>
  );
}

export function PaperQuestionCard({
  question,
  questionNumber,
  marks,
  value,
  onChange,
  aiDetection,
  aiDetectionLoading,
}: {
  question: Question;
  questionNumber: number;
  marks: number;
  value: string;
  onChange: (value: string) => void;
  aiDetection?: AiDetectionResult | null;
  aiDetectionLoading?: boolean;
}) {
  const showAiDetection =
    question.type === "short" ||
    question.type === "long" ||
    question.type === "concept";
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          Question {questionNumber}
        </p>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          [{marks} {marks === 1 ? "mark" : "marks"}]
        </span>
      </div>

      {question.type === "mcq" ? (
        <div className="space-y-3">
          <p className="text-base leading-relaxed">{question.question}</p>
          <div className="space-y-2" role="radiogroup">
            {question.options.map((option, i) => {
              const labeled = optionLabel(option, i);
              const letter = String.fromCharCode(65 + i);
              return (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50",
                    value === option || value === letter
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <input
                    type="radio"
                    name={`mcq-${question.id}`}
                    checked={value === option || value === letter}
                    onChange={() => onChange(option)}
                    className="mt-1"
                  />
                  <span>{labeled}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : question.type === "fill_blank" ? (
        <FillBlankInput
          question={question}
          value={value}
          onChange={onChange}
        />
      ) : question.type === "long" ? (
        <div className="space-y-2">
          <p className="text-base leading-relaxed">{question.question}</p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={10}
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed"
            placeholder="Write your detailed answer…"
          />
          {showAiDetection ? (
            <AiDetectionBar
              loading={aiDetectionLoading}
              result={aiDetection ?? null}
            />
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-base leading-relaxed">{question.question}</p>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed"
            placeholder="Your answer…"
          />
          {showAiDetection ? (
            <AiDetectionBar
              loading={aiDetectionLoading}
              result={aiDetection ?? null}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
