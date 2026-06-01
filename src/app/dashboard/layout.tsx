import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { GlobalStudyTimer } from "@/components/study/GlobalStudyTimer";
import { SubjectTimeLogModal } from "@/components/study/SubjectTimeLogModal";
import { getProfile, getProfileCompletionScore } from "@/lib/profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let profileCompletionPct = 100;
  try {
    const profile = await getProfile(session.user.id);
    profileCompletionPct = getProfileCompletionScore(profile);
  } catch {
    /* backend unavailable */
  }

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
