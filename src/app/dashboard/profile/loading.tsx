import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}
