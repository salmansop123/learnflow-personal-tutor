"use client";

import { Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { QuizSubjectSelect } from "@/components/quiz/QuizSubjectSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DocumentUploadZone,
  useDocumentUpload,
} from "@/components/shared/DocumentUploadZone";
import { buildDocumentContextBlock } from "@/lib/document-constants";
import { totalQuestionCount } from "@/lib/quiz-paper";
import type { QuizQuestionCounts, QuizSetupConfig } from "@/types/quiz";

type PaperType = keyof QuizQuestionCounts;

const PAPER_TYPES: {
  id: PaperType;
  label: string;
  description?: string;
  min: number;
  max: number;
  default: number;
}[] = [
  { id: "mcq", label: "Multiple choice", min: 1, max: 30, default: 5 },
  {
    id: "fill_blank",
    label: "Fill in the blank",
    min: 1,
    max: 20,
    default: 5,
  },
  { id: "short", label: "Short answer", min: 1, max: 10, default: 3 },
  {
    id: "long",
    label: "Long answer",
    description: "Theory & detailed explanations",
    min: 1,
    max: 5,
    default: 2,
  },
];

const DEFAULT_COUNTS: QuizQuestionCounts = {
  mcq: 5,
  fill_blank: 5,
};

function QuestionCountStepper({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          disabled={disabled || value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label="Decrease count"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          disabled={disabled || value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label="Increase count"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function QuizSetup({
  onStart,
  onCancel,
  isLoading,
  initialConfig,
  onUsageConsumed,
}: {
  onStart: (config: QuizSetupConfig) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialConfig?: QuizSetupConfig;
  onUsageConsumed?: () => void;
}) {
  const [subject, setSubject] = useState(initialConfig?.subject ?? "");
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [topic, setTopic] = useState(initialConfig?.topic ?? "");
  const [difficulty, setDifficulty] = useState<QuizSetupConfig["difficulty"]>(
    initialConfig?.difficulty ?? "medium"
  );
  const [selectedTypes, setSelectedTypes] = useState<PaperType[]>(() => {
    if (initialConfig?.questionCounts) {
      return Object.keys(initialConfig.questionCounts) as PaperType[];
    }
    return ["mcq", "fill_blank"];
  });
  const [counts, setCounts] = useState<QuizQuestionCounts>(
    initialConfig?.questionCounts ?? DEFAULT_COUNTS
  );

  const {
    documents,
    uploadFile,
    removeDocument,
    readyDocuments,
    isUploading,
  } = useDocumentUpload(2, onUsageConsumed);

  const referenceContext = useMemo(
    () =>
      buildDocumentContextBlock(
        readyDocuments.map((d) => ({ name: d.name, text: d.text }))
      ),
    [readyDocuments]
  );

  const questionCounts = useMemo(() => {
    const out: QuizQuestionCounts = {};
    for (const type of selectedTypes) {
      const cfg = PAPER_TYPES.find((t) => t.id === type)!;
      out[type] = counts[type] ?? cfg.default;
    }
    return out;
  }, [selectedTypes, counts]);

  const totalQuestions = totalQuestionCount(questionCounts);

  const toggleType = (type: PaperType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length <= 1) return prev;
        const next = prev.filter((t) => t !== type);
        setCounts((c) => {
          const copy = { ...c };
          delete copy[type];
          return copy;
        });
        return next;
      }
      const cfg = PAPER_TYPES.find((t) => t.id === type)!;
      setCounts((c) => ({ ...c, [type]: c[type] ?? cfg.default }));
      return [...prev, type];
    });
  };

  const resetForm = () => {
    setSubject("");
    setSubjectError(null);
    setTopic("");
    setDifficulty("medium");
    setSelectedTypes(["mcq", "fill_blank"]);
    setCounts(DEFAULT_COUNTS);
    for (const doc of documents) {
      removeDocument(doc.id);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const handleStart = () => {
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      setSubjectError("Please select or enter a subject for this quiz.");
      return;
    }
    if (totalQuestions < 1) {
      setSubjectError("Select at least one question type with a count.");
      return;
    }
    setSubjectError(null);
    onStart({
      subject: trimmedSubject,
      topic: topic.trim() || undefined,
      difficulty,
      questionCounts,
      questionCount: totalQuestions,
      referenceContext: referenceContext || undefined,
    });
  };

  return (
    <Card className="overflow-hidden border-sky-200/40 shadow-sm">
      <CardHeader>
        <CardTitle>Quiz setup</CardTitle>
        <CardDescription>
          Choose question types and how many per section. The full paper is
          shown at once when you start. Reference material is optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <QuizSubjectSelect
          value={subject}
          onChange={(next) => {
            setSubject(next);
            if (next.trim()) setSubjectError(null);
          }}
          disabled={isLoading || isUploading}
          error={subjectError}
        />

        <div>
          <label className="text-sm font-medium">Topic (optional)</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Algebra, Cell division"
            className="mt-1.5"
            disabled={isLoading || isUploading}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as QuizSetupConfig["difficulty"])
            }
            disabled={isLoading || isUploading}
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <DocumentUploadZone
          documents={documents}
          uploadFile={uploadFile}
          removeDocument={removeDocument}
          disabled={isLoading || isUploading}
          label="Reference paper (optional)"
          hint="Exam papers, notes, or worksheets — improves relevance when provided"
          maxFiles={2}
        />

        <div>
          <p className="mb-2 text-sm font-medium">Question types & counts</p>
          <div className="space-y-3">
            {PAPER_TYPES.map((t) => {
              const selected = selectedTypes.includes(t.id);
              return (
                <div key={t.id} className="space-y-2">
                  <button
                    type="button"
                    disabled={isLoading || isUploading}
                    onClick={() => toggleType(t.id)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs transition-all ${
                      selected
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium">{t.label}</span>
                    {t.description ? (
                      <span className="mt-0.5 block text-[10px] opacity-80">
                        {t.description}
                      </span>
                    ) : null}
                  </button>
                  {selected ? (
                    <QuestionCountStepper
                      label={`How many ${t.label} questions?`}
                      value={counts[t.id] ?? t.default}
                      min={t.min}
                      max={t.max}
                      disabled={isLoading || isUploading}
                      onChange={(v) =>
                        setCounts((prev) => ({ ...prev, [t.id]: v }))
                      }
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            Total questions: {totalQuestions}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={isLoading || isUploading}
            onClick={handleStart}
          >
            {isLoading
              ? "Generating…"
              : isUploading
                ? "Processing file…"
                : "Start quiz"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleCancel}
          >
            Cancel quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
