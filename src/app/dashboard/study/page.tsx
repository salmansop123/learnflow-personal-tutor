import { redirect } from "next/navigation";

import { StudyPageClient } from "@/components/study/StudyPageClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";
import { getStudyPageData } from "@/lib/study";

export default async function StudyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const data = await getStudyPageData(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study"
        description="Manage plans, tasks, and timed study sessions."
      />
      <StudyPageClient data={data} />
    </div>
  );
}
