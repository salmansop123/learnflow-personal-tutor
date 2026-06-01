"use client";

import { Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  deleteTaskAction,
  toggleTaskAction,
} from "@/app/dashboard/study/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/types/study";

export function TaskList({
  tasks,
  emptyMessage,
  variant = "default",
}: {
  tasks: TaskRow[];
  emptyMessage: string;
  variant?: "pending" | "default";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const refresh = () => router.refresh();

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  const showCompleteTick = variant === "pending";

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="group flex items-start gap-2 rounded-lg border border-border/60 p-3 transition-colors hover:border-border hover:bg-muted/30"
        >
          {showCompleteTick ? (
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await toggleTaskAction(task.id, true);
                  refresh();
                })
              }
              className="mt-0.5 shrink-0 border-primary/30 text-primary transition-colors hover:border-primary hover:bg-primary/10"
              aria-label="Mark task complete"
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await toggleTaskAction(task.id, !task.completed);
                  refresh();
                })
              }
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors",
                task.completed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40 hover:border-primary"
              )}
              aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
            >
              {task.completed ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : null}
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium",
                task.completed && "text-muted-foreground line-through"
              )}
            >
              {task.title}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {task.priority.toLowerCase()} priority
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deleteTaskAction(task.id);
                refresh();
              })
            }
            className="opacity-70 transition-opacity hover:opacity-100"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  );
}
