export type StudySessionRow = {
  id: string;
  subject: string;
  startedAt: string;
  endedAt: string | null;
  durationMins: number | null;
};

export type TaskRow = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
};

export type QuizRow = {
  id: string;
  subject: string;
  score: number;
  createdAt: string;
};

export type ActivityPoint = {
  date: string;
  minutes: number;
};

export type RecentChatRow = {
  id: string;
  title: string;
  subject: string | null;
  createdAt: string;
};

export type UpcomingReminderRow = {
  id: string;
  title: string;
  body: string | null;
  scheduledAt: string;
  type: string;
};

export type DashboardPageData = {
  sessions: StudySessionRow[];
  tasks: TaskRow[];
  recentChats: RecentChatRow[];
  quizzes: QuizRow[];
  upcomingReminders: UpcomingReminderRow[];
  stats: {
    studyHours: string;
    sessionCount: number;
    tasksDone: number;
    quizCount: number;
  };
  activity: ActivityPoint[];
};
