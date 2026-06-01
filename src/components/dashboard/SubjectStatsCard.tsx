"use client";

import { format, subDays } from "date-fns";
import { useCallback, useMemo, useState, useTransition } from "react";

import { SubjectPieChart } from "@/components/dashboard/SubjectPieChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SubjectTotalStats } from "@/types/study";

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function buildLast7Days(): { iso: string; weekday: string; dayNum: string }[] {
  const base = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(base, i);
    return {
      iso: format(d, "yyyy-MM-dd"),
      weekday: format(d, "EEE"),
      dayNum: format(d, "d"),
    };
  });
}

export function SubjectStatsCard({
  profileSubjects,
  initialStats,
  initialDate,
}: {
  profileSubjects: string[];
  initialStats: SubjectTotalStats[];
  initialDate?: string;
}) {
  const days = useMemo(() => buildLast7Days(), []);
  const [selectedDate, setSelectedDate] = useState(initialDate ?? todayIso());
  const [stats, setStats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();

  const loadStats = useCallback((date: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/study/stats?date=${encodeURIComponent(date)}`
        );
        if (!res.ok) throw new Error("Failed to load stats");
        const data = (await res.json()) as SubjectTotalStats[];
        setStats(data);
      } catch {
        setStats([]);
      }
    });
  }, []);

  const handleSelectDate = (iso: string) => {
    setSelectedDate(iso);
    loadStats(iso);
  };

  const selectedLabel = useMemo(() => {
    const d = days.find((day) => day.iso === selectedDate);
    if (!d) return selectedDate;
    const isToday = selectedDate === todayIso();
    return isToday ? "Today" : `${d.weekday} ${d.dayNum}`;
  }, [days, selectedDate]);

  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-base">Time by Subject</CardTitle>
          <CardDescription>
            Study time breakdown for {selectedLabel}. Pick another day from the
            last 7 days.
          </CardDescription>
        </div>
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Select day for subject breakdown"
        >
          {days.map((day) => {
            const active = day.iso === selectedDate;
            const isToday = day.iso === todayIso();
            return (
              <button
                key={day.iso}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={isPending}
                onClick={() => handleSelectDate(day.iso)}
                className={cn(
                  "flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-center text-xs transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
                )}
              >
                <span className="font-semibold uppercase tracking-wide">
                  {isToday ? "Today" : day.weekday}
                </span>
                <span className="tabular-nums text-[11px] opacity-80">
                  {day.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className={cn(isPending && "opacity-60")}>
        <SubjectPieChart profileSubjects={profileSubjects} stats={stats} />
      </CardContent>
    </Card>
  );
}
