"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { toast } from "@/lib/toast";

export function BillingCheckoutToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;

    if (checkout === "success") {
      void update().then(() => {
        toast.success("Payment successful! Your plan is being updated.");
        router.replace("/dashboard/billing");
        router.refresh();
      });
    } else if (checkout === "cancelled") {
      toast.info("Checkout cancelled — no changes were made.");
      router.replace("/dashboard/billing");
    }
  }, [searchParams, router, update]);

  return null;
}
