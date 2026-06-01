import { redirect } from "next/navigation";

import { QuizPageClient } from "@/components/quiz/QuizPageClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";
import { listQuizAttempts } from "@/lib/quiz";

export default async function QuizPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const attempts = await listQuizAttempts(session.user.id).catch(() => []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quiz"
        description="AI-generated quizzes with instant feedback and scored attempts."
      />
      <QuizPageClient initialAttempts={attempts} />
    </div>
  );
}
