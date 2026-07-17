import Link from "next/link";

import { UsageComparisonTable } from "@/components/billing/UsageComparisonTable";
import { PricingTable } from "@/components/marketing/PricingTable";

export const metadata = {
  title: "Pricing — LearnFlow",
  description:
    "Compare LearnFlow plans: Free, Pro, Premium+, and Enterprise. AI tutoring built for every student.",
};

export default function PricingPage() {
  return (
    <>
      <div className="relative px-4 pt-16 text-center sm:px-6 sm:pt-20">
        <span className="marketing-badge">Pricing</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Plans for every <span className="marketing-gradient-text">study goal</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          From free exploration to Premium+ exam prep and enterprise teams —
          pick the tier that matches your ambition.
        </p>
      </div>
      <PricingTable showHeading={false} />

      <div className="mx-auto max-w-5xl space-y-4 px-4 pb-12 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          AI usage by plan
        </h2>
        <p className="mx-auto max-w-2xl text-center text-slate-600">
          Free includes generous monthly quotas. Pro and Premium include
          unlimited AI features under a fair-use policy — we never show token
          counts in the product.
        </p>
        <UsageComparisonTable />
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-8 text-center shadow-sm sm:p-10">
          <h2 className="text-xl font-bold text-slate-900">
            Need a custom enterprise plan?
          </h2>
          <p className="mt-2 text-slate-600">
            Schools, academies, and tutoring centers get dedicated workspaces,
            analytics, and onboarding support.
          </p>
          <Link
            href="/contact"
            className="marketing-btn-primary mt-6 inline-flex rounded-xl px-8 py-3 text-sm font-semibold"
          >
            Talk to sales
          </Link>
        </div>
      </div>
    </>
  );
}
