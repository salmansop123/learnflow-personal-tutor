"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { deleteReminder } from "@/lib/reminders";
import {
  createReminder,
  createStudyPlan,
  createTask,
  deleteStudyPlan,
  deleteStudySession,
  deleteTask,
  restoreStudySession,
  endStudySession,
  startStudySession,
  updateStudyPlan,
  updateTask,
} from "@/lib/study";
import type {
  ReminderRow,
  StudyPlanRow,
  StudySessionRow,
  TaskPriority,
  TaskRow,
} from "@/types/study";

function revalidateStudy() {
  revalidatePath("/dashboard/study");
  revalidatePath("/dashboard");
}

export async function startStudySessionAction(
  subjects: string[]
): Promise<StudySessionRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await startStudySession(session.user.id, subjects);
  revalidateStudy();
  return row;
}

export async function endStudySessionAction(
  sessionId: string,
  durationMins: number,
  notes?: string | null
): Promise<StudySessionRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await endStudySession(
    session.user.id,
    sessionId,
    durationMins,
    notes
  );
  revalidateStudy();
  return row;
}

export async function createStudyPlanAction(data: {
  title: string;
  subject: string;
  description?: string;
}): Promise<StudyPlanRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await createStudyPlan(session.user.id, data);
  revalidateStudy();
  return row;
}

export async function archiveStudyPlanAction(planId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await updateStudyPlan(session.user.id, planId, { isActive: false });
  revalidateStudy();
}

export async function deleteStudySessionAction(
  sessionId: string,
  reason?: string | null
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await deleteStudySession(session.user.id, sessionId, { reason });
  revalidateStudy();
}

export async function restoreStudySessionAction(
  sessionId: string
): Promise<StudySessionRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await restoreStudySession(session.user.id, sessionId);
  revalidateStudy();
  return row;
}

export async function deleteStudyPlanAction(planId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await deleteStudyPlan(session.user.id, planId);
  revalidateStudy();
}

export async function createTaskAction(data: {
  title: string;
  planId?: string | null;
  priority?: TaskPriority;
}): Promise<TaskRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await createTask(session.user.id, data);
  revalidateStudy();
  return row;
}

export async function toggleTaskAction(
  taskId: string,
  completed: boolean
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await updateTask(session.user.id, taskId, { completed });
  revalidateStudy();
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await deleteTask(session.user.id, taskId);
  revalidateStudy();
}

export async function createReminderAction(data: {
  title: string;
  body?: string;
  scheduledAt: string;
}): Promise<ReminderRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const row = await createReminder(session.user.id, {
    ...data,
    type: "STUDY",
  });
  revalidateStudy();
  revalidatePath("/dashboard");
  return row;
}

export async function deleteReminderAction(reminderId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await deleteReminder(session.user.id, reminderId);
  revalidateStudy();
  revalidatePath("/dashboard");
}
