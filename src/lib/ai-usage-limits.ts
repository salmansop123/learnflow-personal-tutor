/**
 * Central plan limits for AI feature usage (feature-based, not tokens).
 * Keep in sync with backend/app/core/ai_usage_limits.py
 */

import type { UserPlan } from "@/types/user";

export type AiFeature =
  | "chat"
  | "quiz"
  | "assignment"
  | "pdf_analysis"
  | "summary"
  | "study_plan";

export type PlanLimits = {
  daily_chat: number | null;
  monthly_chat: number | null;
  quiz: number | null;
  assignment: number | null;
  pdf_analysis: number | null;
  summary: number | null;
  study_plan: number | null;
};

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  FREE: {
    daily_chat: 25,
    monthly_chat: 600,
    quiz: 10,
    assignment: 5,
    pdf_analysis: 3,
    summary: 10,
    study_plan: 2,
  },
  PRO: {
    daily_chat: null,
    monthly_chat: null,
    quiz: null,
    assignment: null,
    pdf_analysis: null,
    summary: null,
    study_plan: null,
  },
  PREMIUM_PLUS: {
    daily_chat: null,
    monthly_chat: null,
    quiz: null,
    assignment: null,
    pdf_analysis: null,
    summary: null,
    study_plan: null,
  },
  ENTERPRISE: {
    daily_chat: null,
    monthly_chat: null,
    quiz: null,
    assignment: null,
    pdf_analysis: null,
    summary: null,
    study_plan: null,
  },
};

export const FEATURE_LABELS: Record<AiFeature, string> = {
  chat: "AI Chat",
  quiz: "Quiz Generation",
  assignment: "Assignment Generation",
  pdf_analysis: "PDF Analysis",
  summary: "AI Note Summary",
  study_plan: "Study Plan Generation",
};

export const USAGE_COMPARISON_ROWS: {
  feature: string;
  free: string;
  pro: string;
  premium: string;
}[] = [
  {
    feature: "AI Chats",
    free: "25/day, 600/month",
    pro: "Unlimited",
    premium: "Unlimited",
  },
  {
    feature: "Quiz Generation",
    free: "10/month",
    pro: "Unlimited",
    premium: "Unlimited",
  },
  {
    feature: "Assignments",
    free: "5/month",
    pro: "Unlimited",
    premium: "Unlimited",
  },
  {
    feature: "PDF Analysis",
    free: "3/month",
    pro: "Unlimited",
    premium: "Unlimited",
  },
  {
    feature: "AI Summaries",
    free: "10/month",
    pro: "Unlimited",
    premium: "Unlimited",
  },
  {
    feature: "Study Plans",
    free: "2/month",
    pro: "Unlimited",
    premium: "Unlimited",
  },
];

export function getPlanLimits(plan: string): PlanLimits {
  const key = plan.toUpperCase() as UserPlan;
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.FREE;
}

export function progressBarColor(percent: number): string {
  if (percent >= 85) return "bg-red-500";
  if (percent >= 60) return "bg-amber-500";
  return "bg-emerald-500";
}

export function progressTrackColor(percent: number): string {
  if (percent >= 85) return "bg-red-500/15";
  if (percent >= 60) return "bg-amber-500/15";
  return "bg-emerald-500/15";
}
