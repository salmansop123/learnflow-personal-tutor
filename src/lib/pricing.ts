import type { UserPlan } from "@/types/user";

export type BillingInterval = "monthly" | "yearly";

export type PlanAccent = "slate" | "blue" | "violet" | "cyan" | "enterprise";

export const PLAN_ID_TO_USER_PLAN: Record<string, UserPlan> = {
  free: "FREE",
  pro: "PRO",
  "premium-plus": "PREMIUM_PLUS",
  enterprise: "ENTERPRISE",
};

export function userPlanToPricingId(plan: UserPlan): string {
  if (plan === "PREMIUM_PLUS") return "premium-plus";
  return plan.toLowerCase();
}

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  monthlyLabel: string;
  yearlyLabel: string;
  features: string[];
  accent: PlanAccent;
  featured?: boolean;
  badge?: string;
  cta: string;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description:
      "Best for students getting started with AI-powered studying and productivity.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyLabel: "$0",
    yearlyLabel: "$0",
    features: [
      "Limited AI tutor messages per day",
      "Basic study dashboard",
      "Notes & study session tracking",
      "Simple quizzes & assignments",
      "Subject progress analytics",
      "Limited PDF uploads",
      "Basic reminders",
      "Community support",
    ],
    accent: "slate",
    cta: "Get started free",
  },
  {
    id: "pro",
    name: "Pro",
    description:
      "Designed for serious students preparing for exams, university, and competitive tests.",
    monthlyPrice: 19,
    yearlyPrice: 190,
    monthlyLabel: "$19",
    yearlyLabel: "$190",
    features: [
      "Unlimited AI tutor conversations",
      "Advanced AI-powered quizzes",
      "Dynamic runtime question generation",
      "PDF paper upload & exam pattern analysis",
      "AI-generated summaries & explanations",
      "Notes export to PDF",
      "Smart subject balance alerts",
      "Email reminders & productivity notifications",
      "Advanced analytics dashboard",
      "Personalized study plans",
      "AI answer pinning into notes",
      "Study streak & performance tracking",
      "Faster AI response priority",
      "Priority support",
    ],
    accent: "blue",
    badge: "Most popular",
    featured: true,
    cta: "Start with Pro",
  },
  {
    id: "premium-plus",
    name: "Premium+",
    description:
      "Built for power users, coaching students, competitive exam preparation, and advanced learners.",
    monthlyPrice: 39,
    yearlyPrice: 390,
    monthlyLabel: "$39",
    yearlyLabel: "$390",
    features: [
      "Everything in Pro",
      "Higher AI usage limits",
      "Advanced adaptive quiz engine",
      "Multi-subject AI study management",
      "Competitive exam preparation modes",
      "Deep analytics & performance insights",
      "Long-term study behavior analysis",
      "Advanced AI study recommendations",
      "Custom AI learning modes",
      "Large PDF uploads & processing",
      "Early access to new AI features",
      "Premium support",
    ],
    accent: "violet",
    badge: "Power learner",
    cta: "Go Premium+",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description:
      "For schools, academies, tutoring centers, universities, and educational organizations.",
    monthlyPrice: null,
    yearlyPrice: null,
    monthlyLabel: "Custom",
    yearlyLabel: "Custom",
    features: [
      "Multi-student management",
      "Admin dashboard & analytics",
      "Bulk student onboarding",
      "Dedicated organization workspace",
      "Role-based access system",
      "Custom branding",
      "Team & classroom analytics",
      "Dedicated infrastructure support",
      "API access & integrations",
      "Priority onboarding assistance",
      "Dedicated account manager",
    ],
    accent: "enterprise",
    cta: "Contact sales",
  },
];

export function getDisplayPrice(
  plan: PricingPlan,
  interval: BillingInterval
): string {
  if (plan.monthlyPrice === null) return "Custom pricing";
  if (interval === "monthly") {
    return plan.monthlyPrice === 0 ? "$0" : `${plan.monthlyLabel}/mo`;
  }
  return plan.yearlyPrice === 0 ? "$0" : `${plan.yearlyLabel}/yr`;
}

export function getSavingsLabel(plan: PricingPlan): string | null {
  if (plan.monthlyPrice === null || plan.monthlyPrice === 0) return null;
  const yearlyMonthly = (plan.yearlyPrice ?? 0) / 12;
  const savings = Math.round((1 - yearlyMonthly / plan.monthlyPrice) * 100);
  if (savings <= 0) return null;
  return `Save ${savings}%`;
}

export const planAccentStyles: Record<
  PlanAccent,
  {
    border: string;
    glow: string;
    badge: string;
    icon: string;
    button: string;
    gradient: string;
  }
> = {
  slate: {
    border: "border-slate-200/80",
    glow: "hover:shadow-[0_0_40px_oklch(0.55_0.08_250/0.12)]",
    badge: "bg-slate-100 text-slate-700",
    icon: "from-slate-100 to-slate-50 text-slate-600",
    button: "bg-slate-900 text-white hover:bg-slate-800",
    gradient: "from-slate-50 via-white to-cyan-50/30",
  },
  blue: {
    border: "border-sky-300/70",
    glow: "hover:shadow-[0_0_48px_oklch(0.55_0.2_230/0.35)]",
    badge: "bg-gradient-to-r from-sky-500 to-cyan-500 text-white",
    icon: "from-sky-100 to-cyan-50 text-sky-600",
    button:
      "bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-white shadow-[0_8px_32px_oklch(0.55_0.2_230/0.4)] hover:brightness-110",
    gradient: "from-sky-50 via-white to-cyan-50/50",
  },
  violet: {
    border: "border-violet-300/70",
    glow: "hover:shadow-[0_0_52px_oklch(0.55_0.22_300/0.4)]",
    badge: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white",
    icon: "from-violet-100 to-fuchsia-50 text-violet-600",
    button:
      "bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-[0_8px_32px_oklch(0.55_0.22_300/0.4)] hover:brightness-110",
    gradient: "from-violet-50 via-white to-fuchsia-50/40",
  },
  cyan: {
    border: "border-cyan-300/70",
    glow: "hover:shadow-[0_0_40px_oklch(0.6_0.16_200/0.3)]",
    badge: "bg-cyan-500 text-white",
    icon: "from-cyan-100 to-teal-50 text-cyan-600",
    button: "bg-gradient-to-r from-cyan-500 to-teal-500 text-white",
    gradient: "from-cyan-50 via-white to-emerald-50/40",
  },
  enterprise: {
    border: "border-emerald-200/80",
    glow: "hover:shadow-[0_0_40px_oklch(0.55_0.16_155/0.2)]",
    badge: "bg-emerald-100 text-emerald-800",
    icon: "from-emerald-100 to-teal-50 text-emerald-600",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
    gradient: "from-emerald-50/80 via-white to-teal-50/30",
  },
};
