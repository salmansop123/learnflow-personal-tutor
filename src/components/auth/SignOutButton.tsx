"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout-event", { method: "POST" });
    } catch {
      /* ignore */
    }
    await signOut({ callbackUrl: "/" });
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void handleSignOut()}>
      Sign out
    </Button>
  );
}
