"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { updateUserPlan } from "@/lib/users";
import type { UserPlan } from "@/types/user";

const PLAN_ORDER: UserPlan[] = [
  "FREE",
  "PRO",
  "PREMIUM_PLUS",
  "ENTERPRISE",
];

export async function changePlanAction(plan: UserPlan): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!PLAN_ORDER.includes(plan)) {
    throw new Error("Invalid plan");
  }

  await updateUserPlan(session.user.id, plan);

  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
}
