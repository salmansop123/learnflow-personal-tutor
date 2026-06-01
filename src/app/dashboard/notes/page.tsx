import { redirect } from "next/navigation";
import { Suspense } from "react";

import { NotesPageClient } from "@/components/notes/NotesPageClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";
import { listNotes } from "@/lib/notes";

export default async function NotesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const notes = await listNotes(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        description="Capture ideas, pin AI tutor replies, and organize with tags."
      />
      <Suspense fallback={null}>
        <NotesPageClient notes={notes} />
      </Suspense>
    </div>
  );
}
