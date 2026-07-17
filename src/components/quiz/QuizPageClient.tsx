"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { QuizInterface } from "@/components/quiz/QuizInterface";
import { QuizResults } from "@/components/quiz/QuizResults";
import { QuizSetup } from "@/components/quiz/QuizSetup";
import { Button } from "@/components/ui/button";
import { useQuizEngine } from "@/hooks/useQuizEngine";
import { QuizHistory } from "@/components/quiz/QuizHistory";
import type { SavedQuizAttempt } from "@/lib/quiz";
import type { QuizSetupConfig } from "@/types/quiz";

export function QuizPageClient({
  initialAttempts,
}: {
  initialAttempts: SavedQuizAttempt[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const engine = useQuizEngine();
  const retakeConfigRef = useRef<QuizSetupConfig | null>(null);
  const { correct, total, score } = engine.scoreSummary();

  const handleRetake = useCallback(() => {
    const cfg = engine.config;
    if (cfg) {
      retakeConfigRef.current = cfg;
    }
    engine.reset();
    router.refresh();
  }, [engine, router]);

  const handleNewQuiz = useCallback(() => {
    retakeConfigRef.current = null;
    engine.reset();
    router.refresh();
  }, [engine, router]);

  const handleSetupStart = useCallback(
    (setup: QuizSetupConfig) => {
      retakeConfigRef.current = null;
      void engine.startQuiz(setup);
    },
    [engine]
  );

  if (engine.phase === "loading") {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          Generating your quiz paper…
        </p>
        <Button type="button" variant="outline" onClick={engine.reset}>
          Cancel quiz
        </Button>
        {engine.error ? (
          <p className="text-sm text-destructive">{engine.error}</p>
        ) : null}
      </div>
    );
  }

  if (engine.phase === "setup") {
    const retake = retakeConfigRef.current;
    return (
      <div className="space-y-6">
        <QuizSetup
          key={retake ? `retake-${retake.subject}` : "new"}
          initialConfig={retake ?? undefined}
          onStart={handleSetupStart}
          onCancel={engine.reset}
          isLoading={false}
        />
        {engine.error ? (
          <p className="text-sm text-destructive">{engine.error}</p>
        ) : null}
        <QuizHistory attempts={initialAttempts} />
      </div>
    );
  }

  if (engine.phase === "results") {
    return (
      <QuizResults
        score={score}
        correct={correct}
        total={total}
        timeTaken={engine.timeTakenSeconds}
        questions={engine.questions}
        results={engine.results}
        answers={engine.answers}
        isSaving={engine.isSaving}
        savedAttemptId={engine.savedAttemptId}
        error={engine.error}
        onRetry={handleNewQuiz}
        onRetake={handleRetake}
        onNewQuiz={handleNewQuiz}
        quizSummary={engine.quizSummary}
        aiDetectionResults={engine.aiDetectionResults}
        config={engine.config}
      />
    );
  }

  return (
    <div className="space-y-4">
      {engine.error ? (
        <p className="text-sm text-destructive">{engine.error}</p>
      ) : null}
      <QuizInterface
        phase="active"
        questions={engine.questions}
        answers={engine.answers}
        config={engine.config}
        timeLeft={engine.timeLeft}
        studentName={session?.user?.name}
        onAnswerChange={engine.answerQuestion}
        onAddTimeExtension={engine.addTimeExtension}
        onSubmitPaper={(opts) => engine.endQuiz(opts)}
        onCancelPaper={(opts) => engine.endQuiz({ partial: true, ...opts })}
        isSubmitting={engine.isSaving}
      />
    </div>
  );
}
