import { serverApiFetch } from "@/lib/api-server";
import type {
  ActivityPoint,
  DashboardPageData,
  QuizRow,
  RecentChatRow,
  StudySessionRow,
  TaskRow,
  UpcomingReminderRow,
} from "@/types/dashboard";

function buildActivityChart(sessions: StudySessionRow[]): ActivityPoint[] {
  const now = new Date();
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const daySet = new Set(dayKeys);
  const minutesByDay = Object.fromEntries(dayKeys.map((d) => [d, 0]));

  for (const session of sessions) {
    const key = new Date(session.startedAt).toISOString().slice(0, 10);
    if (daySet.has(key)) {
      minutesByDay[key] += session.durationMins ?? 0;
    }
  }

  return dayKeys.map((date) => ({ date, minutes: minutesByDay[date] }));
}

export async function getDashboardPageData(
  userId: string
): Promise<DashboardPageData> {
  const [sessions, tasks, recentChats, quizzes, upcomingReminders] =
    await Promise.all([
      serverApiFetch<StudySessionRow[]>("/dashboard/sessions", userId),
      serverApiFetch<TaskRow[]>("/dashboard/tasks", userId),
      serverApiFetch<RecentChatRow[]>("/dashboard/conversations", userId),
      serverApiFetch<QuizRow[]>("/dashboard/quizzes", userId),
      serverApiFetch<UpcomingReminderRow[]>(
        "/dashboard/reminders",
        userId
      ),
    ]);

  const totalMins = sessions.reduce(
    (acc, s) => acc + (s.durationMins ?? 0),
    0
  );
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activity = buildActivityChart(sessions);

  return {
    sessions,
    tasks,
    recentChats,
    quizzes,
    upcomingReminders,
    stats: {
      studyHours: (totalMins / 60).toFixed(1),
      sessionCount: sessions.length,
      tasksDone: completedTasks,
      quizCount: quizzes.length,
    },
    activity,
  };
}
