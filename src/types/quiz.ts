export type QuestionType =
  | "mcq"
  | "fill_blank"
  | "short"
  | "concept"
  | "long";

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizPhase =
  | "setup"
  | "loading"
  | "active"
  | "review"
  | "results";

export interface Question {
  id: string;
  type: QuestionType;
  section?: QuestionType;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: QuizDifficulty;
  timeLimit: number;
}

export type QuizQuestionCounts = {
  mcq?: number;
  fill_blank?: number;
  short?: number;
  long?: number;
};

export interface QuizSetupConfig {
  subject: string;
  topic?: string;
  difficulty: QuizDifficulty;
  questionCounts: QuizQuestionCounts;
  /** Sum of all section counts (for display and persistence). */
  questionCount: number;
  referenceContext?: string;
}

export interface QuestionResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  skipped?: boolean;
}

export type QuizEndOptions = {
  partial?: boolean;
  timedOut?: boolean;
  aiDetectionResults?: Record<
    string,
    { aiProbability: number; confidence: string } | null
  >;
};

export interface QuizAttemptPayload {
  subject: string;
  topic?: string | null;
  difficulty: QuizDifficulty;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeTaken: number;
  questionsJson: string;
  isPartial?: boolean;
  partialReason?: string | null;
  sectionBreakdownJson?: string;
}
