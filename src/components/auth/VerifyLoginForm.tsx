"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api";

export function VerifyLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setStatus("error");
      setError("Invalid sign-in link.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(getApiUrl("/auth/magic-link/verify"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            typeof data.detail === "string"
              ? data.detail
              : "Sign-in link is invalid or expired"
          );
        }

        const result = await signIn("session-token", {
          sessionToken: data.sessionToken,
          redirect: false,
        });

        if (result?.error) {
          throw new Error("Could not create session");
        }

        setStatus("success");
        router.replace("/dashboard");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Verification failed");
      }
    }

    verify();
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <p className="text-center text-muted-foreground">Signing you in…</p>
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={() => router.push("/login")}>Back to login</Button>
      </div>
    );
  }

  return (
    <p className="text-center text-muted-foreground">Redirecting to dashboard…</p>
  );
}
