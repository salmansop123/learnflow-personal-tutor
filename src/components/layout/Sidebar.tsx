"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Separator } from "@/components/ui/separator";
import { dashboardNavItems, isDashboardNavActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  userName?: string | null;
  userEmail?: string | null;
  userPlan?: string;
  profileCompletionPct?: number;
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({
  userName,
  userEmail,
  userPlan,
  profileCompletionPct = 100,
  className,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "glass-sidebar flex h-full w-64 flex-col border-r",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-[var(--sidebar-border)] px-4">
        <Link
          href="/dashboard"
          className="gradient-text-brand text-lg font-bold tracking-tight"
          onClick={onNavigate}
        >
          LearnFlow
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {dashboardNavItems.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "nav-link-active"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.title}
              {item.href === "/dashboard/profile" &&
              profileCompletionPct < 80 ? (
                <span
                  className="ml-auto h-2 w-2 rounded-full bg-amber-500"
                  title="Complete your profile"
                  aria-hidden
                />
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-4">
        <div className="mb-3 min-w-0 rounded-lg bg-accent/30 p-3">
          <p className="truncate text-sm font-medium">
            {userName ?? userEmail ?? "Student"}
          </p>
          {userEmail && userName && (
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          )}
          {userPlan && (
            <p className="mt-1 text-xs font-medium text-primary capitalize">
              Plan: {userPlan.toLowerCase()}
            </p>
          )}
        </div>
        <Separator className="mb-3 opacity-50" />
        <SignOutButton />
      </div>
    </aside>
  );
}
