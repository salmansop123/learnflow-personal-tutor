import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 sm:px-6">
      <Skeleton className="mx-auto h-12 w-3/4 max-w-lg" />
      <Skeleton className="mx-auto h-6 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
