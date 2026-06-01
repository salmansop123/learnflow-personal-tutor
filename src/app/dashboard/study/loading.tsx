import { PageHeader } from "@/components/layout/PageHeader";
import { StudyPageSkeleton } from "@/components/ui/skeleton";

export default function StudyLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Study" description="Loading your study workspace…" />
      <StudyPageSkeleton />
    </div>
  );
}
