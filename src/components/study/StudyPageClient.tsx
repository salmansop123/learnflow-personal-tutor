"use client";

import { Calendar, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toast, toastError } from "@/lib/toast";

import {
  createStudyPlanAction,
  createTaskAction,
} from "@/app/dashboard/study/actions";
import { ExportStudySessionsPDF } from "@/components/study/ExportStudySessionsPDF";
import { ReminderForm } from "@/components/study/ReminderForm";
import { ReminderList } from "@/components/study/ReminderList";
import { SessionTimer } from "@/components/study/SessionTimer";
import { DeletedSessionsPanel } from "@/components/study/DeletedSessionsPanel";
import { PastSessionRow } from "@/components/study/PastSessionRow";
import { StudyPlanCard } from "@/components/study/StudyPlanCard";
import { TaskList } from "@/components/study/TaskList";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StudyPageData, TaskPriority } from "@/types/study";

export function StudyPageClient({ data }: { data: StudyPageData }) {
  const pendingTasks = data.tasks.filter((t) => !t.completed);
  const completedTasks = data.tasks.filter((t) => t.completed);
  const activePlans = data.plans.filter((p) => p.isActive);
  const completedPlans = data.plans.filter((p) => !p.isActive);
  const completedSessions = data.sessions.filter((s) => s.endedAt != null);

  const hoursBySubject = completedSessions.reduce<Record<string, number>>(
    (acc, s) => {
      const mins = s.durationMins ?? 0;
      acc[s.subject] = (acc[s.subject] ?? 0) + mins;
      return acc;
    },
    {}
  );

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Pending</h2>

        <SessionTimer
          activeSession={data.activeSession}
          defaultSubject={activePlans[0]?.subject ?? "General"}
        />

        <QuickAddTask plans={activePlans} />
        <QuickAddPlan />

        <ReminderForm />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending tasks</CardTitle>
            <CardDescription>{pendingTasks.length} open</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={pendingTasks}
              variant="pending"
              emptyMessage="No pending tasks. Add one above."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePlans.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No active study plans"
                description="Create a plan to organize tasks by subject."
                className="py-6"
              />
            ) : (
              activePlans.map((plan) => (
                <StudyPlanCard key={plan.id} plan={plan} showArchive />
              ))
            )}
          </CardContent>
        </Card>

      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Completed</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList
              tasks={completedTasks}
              emptyMessage="No completed tasks yet."
            />
          </CardContent>
        </Card>

        {Object.keys(hoursBySubject).length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hours by subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {Object.entries(hoursBySubject).map(([subject, mins]) => (
                  <li
                    key={subject}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>{subject}</span>
                    <span>{(mins / 60).toFixed(1)} h</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Past sessions</CardTitle>
              <CardDescription>
                {completedSessions.length} logged
              </CardDescription>
            </div>
            <ExportStudySessionsPDF
              sessions={data.sessions}
              hoursBySubject={hoursBySubject}
            />
          </CardHeader>
          <CardContent>
            {completedSessions.length === 0 ? (
              <EmptyState
                icon={History}
                title="No past sessions"
                description="End an active timer session to log study time here."
                className="py-6"
              />
            ) : (
              <ul className="space-y-2">
                {completedSessions.map((session) => (
                  <PastSessionRow key={session.id} session={session} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <DeletedSessionsPanel deletedSessions={data.deletedSessions} />

        <ReminderList reminders={data.reminders} />


        {completedPlans.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Archived plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedPlans.map((plan) => (
                <StudyPlanCard key={plan.id} plan={plan} showDelete />
              ))}
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function QuickAddTask({ plans }: { plans: { id: string; title: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [planId, setPlanId] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add task</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            startTransition(async () => {
              try {
                await createTaskAction({
                  title: title.trim(),
                  planId: planId || null,
                  priority,
                });
                setTitle("");
                toast.success("Task added");
                router.refresh();
              } catch (err) {
                toastError(err, "Failed to add task");
              }
            });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="flex-1"
          />
          {plans.length > 0 ? (
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">No plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          ) : null}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <Button type="submit" disabled={isPending}>
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function QuickAddPlan() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create plan</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !subject.trim()) return;
            startTransition(async () => {
              try {
                await createStudyPlanAction({
                  title: title.trim(),
                  subject: subject.trim(),
                });
                setTitle("");
                setSubject("");
                toast.success("Study plan created");
                router.refresh();
              } catch (err) {
                toastError(err, "Failed to create plan");
              }
            });
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Plan title"
            required
          />
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            required
          />
          <Button type="submit" disabled={isPending} className="w-full">
            Create plan
          </Button>
        </form>
      </CardContent>
    </Card>
    
  );
}
