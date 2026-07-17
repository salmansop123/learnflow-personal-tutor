"use client";

import { USAGE_COMPARISON_ROWS } from "@/lib/ai-usage-limits";
import { cn } from "@/lib/utils";

export function UsageComparisonTable({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border bg-card", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">
          AI usage limits by subscription plan
        </caption>
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 font-semibold">Feature</th>
            <th className="px-4 py-3 font-semibold">Free</th>
            <th className="px-4 py-3 font-semibold">Pro</th>
            <th className="px-4 py-3 font-semibold">Premium</th>
          </tr>
        </thead>
        <tbody>
          {USAGE_COMPARISON_ROWS.map((row) => (
            <tr key={row.feature} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">
                {row.feature}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.free}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.pro}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.premium}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
