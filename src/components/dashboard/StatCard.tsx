import type { LucideIcon } from "lucide-react";
import { BookOpen, Brain, CheckCircle2, Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const iconMap = {
  clock: Clock,
  book: BookOpen,
  check: CheckCircle2,
  brain: Brain,
} as const;

const iconStyleMap = {
  clock: "stat-icon-blue",
  book: "stat-icon-violet",
  check: "stat-icon-green",
  brain: "stat-icon-violet",
} as const;

export type StatCardIcon = keyof typeof iconMap;

export function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon: StatCardIcon;
  className?: string;
}) {
  const Icon: LucideIcon = iconMap[icon];
  const iconStyle = iconStyleMap[icon];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            iconStyle
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
