import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/80",
        className
      )}
      {...props}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-8 w-16" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="glass-panel h-[320px] rounded-xl lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="glass-panel h-[150px] rounded-xl" />
          <Skeleton className="glass-panel h-[150px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function NotesListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

function StudyPageSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="glass-panel h-64 rounded-xl" />
        <Skeleton className="glass-panel h-40 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="glass-panel h-48 rounded-xl" />
      </div>
    </div>
  );
}

function QuizSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6" aria-busy="true">
      <Skeleton className="glass-panel h-48 rounded-xl" />
      <Skeleton className="glass-panel h-64 rounded-xl" />
    </div>
  );
}

export {
  Skeleton,
  StatCardSkeleton,
  DashboardSkeleton,
  NotesListSkeleton,
  StudyPageSkeleton,
  QuizSkeleton,
};
