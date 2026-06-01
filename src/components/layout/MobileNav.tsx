"use client";

import { Menu, X } from "lucide-react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  userName?: string | null;
  userEmail?: string | null;
  userPlan?: string;
  profileCompletionPct?: number;
};

export function MobileNav({
  userName,
  userEmail,
  userPlan,
  profileCompletionPct = 100,
}: MobileNavProps) {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open menu"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-64 shadow-xl",
              "animate-in slide-in-from-left duration-200"
            )}
          >
            <div className="relative h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10"
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="size-5" />
              </Button>
              <Sidebar
                userName={userName}
                userEmail={userEmail}
                userPlan={userPlan}
                profileCompletionPct={profileCompletionPct}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
