import { redirect } from "next/navigation";

import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { RecentChats } from "@/components/dashboard/RecentChats";
import { StatCard } from "@/components/dashboard/StatCard";
import { SubjectStatsCard } from "@/components/dashboard/SubjectStatsCard";
import { UpcomingReminders } from "@/components/dashboard/UpcomingReminders";
import { ProfileCompletionBanner } from "@/components/dashboard/ProfileCompletionBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getDashboardPageData } from "@/lib/dashboard";
import { getProfile, getProfileCompletionScore } from "@/lib/profile";
import { getSubjectStudyStats } from "@/lib/study";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = format(new Date(), "yyyy-MM-dd");

  const [data, profile, subjectStats] = await Promise.all([
    getDashboardPageData(session.user.id),
    getProfile(session.user.id).catch(() => null),
    getSubjectStudyStats(session.user.id, today).catch(() => []),
  ]);
  const profileSubjects = profile?.subjectNames ?? [];
  const completionPct = profile
    ? getProfileCompletionScore(profile)
    : 100;

  return (
    <div className="space-y-6">
      <ProfileCompletionBanner
        completionPct={completionPct}
        educationIncomplete={
          profile != null &&
          (!profile.educationArchetype || !profile.educationTier)
        }
      />
      <PageHeader
        title="Overview"
        description={
          session.user.name
            ? `Welcome back, ${session.user.name}.`
            : "Your learning activity at a glance."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Study Hours"
          value={data.stats.studyHours}
          icon="clock"
        />
        <StatCard
          label="Sessions"
          value={data.stats.sessionCount}
          icon="book"
        />
        <StatCard
          label="Tasks Done"
          value={data.stats.tasksDone}
          icon="check"
        />
        <StatCard
          label="Quizzes"
          value={data.stats.quizCount}
          icon="brain"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <ActivityChart data={data.activity} />
          <SubjectStatsCard
            profileSubjects={profileSubjects}
            initialStats={subjectStats}
            initialDate={today}
          />
        </div>
        <div className="space-y-4 lg:col-span-1">
          <RecentChats chats={data.recentChats} />
          <UpcomingReminders reminders={data.upcomingReminders} />
        </div>
      </div>
    </div>
  );
}
