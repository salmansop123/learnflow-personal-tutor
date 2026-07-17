"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { toast } from "@/lib/toast";
import type { AiUsageOverview } from "@/lib/ai-usage";

const STORAGE_KEY = "learnflow_ai_usage_warning";

/**
 * Shows yellow/orange toasts when Free-plan users hit 75% / 90% / 100% of quota.
 * Dedupes per warning level per calendar day via sessionStorage.
 */
export function AiUsageNotifications({
  usage,
}: {
  usage: AiUsageOverview | null;
}) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!usage?.warningLevel || shownRef.current) return;
    if (usage.subscriptionPlan !== "FREE") return;

    const dayKey = new Date().toISOString().slice(0, 10);
    const storageKey = `${STORAGE_KEY}:${dayKey}:${usage.warningLevel}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }

    shownRef.current = true;

    if (usage.warningLevel === "warn75") {
      toast.warning("You have used 75% of your AI quota.");
    } else if (usage.warningLevel === "warn90") {
      toast.warning("You are almost out of AI usage for this month.");
    } else if (usage.warningLevel === "exhausted") {
      toast.error("You've reached your limit. Upgrade to continue.");
    }
  }, [usage]);

  if (!usage || usage.warningLevel !== "exhausted") return null;

  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-900 dark:text-red-100">
      You&apos;ve reached your AI usage limit.{" "}
      <Link href="/dashboard/billing" className="font-semibold underline">
        Upgrade to Pro
      </Link>{" "}
      to continue.
    </div>
  );
}
