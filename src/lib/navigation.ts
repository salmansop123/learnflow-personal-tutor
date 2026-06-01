import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Settings,
  StickyNote,
  User,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Study", href: "/dashboard/study", icon: BookOpen },
  { title: "AI Tutor", href: "/dashboard/ai-tutor", icon: MessageSquare },
  { title: "Notes", href: "/dashboard/notes", icon: StickyNote },
  { title: "Quiz", href: "/dashboard/quiz", icon: Brain },
  { title: "Profile", href: "/dashboard/profile", icon: User },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const marketingNavItems = [
  { title: "Features", href: "/#features" },
  { title: "Pricing", href: "/#pricing" },
  { title: "Contact", href: "/contact" },
] as const;

export function isDashboardNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
