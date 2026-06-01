"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { findDuplicateSubjectGroups } from "@/lib/subject-normalizer";
import type { SubjectTotalStats } from "@/types/study";

const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
] as const;

const GRAY_COLOR = "#94A3B8";
const MAX_PIE_SLICES = 6;

type PieSlice = SubjectTotalStats & {
  otherBreakdown?: SubjectTotalStats[];
};

function formatShortDuration(minutes: number): string {
  if (minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function formatLongDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours} hours ${mins} minutes`;
  if (hours > 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${mins} ${mins === 1 ? "minute" : "minutes"}`;
}

function colorAtIndex(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function subjectIndex(subject: string, legendSubjects: string[]): number {
  const idx = legendSubjects.findIndex(
    (s) => s.toLowerCase() === subject.toLowerCase()
  );
  return idx >= 0 ? idx : legendSubjects.length;
}

function buildChartLegend(
  profileSubjects: string[],
  stats: SubjectTotalStats[]
): {
  legendSubjects: string[];
  customSubjects: Set<string>;
  statsOnly: boolean;
} {
  const profileLower = new Set(
    profileSubjects.map((s) => s.toLowerCase())
  );

  if (profileSubjects.length === 0) {
    const seen = new Set<string>();
    const fromStats: string[] = [];
    for (const entry of stats) {
      if (entry.totalMinutes <= 0) continue;
      const key = entry.subject.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      fromStats.push(entry.subject);
    }
    return {
      legendSubjects: fromStats,
      customSubjects: new Set(),
      statsOnly: true,
    };
  }

  const customSubjects = new Set<string>();
  for (const entry of stats) {
    if (entry.totalMinutes <= 0) continue;
    if (!profileLower.has(entry.subject.toLowerCase())) {
      customSubjects.add(entry.subject);
    }
  }

  return {
    legendSubjects: [...profileSubjects, ...Array.from(customSubjects)],
    customSubjects,
    statsOnly: false,
  };
}

/** Top N−1 subjects plus an "Other" bucket for the rest. */
function aggregatePieSlices(stats: SubjectTotalStats[]): PieSlice[] {
  const sorted = [...stats]
    .filter((s) => s.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  if (sorted.length === 0) return [];

  const grand = sorted.reduce((sum, s) => sum + s.totalMinutes, 0);

  let slices: PieSlice[];
  if (sorted.length <= MAX_PIE_SLICES) {
    slices = sorted;
  } else {
    const top = sorted.slice(0, MAX_PIE_SLICES - 1);
    const rest = sorted.slice(MAX_PIE_SLICES - 1);
    const otherMins = rest.reduce((sum, s) => sum + s.totalMinutes, 0);
    slices = [
      ...top,
      {
        subject: "Other",
        totalMinutes: otherMins,
        percentage: 0,
        color: GRAY_COLOR,
        otherBreakdown: rest,
      },
    ];
  }

  return slices.map((entry, index) => ({
    ...entry,
    percentage:
      grand > 0
        ? Math.round((entry.totalMinutes / grand) * 1000) / 10
        : 0,
    color:
      entry.subject === "Other" ? GRAY_COLOR : colorAtIndex(index),
  }));
}

type TooltipPayload = {
  payload?: PieSlice;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const item = payload[0].payload;
  return (
    <div className="max-w-xs rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-popover-foreground">{item.subject}</p>
      <p className="text-muted-foreground">
        Total time: {formatLongDuration(item.totalMinutes)}
      </p>
      <p className="text-muted-foreground">
        Percentage: {item.percentage}%
      </p>
      {item.otherBreakdown && item.otherBreakdown.length > 0 ? (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto border-t pt-2 text-xs text-muted-foreground">
          {item.otherBreakdown.map((sub) => (
            <li key={sub.subject} className="flex justify-between gap-3">
              <span className="truncate">{sub.subject}</span>
              <span className="shrink-0 tabular-nums">
                {formatShortDuration(sub.totalMinutes)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LegendItem({
  subject,
  minutes,
  pct,
  color,
  isCustom,
}: {
  subject: string;
  minutes: number;
  pct: number;
  color: string;
  isCustom?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 text-xs">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span
        className="min-w-0 max-w-[140px] truncate text-foreground"
        title={subject}
      >
        {subject}
        {isCustom ? (
          <span className="ml-1 italic text-slate-400">(Custom)</span>
        ) : null}
      </span>
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {minutes > 0 ? formatShortDuration(minutes) : "—"}
      </span>
      <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
        {pct > 0 ? `${pct}%` : "0%"}
      </span>
    </li>
  );
}

export function SubjectPieChart({
  profileSubjects,
  stats,
}: {
  profileSubjects: string[];
  stats: SubjectTotalStats[];
}) {
  const { legendSubjects, customSubjects, statsOnly } = buildChartLegend(
    profileSubjects,
    stats
  );

  const statsMap = new Map(
    stats.map((s) => [s.subject.toLowerCase(), s] as const)
  );

  const pieSlices = useMemo(() => aggregatePieSlices(stats), [stats]);
  const hasData = pieSlices.length > 0;
  const totalMinutes = stats.reduce((sum, s) => sum + s.totalMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const duplicateGroups = useMemo(
    () =>
      findDuplicateSubjectGroups(
        stats.filter((s) => s.totalMinutes > 0).map((s) => s.subject)
      ),
    [stats]
  );

  const breakdownRows = statsOnly
    ? [...legendSubjects]
    : [
        ...[...profileSubjects].sort((a, b) => {
          const minsA = statsMap.get(a.toLowerCase())?.totalMinutes ?? 0;
          const minsB = statsMap.get(b.toLowerCase())?.totalMinutes ?? 0;
          if (minsA === 0 && minsB === 0) return 0;
          if (minsA === 0) return 1;
          if (minsB === 0) return -1;
          return minsB - minsA;
        }),
        ...Array.from(customSubjects),
      ];

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        {statsOnly ? (
          <p className="mb-4 max-w-sm rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40">
            Add subjects to your profile to see them tracked here even before
            you start a session.{" "}
            <Link
              href="/dashboard/profile"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Go to Profile →
            </Link>
          </p>
        ) : null}
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full border-2 border-dashed border-slate-300"
          aria-hidden
        />
        <p className="mt-4 text-sm font-medium text-slate-700">
          No study time recorded for this day
        </p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Log subject time on a session for the selected day to see your
          breakdown here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statsOnly ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40">
          Add subjects to your profile to see them tracked here even before you
          start a session.{" "}
          <Link
            href="/dashboard/profile"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Go to Profile →
          </Link>
        </p>
      ) : null}

      {duplicateGroups.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500 bg-[#FFFBEB] px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:bg-amber-950/30">
          <div className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              aria-hidden
            />
            <p>
              We detected {duplicateGroups.length} possible duplicate
              subject
              {duplicateGroups.length === 1 ? "" : "s"} in your session
              history. Merging them will give you a more accurate chart.
            </p>
          </div>
          <Link
            href="/dashboard/profile#subject-merge-tool"
            className="inline-flex shrink-0 items-center justify-center rounded-md border border-amber-600 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50 dark:bg-transparent dark:text-amber-200"
          >
            Fix duplicates →
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="relative mx-auto h-[260px] w-full max-w-[280px] shrink-0 lg:h-[280px] lg:max-w-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieSlices}
                dataKey="totalMinutes"
                nameKey="subject"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {pieSlices.map((entry) => (
                  <Cell
                    key={entry.subject}
                    fill={
                      entry.subject === "Other"
                        ? GRAY_COLOR
                        : colorAtIndex(
                            subjectIndex(entry.subject, legendSubjects)
                          )
                    }
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {totalHours}h
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Legend
            </p>
            <ul className="space-y-1.5">
              {pieSlices.map((entry) => (
                <LegendItem
                  key={entry.subject}
                  subject={entry.subject}
                  minutes={entry.totalMinutes}
                  pct={entry.percentage}
                  color={
                    entry.subject === "Other"
                      ? GRAY_COLOR
                      : colorAtIndex(
                          subjectIndex(entry.subject, legendSubjects)
                        )
                  }
                />
              ))}
            </ul>
          </div>

          <ul className="space-y-3 border-t pt-4">
            {breakdownRows.map((subject) => {
              const entry = statsMap.get(subject.toLowerCase());
              const minutes = entry?.totalMinutes ?? 0;
              const pct = entry?.percentage ?? 0;
              const colorIdx = subjectIndex(subject, legendSubjects);
              const color =
                minutes > 0 ? colorAtIndex(colorIdx) : GRAY_COLOR;
              const isCustom = customSubjects.has(subject);
              return (
                <li key={subject} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <span
                        className="max-w-[min(100%,12rem)] truncate font-medium"
                        title={subject}
                      >
                        {subject}
                        {isCustom ? (
                          <span className="ml-1 italic text-slate-400">
                            (Custom)
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 tabular-nums text-muted-foreground">
                      <span>{formatShortDuration(minutes)}</span>
                      <span className="w-10 text-right">
                        {pct > 0 ? `${pct}%` : "0%"}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
