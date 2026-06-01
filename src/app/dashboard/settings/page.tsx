import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { auth } from "@/lib/auth";
import { getUserProfile } from "@/lib/users";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, language, and education level."
      />
      <SettingsForm profile={profile} />
    </div>
  );
}
