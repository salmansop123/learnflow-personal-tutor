import { PageHeader } from "@/components/layout/PageHeader";
import { NotesListSkeleton } from "@/components/ui/skeleton";

export default function NotesLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notes" description="Loading your notes…" />
      <div className="grid gap-6 lg:grid-cols-2">
        <NotesListSkeleton />
        <div className="hidden min-h-[320px] rounded-xl border border-dashed lg:block" />
      </div>
    </div>
  );
}
