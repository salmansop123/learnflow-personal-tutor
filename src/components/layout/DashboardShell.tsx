"use client";

import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { dashboardNavItems } from "@/lib/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  userPlan?: string;
  profileCompletionPct?: number;
};

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  const item = dashboardNavItems
    .filter((nav) => nav.href !== "/dashboard")
    .find(
      (nav) =>
        pathname === nav.href || pathname.startsWith(`${nav.href}/`)
    );
  return item?.title ?? "Dashboard";
}

export function DashboardShell({
  children,
  userName,
  userEmail,
  userPlan,
  profileCompletionPct = 100,
}: DashboardShellProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          userPlan={userPlan}
          profileCompletionPct={profileCompletionPct}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <TopNav
          title={title}
          userName={userName}
          userEmail={userEmail}
          userPlan={userPlan}
          profileCompletionPct={profileCompletionPct}
        />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
