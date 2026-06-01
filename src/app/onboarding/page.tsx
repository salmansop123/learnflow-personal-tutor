import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/profile/OnboardingWizard";
import { SyncOnboardingSession } from "@/components/profile/SyncOnboardingSession";
import { auth } from "@/lib/auth";
import { getProfile } from "@/lib/profile";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.onboardingComplete) {
    redirect("/dashboard");
  }

  let profileComplete = false;
  try {
    const profile = await getProfile(session.user.id);
    profileComplete = profile.onboardingComplete;
  } catch {
    /* backend may be down */
  }

  if (profileComplete) {
    return (
      <div className="w-full max-w-2xl rounded-none bg-white shadow-2xl sm:min-h-[520px] sm:rounded-2xl">
        <div className="flex min-h-[320px] items-center justify-center p-6 sm:p-10">
          <SyncOnboardingSession />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl rounded-none bg-white shadow-2xl sm:min-h-[520px] sm:rounded-2xl">
      <div className="p-6 sm:p-10">
        <OnboardingWizard initialName={session.user.name} />
      </div>
    </div>
  );
}
