"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { API_UNREACHABLE_MESSAGE, isApiUnreachableError } from "@/lib/api-errors";
import { cn } from "@/lib/utils";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 rounded-xl border border-dashed bg-muted/20 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold">Dashboard error</h2>
        <p className="text-sm text-muted-foreground">
          {isApiUnreachableError(error)
            ? API_UNREACHABLE_MESSAGE
            : "We could not load this page. Your session is still safe — try refreshing."}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className={buttonVariants()}
        >
          Retry
        </button>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to overview
        </Link>
      </div>
    </div>
  );
}
