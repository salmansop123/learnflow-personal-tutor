import { redirect } from "next/navigation";

import { ProfileCard } from "@/components/profile/ProfileCard";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/profile";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getProfile(session.user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Profile"
        description="Your academic profile powers personalized AI tutoring across LearnFlow."
      />
      <ProfileCard profile={profile} />
      <div>
        <h2 className="mb-4 text-lg font-semibold">Edit profile</h2>
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  );
}
