"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MobileNav } from "@/components/layout/MobileNav";

type TopNavProps = {
  title?: string;
  userName?: string | null;
  userEmail?: string | null;
  userPlan?: string;
  profileCompletionPct?: number;
};

export function TopNav({
  title = "Dashboard",
  userName,
  userEmail,
  userPlan,
  profileCompletionPct = 100,
}: TopNavProps) {
  return (
    <header className="glass-sidebar sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-4 lg:px-6">
      <MobileNav
        userName={userName}
        userEmail={userEmail}
        userPlan={userPlan}
        profileCompletionPct={profileCompletionPct}
      />
      <div className="flex flex-1 items-center justify-between gap-4">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
