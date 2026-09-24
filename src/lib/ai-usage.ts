import { serverApiFetch, ApiRequestError } from "@/lib/api-server";
import type { AiFeature } from "@/lib/ai-usage-limits";

export type AiUsageFeatureStatus = {
  feature: string;
  label: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
  percent: number;
  period: string;
};

export type AiUsageOverview = {
  subscriptionPlan: string;
  dailyChatUsed: number;
  monthlyChatUsed: number;
  quizUsed: number;
  assignmentUsed: number;
  pdfAnalysisUsed: number;
  summaryUsed: number;
  studyPlanUsed: number;
  resetDate: string | null;
  dailyResetAt: string | null;
  features: AiUsageFeatureStatus[];
  warningLevel: "warn75" | "warn90" | "exhausted" | null;
};

export type AiUsageConsumeResult = {
  success: boolean;
  message: string;
  overview?: AiUsageOverview | null;
};

export async function getAiUsage(userId: string): Promise<AiUsageOverview> {
  return serverApiFetch<AiUsageOverview>("/ai-usage", userId);
}

export async function checkAiUsage(
  userId: string,
  feature: AiFeature
): Promise<{ allowed: boolean; message: string; overview: AiUsageOverview }> {
  return serverApiFetch(`/ai-usage/check/${feature}`, userId);
}

export class AiUsageLimitError extends Error {
  status = 429;
  overview: AiUsageOverview | null;

  constructor(message: string, overview: AiUsageOverview | null = null) {
    super(message);
    this.name = "AiUsageLimitError";
    this.overview = overview;
  }
}

/**
 * Atomically check remaining quota and consume one unit of the feature.
 * Throws AiUsageLimitError (429) when the user is over quota.
 */
export async function consumeAiUsage(
  userId: string,
  feature: AiFeature,
  tokens = 0
): Promise<AiUsageOverview> {
  try {
    const result = await serverApiFetch<AiUsageConsumeResult>(
      "/ai-usage/consume",
      userId,
      {
        method: "POST",
        body: JSON.stringify({ feature, tokens }),
      }
    );
    if (!result.success || !result.overview) {
      throw new AiUsageLimitError(
        result.message || "AI usage limit reached",
        result.overview ?? null
      );
    }
    return result.overview;
  } catch (error) {
    if (error instanceof AiUsageLimitError) throw error;
    if (error instanceof ApiRequestError && error.status === 429) {
      const details = error.details as
        | { message?: string; overview?: AiUsageOverview }
        | undefined;
      const detailObj =
        typeof error.message === "string" && error.message.startsWith("{")
          ? null
          : details;
      // FastAPI may put structured detail in details
      const payload =
        detailObj && typeof detailObj === "object"
          ? detailObj
          : (error.details as {
              success?: boolean;
              message?: string;
              overview?: AiUsageOverview;
            } | null);

      const message =
        (payload && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : null) ||
        (typeof error.details === "object" &&
        error.details &&
        "message" in (error.details as object)
          ? String((error.details as { message: string }).message)
          : error.message) ||
        "You have reached your AI usage limit. Upgrade to Pro to continue.";

      const overview =
        payload && "overview" in payload
          ? (payload.overview as AiUsageOverview | null)
          : null;

      throw new AiUsageLimitError(message, overview);
    }
    throw error;
  }
}

export function usageLimitResponse(error: AiUsageLimitError): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message: error.message,
      error: error.message,
      overview: error.overview,
    }),
    {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/** Map UI feature keys to overview.features[].feature values from the API. */
export const FEATURE_STATUS_KEYS: Record<
  AiFeature,
  string
> = {
  chat: "chat_daily",
  quiz: "quiz",
  assignment: "assignment",
  pdf_analysis: "pdf_analysis",
  summary: "summary",
  study_plan: "study_plan",
};

export function findFeatureStatus(
  overview: AiUsageOverview | null | undefined,
  feature: AiFeature
): AiUsageFeatureStatus | null {
  if (!overview) return null;
  const key = FEATURE_STATUS_KEYS[feature];
  return overview.features.find((f) => f.feature === key) ?? null;
}

export function formatRemainingQuota(
  status: AiUsageFeatureStatus | null,
  label: string
): string | null {
  if (!status) return null;
  if (status.unlimited) {
    return `Unlimited ${label} on your plan`;
  }
  const remaining = status.remaining ?? 0;
  const limit = status.limit ?? 0;
  if (remaining <= 0) {
    return `No ${label} remaining this ${status.period === "day" ? "day" : "month"}`;
  }
  return `${remaining} of ${limit} ${label} remaining${
    status.period === "day" ? " today" : " this month"
  }`;
}

/** Client-side fetch of current AI usage overview. */
export async function fetchAiUsageClient(): Promise<AiUsageOverview> {
  const res = await fetch("/api/ai-usage", { cache: "no-store" });
  const data = (await res.json()) as AiUsageOverview & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to load AI usage");
  }
  return data;
}
