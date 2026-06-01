import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="View your plan and compare tiers. No payment gateway in this MVP."
      />

      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/10">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl stat-icon-blue">
            <CreditCard className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <CardTitle>Your current plan</CardTitle>
            <CardDescription className="mt-1">
              Signed in as {profile.email}
            </CardDescription>
            <p className="mt-3 text-3xl font-bold tracking-tight">
              {planLabel(currentPlan)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Switch plans below for testing. Stripe checkout will connect in a
              future release.
            </p>
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
      />
    </div>
  );
}
