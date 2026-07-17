import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { GlobalStudyTimer } from "@/components/study/GlobalStudyTimer";
import { SubjectTimeLogModal } from "@/components/study/SubjectTimeLogModal";
import { auth } from "@/lib/auth";
import { getProfileCompletionScore, getProfileOptional } from "@/lib/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getProfileOptional(session.user.id);
  if (!profile) {
    redirect("/login?reason=account_missing");
  }

  const profileCompletionPct = getProfileCompletionScore(profile);

  return (
    <DashboardShell
      userName={session.user.name}
      userEmail={session.user.email}
      userPlan={session.user.plan}
      profileCompletionPct={profileCompletionPct}
    >
      {children}
      <GlobalStudyTimer />
      <SubjectTimeLogModal />
    </DashboardShell>
  );
}
