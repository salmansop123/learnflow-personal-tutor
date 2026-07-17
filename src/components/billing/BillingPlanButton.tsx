"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";

import { changePlanAction } from "@/app/dashboard/billing/actions";
import { toast, toastError } from "@/lib/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/lib/pricing";
import type { UserPlan } from "@/types/user";

async function openStripePortal() {
  const res = await fetch("/api/stripe/portal", { method: "POST" });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to open billing portal");
  }
  if (!data.url) {
    throw new Error("Portal URL missing");
  }
  window.location.href = data.url;
}

async function startStripeCheckout(plan: UserPlan, interval: BillingInterval) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, interval }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to start checkout");
  }
  if (!data.url) {
    throw new Error("Checkout URL missing");
  }
  window.location.href = data.url;
}

export function BillingPlanButton({
  targetPlan,
  currentPlan,
  planName,
  interval,
  highlighted,
  stripeEnabled,
  hasStripeCustomer = false,
}: {
  targetPlan: UserPlan;
  currentPlan: UserPlan;
  planName: string;
  interval: BillingInterval;
  highlighted?: boolean;
  stripeEnabled: boolean;
  hasStripeCustomer?: boolean;
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
      <a
        href="/contact"
        className={cn(
          buttonVariants({ variant: highlighted ? "default" : "outline" }),
          "inline-flex w-full justify-center"
        )}
      >
        Contact sales
      </a>
    );
  }

  const isUpgrade =
    targetPlan === "PRO" || targetPlan === "PREMIUM_PLUS";
  const isDowngradeToFree =
    targetPlan === "FREE" &&
    (currentPlan === "PRO" || currentPlan === "PREMIUM_PLUS");
  const useStripeCheckout = stripeEnabled && isUpgrade;
  const useStripePortal =
    stripeEnabled && hasStripeCustomer && isDowngradeToFree;

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
        {isPending
          ? "Redirecting…"
          : useStripeCheckout
            ? `Subscribe to ${planName}`
            : useStripePortal
              ? "Manage subscription"
              : `Switch to ${planName}`}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={
          useStripeCheckout
            ? `Subscribe to ${planName}?`
            : useStripePortal
              ? "Manage your subscription?"
              : `Switch to ${planName}?`
        }
        description={
          useStripeCheckout
            ? `You will be redirected to Stripe to pay securely (${interval} billing). Your plan updates automatically after payment.`
            : useStripePortal
              ? "Open the Stripe billing portal to cancel or change your subscription and payment method."
              : "Your plan will update immediately (Stripe is not configured — dev mode)."
        }
        confirmLabel={
          useStripeCheckout
            ? "Continue to checkout"
            : useStripePortal
              ? "Open billing portal"
              : `Use ${planName}`
        }
        variant="default"
        isLoading={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            try {
              if (useStripeCheckout) {
                await startStripeCheckout(targetPlan, interval);
                return;
              }
              if (useStripePortal) {
                await openStripePortal();
                return;
              }
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
