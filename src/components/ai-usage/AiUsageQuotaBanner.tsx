"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Brain,
  BookOpen,
  ClipboardList,
  FileText,
  MessageSquare,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  fetchAiUsageClient,
  findFeatureStatus,
  formatRemainingQuota,
  type AiUsageFeatureStatus,
  type AiUsageOverview,
} from "@/lib/ai-usage";
import type { AiFeature } from "@/lib/ai-usage-limits";
import {
  FEATURE_LABELS,
  progressBarColor,
  progressTrackColor,
} from "@/lib/ai-usage-limits";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const ICONS: Partial<Record<AiFeature, LucideIcon>> = {
  chat: MessageSquare,
  quiz: Brain,
  assignment: ClipboardList,
  pdf_analysis: FileText,
  summary: NotebookPen,
  study_plan: BookOpen,
};

const SHORT_LABELS: Record<AiFeature, string> = {
  chat: "AI chats",
  quiz: "quiz generations",
  assignment: "assignments",
  pdf_analysis: "PDF analyses",
  summary: "AI summaries",
  study_plan: "study plans",
};

export type AiUsageQuotaBannerProps = {
  features: AiFeature[];
  className?: string;
  /** Bump to force a refetch (e.g. after generating a quiz). */
  refreshToken?: number;
  compact?: boolean;
};

export function AiUsageQuotaBanner({
  features,
  className,
  refreshToken = 0,
  compact = false,
}: AiUsageQuotaBannerProps) {
  const [overview, setOverview] = useState<AiUsageOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchAiUsageClient();
      setOverview(data);
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  if (loading && !overview) {
    return (
      <div
        className={cn(
          "h-12 animate-pulse rounded-xl border bg-muted/40",
          className
        )}
        aria-hidden
      />
    );
  }

  if (!overview) return null;

  const items = features
    .map((feature) => {
      const status = findFeatureStatus(overview, feature);
      return status ? { feature, status } : null;
    })
    .filter(Boolean) as { feature: AiFeature; status: AiUsageFeatureStatus }[];

  if (items.length === 0) return null;

  const isFree = overview.subscriptionPlan === "FREE";
  const anyExhausted = items.some(
    (i) => !i.status.unlimited && (i.status.remaining ?? 0) <= 0
  );

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        anyExhausted
          ? "border-red-500/40 bg-red-500/10"
          : "border-sky-500/30 bg-sky-500/5",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3",
          compact ? "sm:flex-row sm:items-center sm:justify-between" : ""
        )}
      >
        <ul
          className={cn(
            "grid flex-1 gap-3",
            items.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"
          )}
        >
          {items.map(({ feature, status }) => {
            const Icon = ICONS[feature] ?? Sparkles;
            const text = formatRemainingQuota(status, SHORT_LABELS[feature]);
            const percent = status.unlimited ? 0 : status.percent;
            return (
              <li key={feature} className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <Icon
                    className="h-4 w-4 shrink-0 text-sky-600"
                    aria-hidden
                  />
                  <span className="font-medium text-foreground">
                    {text ?? FEATURE_LABELS[feature]}
                  </span>
                </div>
                {!status.unlimited ? (
                  <div
                    className={cn(
                      "h-1.5 w-full max-w-xs overflow-hidden rounded-full",
                      progressTrackColor(percent)
                    )}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        progressBarColor(percent)
                      )}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {isFree ? (
          <Link
            href="/dashboard/billing"
            className="shrink-0 text-sm font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
          >
            {anyExhausted ? "Upgrade to continue" : "Upgrade for unlimited"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Show remaining quota after a successful AI action. */
export async function toastRemainingQuota(feature: AiFeature): Promise<void> {
  try {
    const overview = await fetchAiUsageClient();
    const status = findFeatureStatus(overview, feature);
    const message = formatRemainingQuota(status, SHORT_LABELS[feature]);
    if (!message) return;
    if (status && !status.unlimited && (status.remaining ?? 0) <= 0) {
      toast.warning(message);
    } else {
      toast.info(message);
    }
  } catch {
    /* ignore */
  }
}
