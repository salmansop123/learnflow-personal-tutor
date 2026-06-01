import { PageHeader } from "@/components/layout/PageHeader";
import { QuizSkeleton } from "@/components/ui/skeleton";

export default function QuizLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Quiz" description="Loading quiz engine…" />
      <QuizSkeleton />
    </div>
  );
}
