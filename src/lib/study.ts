import { serverApiFetch } from "@/lib/api-server";
import { listReminders } from "@/lib/reminders";
import type {
  StudyPageData,
  StudyPlanRow,
  StudySessionRow,
  SubjectTotalStats,
  TaskRow,
} from "@/types/study";

export async function getStudyPageData(userId: string): Promise<StudyPageData> {
  const [sessions, deletedSessions, plans, tasks, activeSession, reminders] =
    await Promise.all([
      serverApiFetch<StudySessionRow[]>("/study/sessions", userId),
      serverApiFetch<StudySessionRow[]>(
        "/study/sessions?deleted=true",
        userId
      ),
      serverApiFetch<StudyPlanRow[]>("/study/plans", userId),
      serverApiFetch<TaskRow[]>("/study/tasks", userId),
      serverApiFetch<StudySessionRow | null>("/study/sessions/active", userId),
      listReminders(userId),
    ]);

  return { sessions, deletedSessions, plans, tasks, activeSession, reminders };
}

export async function startStudySession(
  userId: string,
  subjects: string[],
  notes?: string | null
): Promise<StudySessionRow> {
  return serverApiFetch<StudySessionRow>("/study/sessions", userId, {
    method: "POST",
    body: JSON.stringify({ subjects, notes }),
  });
}

export async function endStudySession(
  userId: string,
  sessionId: string,
  durationMins: number,
  notes?: string | null,
  endedAt?: string
): Promise<StudySessionRow> {
  return serverApiFetch<StudySessionRow>(
    `/study/sessions/${sessionId}`,
    userId,
    {
      method: "PATCH",
      body: JSON.stringify({
        action: "end",
        durationMins,
        notes,
        endedAt: endedAt ?? new Date().toISOString(),
      }),
    }
  );
}

export async function logStudySessionTime(
  userId: string,
  sessionId: string,
  subjectTimeLog: Record<string, number>
): Promise<StudySessionRow> {
  return serverApiFetch<StudySessionRow>(
    `/study/sessions/${sessionId}`,
    userId,
    {
      method: "PATCH",
      body: JSON.stringify({
        action: "logTime",
        subjectTimeLog,
      }),
    }
  );
}

export async function getSubjectStudyStats(
  userId: string,
  onDate?: string
): Promise<SubjectTotalStats[]> {
  const qs = onDate ? `?date=${encodeURIComponent(onDate)}` : "";
  return serverApiFetch<SubjectTotalStats[]>(`/study/stats${qs}`, userId);
}

export async function createStudyPlan(
  userId: string,
  data: {
    title: string;
    subject: string;
    description?: string | null;
    goalDate?: string | null;
  }
): Promise<StudyPlanRow> {
  return serverApiFetch<StudyPlanRow>("/study/plans", userId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateStudyPlan(
  userId: string,
  planId: string,
  data: { isActive?: boolean; title?: string }
): Promise<StudyPlanRow> {
  return serverApiFetch<StudyPlanRow>(`/study/plans/${planId}`, userId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createTask(
  userId: string,
  data: {
    title: string;
    planId?: string | null;
    priority?: string;
    dueDate?: string | null;
  }
): Promise<TaskRow> {
  return serverApiFetch<TaskRow>("/study/tasks", userId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: {
    completed?: boolean;
    title?: string;
    priority?: string;
  }
): Promise<TaskRow> {
  return serverApiFetch<TaskRow>(`/study/tasks/${taskId}`, userId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(
  userId: string,
  taskId: string
): Promise<void> {
  await serverApiFetch(`/study/tasks/${taskId}`, userId, {
    method: "DELETE",
  });
}

export async function deleteStudySession(
  userId: string,
  sessionId: string,
  options?: { reason?: string | null; permanent?: boolean }
): Promise<StudySessionRow | void> {
  const params = new URLSearchParams();
  if (options?.permanent) params.set("permanent", "true");
  if (options?.reason?.trim()) params.set("reason", options.reason.trim());
  const qs = params.toString();
  const path = `/study/sessions/${sessionId}${qs ? `?${qs}` : ""}`;
  const result = await serverApiFetch<StudySessionRow | null>(path, userId, {
    method: "DELETE",
  });
  return result ?? undefined;
}

export async function restoreStudySession(
  userId: string,
  sessionId: string
): Promise<StudySessionRow> {
  return serverApiFetch<StudySessionRow>(
    `/study/sessions/${sessionId}`,
    userId,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "restore" }),
    }
  );
}

export async function deleteStudyPlan(
  userId: string,
  planId: string
): Promise<void> {
  await serverApiFetch(`/study/plans/${planId}`, userId, {
    method: "DELETE",
  });
}

export { createReminder, listReminders } from "@/lib/reminders";
