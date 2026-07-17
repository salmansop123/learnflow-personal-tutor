"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  ClipboardList,
  FileText,
  MessageSquare,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import type { AiUsageFeatureStatus, AiUsageOverview } from "@/lib/ai-usage";
import {
  progressBarColor,
  progressTrackColor,
} from "@/lib/ai-usage-limits";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  chat_daily: MessageSquare,
  chat_monthly: MessageSquare,
  quiz: Brain,
  assignment: ClipboardList,
  pdf_analysis: FileText,
  summary: NotebookPen,
  study_plan: BookOpen,
};

const FEATURE_TITLES: Record<string, string> = {
  chat_daily: "AI Chats",
  chat_monthly: "AI Chats",
  quiz: "Quiz Generation",
  assignment: "Assignments",
  pdf_analysis: "PDF Analysis",
  summary: "AI Summaries",
  study_plan: "Study Plans",
};

function periodLabel(period: string): string {
  return period === "day" ? "Today" : "This Month";
}

function UsageProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full", progressTrackColor(clamped))}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", progressBarColor(clamped))}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

function UsageFeatureCard({
  feature,
  resetLabel,
}: {
  feature: AiUsageFeatureStatus;
  resetLabel: string;
}) {
  const Icon = FEATURE_ICONS[feature.feature] ?? Sparkles;
  const title = FEATURE_TITLES[feature.feature] ?? feature.label;
  const usedLabel = feature.unlimited
    ? `${feature.used} used`
    : `${feature.used} / ${feature.limit ?? "∞"}`;
  const remainingLabel = feature.unlimited
    ? "Unlimited"
    : `${feature.remaining ?? 0} remaining`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">
            {usedLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {periodLabel(feature.period)} · {remainingLabel}
          </p>
        </div>
        {!feature.unlimited ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(feature.percent)}%</span>
              <span>Resets {resetLabel}</span>
            </div>
            <UsageProgressBar percent={feature.percent} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Fair usage · Resets {resetLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function planDisplayName(plan: string): string {
  switch (plan.toUpperCase()) {
    case "PRO":
      return "Pro";
    case "PREMIUM_PLUS":
      return "Premium+";
    case "ENTERPRISE":
      return "Enterprise";
    default:
      return "Free";
  }
}

export function AiUsageSection({ usage }: { usage: AiUsageOverview }) {
  const monthlyReset = usage.resetDate
    ? format(new Date(usage.resetDate), "MMM d")
    : "next month";
  const dailyReset = usage.dailyResetAt
    ? format(new Date(usage.dailyResetAt), "h:mm a")
    : "tomorrow";

  // Prefer daily chat card + monthly features (skip duplicate monthly chat in grid
  // when we show daily as primary for chats — still show monthly chat as second card)
  const cards = usage.features.filter((f) =>
    [
      "chat_daily",
      "quiz",
      "assignment",
      "pdf_analysis",
      "summary",
      "study_plan",
    ].includes(f.feature)
  );

  const remainingChats =
    cards.find((f) => f.feature === "chat_daily")?.remaining ?? null;
  const remainingQuiz =
    cards.find((f) => f.feature === "quiz")?.remaining ?? null;
  const remainingPdf =
    cards.find((f) => f.feature === "pdf_analysis")?.remaining ?? null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">AI Usage</h2>
          <p className="text-sm text-muted-foreground">
            Feature-based quotas for your {planDisplayName(usage.subscriptionPlan)}{" "}
            plan. Tokens are not shown.
          </p>
        </div>
        {usage.subscriptionPlan === "FREE" ? (
          <Link
            href="/dashboard/billing"
            className={cn(buttonVariants({ size: "sm" }), "w-fit")}
          >
            Upgrade plan
          </Link>
        ) : null}
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-sky-500/10 via-card to-violet-500/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">AI Usage Overview</CardTitle>
          <CardDescription>
            Current plan:{" "}
            <span className="font-medium text-foreground">
              {planDisplayName(usage.subscriptionPlan)}
            </span>
            {" · "}
            Monthly reset {monthlyReset}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <li>
              Remaining AI Chats (today):{" "}
              <strong>
                {remainingChats === null ? "Unlimited" : remainingChats}
              </strong>
            </li>
            <li>
              Remaining Quiz Generations:{" "}
              <strong>
                {remainingQuiz === null ? "Unlimited" : remainingQuiz}
              </strong>
            </li>
            <li>
              Remaining PDF Uploads:{" "}
              <strong>
                {remainingPdf === null ? "Unlimited" : remainingPdf}
              </strong>
            </li>
            <li>
              Remaining Assignments:{" "}
              <strong>
                {cards.find((f) => f.feature === "assignment")?.unlimited
                  ? "Unlimited"
                  : cards.find((f) => f.feature === "assignment")?.remaining ??
                    0}
              </strong>
            </li>
            <li>
              Remaining Summaries:{" "}
              <strong>
                {cards.find((f) => f.feature === "summary")?.unlimited
                  ? "Unlimited"
                  : cards.find((f) => f.feature === "summary")?.remaining ?? 0}
              </strong>
            </li>
            <li>
              Remaining Study Plans:{" "}
              <strong>
                {cards.find((f) => f.feature === "study_plan")?.unlimited
                  ? "Unlimited"
                  : cards.find((f) => f.feature === "study_plan")?.remaining ??
                    0}
              </strong>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((feature) => (
          <UsageFeatureCard
            key={`${feature.feature}-${feature.period}`}
            feature={feature}
            resetLabel={
              feature.period === "day" ? dailyReset : monthlyReset
            }
          />
        ))}
      </div>
    </section>
  );
}
