"use client";

import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BarChart3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActivityPoint } from "@/types/dashboard";

function formatDayLabel(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

export function ActivityChart({
  data,
  className,
}: {
  data: ActivityPoint[];
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const chartData = data.map((point) => ({
    ...point,
    label: formatDayLabel(point.date),
  }));

  const hasData = data.some((p) => p.minutes > 0);

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle className="text-base">Study activity</CardTitle>
        <CardDescription>Minutes studied per day (last 7 days)</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={BarChart3}
            title="No study activity yet"
            description="Start a timer on the Study tab to see your minutes here."
            actionLabel="Go to Study"
            actionHref="/dashboard/study"
            className="min-h-[240px] py-10"
          />
        ) : (
          <div className="h-[240px] w-full [&_.recharts-cartesian-grid-horizontal_line]:stroke-[var(--chart-grid)] [&_.recharts-cartesian-grid-vertical_line]:stroke-[var(--chart-grid)]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-bar)" />
                    <stop offset="100%" stopColor="var(--chart-bar-end)" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--chart-grid)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{
                    fill: "var(--chart-cursor)",
                    stroke: "none",
                    radius: 6,
                  }}
                  formatter={(value) => [`${value ?? 0} min`, "Studied"]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as { date?: string };
                    return row?.date
                      ? new Date(row.date + "T12:00:00").toLocaleDateString()
                      : "";
                  }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    boxShadow: "var(--shadow-card)",
                    backdropFilter: "blur(12px)",
                  }}
                  itemStyle={{ color: "var(--popover-foreground)" }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                />
                <Bar
                  dataKey="minutes"
                  fill={`url(#${gradientId})`}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                  activeBar={{
                    fill: "var(--chart-bar-active)",
                    stroke: "var(--primary)",
                    strokeWidth: 1,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
