export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type StudySessionRow = {
  id: string;
  subject: string;
  startedAt: string;
  endedAt: string | null;
  durationMins: number | null;
  notes: string | null;
  subjects: string[];
  subjectTimeLog: Record<string, number> | null;
  timeLogCompleted: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deleteReason?: string | null;
};

/** Alias for study session records (same shape as StudySessionRow). */
export type StudySession = StudySessionRow;

export type StudyPlanRow = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  goalDate: string | null;
  isActive: boolean;
  createdAt: string;
  taskCount: number;
};

export type TaskRow = {
  id: string;
  planId: string | null;
  title: string;
  completed: boolean;
  dueDate: string | null;
  priority: TaskPriority;
  createdAt: string;
};

export type ReminderRow = {
  id: string;
  title: string;
  body: string | null;
  scheduledAt: string;
  sent: boolean;
  type: string;
};

export type StudyPageData = {
  sessions: StudySessionRow[];
  deletedSessions: StudySessionRow[];
  plans: StudyPlanRow[];
  tasks: TaskRow[];
  activeSession: StudySessionRow | null;
  reminders: ReminderRow[];
};

export interface SubjectTimeEntry {
  subject: string;
  minutesSpent: number;
  percentage: number;
}

export interface SessionTimeLogPayload {
  sessionId: string;
  subjectTimeLog: Record<string, number>;
}

export interface SubjectTotalStats {
  subject: string;
  totalMinutes: number;
  percentage: number;
  color: string;
}
