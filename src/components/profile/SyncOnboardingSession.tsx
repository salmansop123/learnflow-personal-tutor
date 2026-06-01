"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

/** Sync JWT when DB already has onboardingComplete but session token is stale. */
export function SyncOnboardingSession() {
  const { update } = useSession();
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    update({ onboardingComplete: true }).then(() => {
      router.replace("/dashboard");
    });
  }, [update, router]);

  return (
    <p className="text-center text-sm text-slate-500">
      Finishing setup…
    </p>
  );
}
