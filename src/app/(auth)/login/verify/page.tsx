import { Suspense } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { VerifyLoginForm } from "@/components/auth/VerifyLoginForm";

export default function VerifyLoginPage() {
  return (
    <AuthCard title="Signing in" subtitle="Please wait while we verify your link">
      <Suspense
        fallback={
          <p className="text-center text-muted-foreground">Loading…</p>
        }
      >
        <VerifyLoginForm />
      </Suspense>
    </AuthCard>
  );
}
