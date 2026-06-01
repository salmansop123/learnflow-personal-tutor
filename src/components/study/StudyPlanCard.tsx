"use client";

import { Archive, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  archiveStudyPlanAction,
  deleteStudyPlanAction,
} from "@/app/dashboard/study/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StudyPlanRow } from "@/types/study";

export function StudyPlanCard({
  plan,
  showArchive = false,
  showDelete = false,
}: {
  plan: StudyPlanRow;
  showArchive?: boolean;
  showDelete?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Card className="transition-shadow hover:shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{plan.title}</CardTitle>
              <CardDescription>{plan.subject}</CardDescription>
            </div>
            <div className="flex shrink-0 gap-1">
              {showArchive && plan.isActive ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await archiveStudyPlanAction(plan.id);
                      router.refresh();
                    })
                  }
                  aria-label="Archive plan"
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
              {showDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={isPending}
                  onClick={() => setConfirmOpen(true)}
                  aria-label="Delete plan"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {plan.description ? (
            <p className="mb-2 line-clamp-2">{plan.description}</p>
          ) : null}
          <p>
            {plan.taskCount} task{plan.taskCount === 1 ? "" : "s"}
            {!plan.isActive ? " · Archived" : ""}
          </p>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete archived plan?"
        description="This will permanently remove the plan and cannot be undone. Linked tasks may be affected."
        confirmLabel="Delete plan"
        isLoading={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            await deleteStudyPlanAction(plan.id);
            setConfirmOpen(false);
            router.refresh();
          })
        }
      />
    </>
  );
}
