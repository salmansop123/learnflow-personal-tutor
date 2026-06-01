import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProfileCompletionBanner({
  completionPct,
  educationIncomplete,
}: {
  completionPct: number;
  educationIncomplete?: boolean;
}) {
  if (completionPct >= 60) return null;

  return (
    <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            Your profile is <strong>{completionPct}%</strong> complete. Complete it
            to unlock personalised AI tutoring.
          </p>
          {educationIncomplete ? (
            <p>
              Complete your education profile so your AI tutor can calibrate
              explanations to your exact level.
            </p>
          ) : null}
        </div>
        <Link
          href="/dashboard/profile"
          className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
        >
          Complete profile
        </Link>
      </div>
    </div>
  );
}
