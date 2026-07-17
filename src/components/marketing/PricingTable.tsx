"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap } from "lucide-react";
import { useState } from "react";

import { BillingPlanButton } from "@/components/billing/BillingPlanButton";
import { fadeUp, staggerContainer } from "@/lib/animations";
import {
  getDisplayPrice,
  getSavingsLabel,
  PLAN_ID_TO_USER_PLAN,
  planAccentStyles,
  pricingPlans,
  type BillingInterval,
  type PricingPlan,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { UserPlan } from "@/types/user";

function PricingCard({
  plan,
  interval,
  variant,
  currentPlan,
  stripeEnabled = false,
  hasStripeCustomer = false,
}: {
  plan: PricingPlan;
  interval: BillingInterval;
  variant: "marketing" | "billing";
  currentPlan?: UserPlan;
  stripeEnabled?: boolean;
  hasStripeCustomer?: boolean;
}) {
  const styles = planAccentStyles[plan.accent];
  const savings = interval === "yearly" ? getSavingsLabel(plan) : null;
  const userPlan = PLAN_ID_TO_USER_PLAN[plan.id];
  const isCurrent =
    variant === "billing" && currentPlan && userPlan === currentPlan;
  const isFeatured = plan.featured;

  return (
    <motion.article
      variants={fadeUp}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br transition-all duration-300",
        styles.gradient,
        styles.border,
        styles.glow,
        isFeatured &&
          "z-10 scale-[1.02] border-sky-400/80 shadow-[0_0_60px_oklch(0.55_0.22_230/0.25)] ring-2 ring-sky-400/30 lg:-mt-2 lg:mb-2",
        isCurrent && "ring-2 ring-emerald-400/50"
      )}
    >
      {isFeatured ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-500"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-violet-400/15 blur-3xl"
            aria-hidden
          />
        </>
      ) : null}

      {plan.badge ? (
        <span
          className={cn(
            "absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
            styles.badge
          )}
        >
          {isFeatured ? (
            <Zap className="h-3 w-3" aria-hidden />
          ) : (
            <Sparkles className="h-3 w-3" aria-hidden />
          )}
          {plan.badge}
        </span>
      ) : null}

      {isCurrent ? (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Your plan
        </span>
      ) : null}

      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <div
          className={cn(
            "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br",
            styles.icon
          )}
        >
          <span className="text-lg font-bold">{plan.name.charAt(0)}</span>
        </div>

        <h3 className="text-xl font-bold tracking-tight text-slate-900">
          {plan.name}
        </h3>
        <p className="mt-2 min-h-[3.5rem] text-sm leading-relaxed text-slate-600">
          {plan.description}
        </p>

        <div className="mt-6 border-t border-slate-200/60 pt-6">
          <p className="text-4xl font-bold tracking-tight text-slate-900">
            {getDisplayPrice(plan, interval)}
          </p>
          {savings ? (
            <p className="mt-1 text-sm font-medium text-emerald-600">
              {savings} vs monthly
            </p>
          ) : null}
        </div>

        <ul className="mt-6 flex-1 space-y-2.5">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-slate-600"
            >
              <Check
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  isFeatured
                    ? "text-sky-500"
                    : plan.accent === "violet"
                      ? "text-violet-500"
                      : plan.accent === "enterprise"
                        ? "text-emerald-500"
                        : "text-cyan-500"
                )}
                aria-hidden
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          {variant === "billing" && currentPlan && userPlan ? (
            <BillingPlanButton
              targetPlan={userPlan}
              currentPlan={currentPlan}
              planName={plan.name}
              interval={interval}
              highlighted={plan.featured}
              stripeEnabled={stripeEnabled}
              hasStripeCustomer={hasStripeCustomer}
            />
          ) : (
            <Link
              href={plan.id === "enterprise" ? "/contact" : "/register"}
              className={cn(
                "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                isFeatured || plan.accent === "violet"
                  ? styles.button
                  : plan.accent === "enterprise"
                    ? styles.button
                    : "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-sky-200 hover:bg-sky-50"
              )}
            >
              {plan.cta}
            </Link>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function PricingTable({
  showHeading = true,
  compact = false,
  variant = "marketing",
  currentPlan,
  stripeEnabled = false,
  hasStripeCustomer = false,
}: {
  showHeading?: boolean;
  compact?: boolean;
  variant?: "marketing" | "billing";
  currentPlan?: UserPlan;
  stripeEnabled?: boolean;
  hasStripeCustomer?: boolean;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <section
      id={compact ? undefined : "pricing"}
      className={cn(
        "relative overflow-hidden px-4 sm:px-6",
        compact ? "py-0" : "py-20 sm:py-28"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-50/80 via-white to-violet-50/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-cyan-400/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-sky-300/20 blur-3xl"
        aria-hidden
      />

      <motion.div
        className="relative mx-auto max-w-7xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={staggerContainer}
      >
        {showHeading ? (
          <motion.div variants={fadeUp} className="mx-auto max-w-3xl text-center">
            <span className="marketing-badge">Plans & pricing</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Invest in your{" "}
              <span className="marketing-gradient-text">best study season</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              {variant === "billing"
                ? "Compare tiers and subscribe with secure Stripe checkout."
                : "Start free, level up for exams, or go Premium+ for competitive prep. Transparent pricing built for students."}
            </p>
          </motion.div>
        ) : null}

        <motion.div
          variants={fadeUp}
          className={cn("flex justify-center", showHeading ? "mt-10" : "mt-0")}
        >
          <div className="inline-flex rounded-2xl border border-sky-200/60 bg-white/80 p-1 shadow-[0_4px_24px_oklch(0.55_0.12_230/0.1)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                interval === "monthly"
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={cn(
                "rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200",
                interval === "yearly"
                  ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Yearly
              <span className="ml-1.5 rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
                Save ~17%
              </span>
            </button>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          className="mt-12 grid min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-4"
        >
          {pricingPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              interval={interval}
              variant={variant}
              currentPlan={currentPlan}
              stripeEnabled={stripeEnabled}
              hasStripeCustomer={hasStripeCustomer}
            />
          ))}
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-10 text-center text-sm text-slate-500"
        >
          {variant === "billing"
            ? stripeEnabled
              ? "Payments are processed securely by Stripe. Manage cards and invoices from your billing portal."
              : "Add Stripe keys to .env.local to enable checkout (see .env.example)."
            : "All prices in USD. Secure Stripe checkout for paid plans."}
        </motion.p>
      </motion.div>
    </section>
  );
}
