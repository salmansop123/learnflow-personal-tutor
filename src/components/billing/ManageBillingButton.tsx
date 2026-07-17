"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { toastError } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export function ManageBillingButton({
  hasStripeCustomer,
}: {
  hasStripeCustomer: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!hasStripeCustomer) return null;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        className="gap-2"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              const res = await fetch("/api/stripe/portal", { method: "POST" });
              const data = (await res.json()) as { url?: string; error?: string };
              if (!res.ok) {
                throw new Error(data.error ?? "Failed to open billing portal");
              }
              if (!data.url) {
                throw new Error("Portal URL missing");
              }
              window.location.href = data.url;
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Failed to open portal";
              setError(message);
              toastError(err, "Billing portal unavailable");
            }
          })
        }
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <CreditCard className="h-4 w-4" aria-hidden />
        )}
        Manage payment method
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
