"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";

import { changePlanAction } from "@/app/dashboard/billing/actions";
import { toast, toastError } from "@/lib/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserPlan } from "@/types/user";

export function BillingPlanButton({
  targetPlan,
  currentPlan,
  planName,
  highlighted,
}: {
  targetPlan: UserPlan;
  currentPlan: UserPlan;
  planName: string;
  highlighted?: boolean;
}) {
  const router = useRouter();
  const { update } = useSession();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (targetPlan === currentPlan) {
    return (
      <span
        className={cn(
          buttonVariants({ variant: "secondary" }),
          "inline-flex w-full cursor-default justify-center opacity-80"
        )}
      >
        Current plan
      </span>
    );
  }

  if (targetPlan === "ENTERPRISE") {
    return (
      <Link
        href="/contact"
        className={cn(
          buttonVariants({ variant: highlighted ? "default" : "outline" }),
          "inline-flex w-full justify-center"
        )}
      >
        Contact sales
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setConfirmOpen(true)}
        className={cn(
          buttonVariants({ variant: highlighted ? "default" : "outline" }),
          "inline-flex w-full justify-center"
        )}
      >
        {isPending ? "Updating…" : `Switch to ${planName}`}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Switch to ${planName}?`}
        description="MVP mode: your plan updates immediately without payment. Stripe billing will be added in a future release."
        confirmLabel={`Use ${planName}`}
        variant="default"
        isLoading={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            try {
              await changePlanAction(targetPlan);
              await update({ plan: targetPlan });
              setConfirmOpen(false);
              toast.success(`You are now on the ${planName} plan.`);
              router.refresh();
            } catch (err) {
              toastError(err, "Failed to update plan");
            }
          })
        }
      />
    </>
  );
}
