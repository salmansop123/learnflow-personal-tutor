import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

import { BillingCheckoutToast } from "@/components/billing/BillingCheckoutToast";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { UsageComparisonTable } from "@/components/billing/UsageComparisonTable";
import { PricingTable } from "@/components/marketing/PricingTable";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { getUserProfile } from "@/lib/users";
import type { UserPlan } from "@/types/user";

function planLabel(plan: UserPlan): string {
  switch (plan) {
    case "PRO":
      return "Pro";
    case "PREMIUM_PLUS":
      return "Premium+";
    case "ENTERPRISE":
      return "Enterprise";
    default:
      return "Free";
  }
}

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  const currentPlan = (profile.plan?.toUpperCase() ?? "FREE") as UserPlan;
  const stripeEnabled = isStripeConfigured();

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <BillingCheckoutToast />
      </Suspense>

      <PageHeader
        title="Billing"
        description="Manage your subscription and payment method via Stripe."
      />

      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/10">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl stat-icon-blue">
            <CreditCard className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Your current plan</CardTitle>
            <CardDescription className="mt-1">
              Signed in as {profile.email}
            </CardDescription>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {planLabel(currentPlan)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {stripeEnabled
                ? "Upgrade below with Stripe checkout, or manage your card and invoices in the billing portal."
                : "Configure Stripe in .env.local (see .env.example) to enable payments."}
            </p>
            <div className="mt-4">
              <ManageBillingButton
                hasStripeCustomer={Boolean(profile.stripeCustomerId)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-primary hover:underline"
          >
            Edit profile in Settings →
          </Link>
        </CardContent>
      </Card>

      <PricingTable
        showHeading={false}
        compact
        variant="billing"
        currentPlan={currentPlan}
        stripeEnabled={stripeEnabled}
        hasStripeCustomer={Boolean(profile.stripeCustomerId)}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">AI usage comparison</h2>
        <p className="text-sm text-muted-foreground">
          Free plan limits reset monthly. Pro and Premium+ include unlimited
          feature usage under a fair-use policy.
        </p>
        <UsageComparisonTable />
      </div>
    </div>
  );
}
