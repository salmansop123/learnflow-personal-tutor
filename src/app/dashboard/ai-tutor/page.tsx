import { redirect } from "next/navigation";

import { AiTutorClient } from "@/components/ai-tutor/AiTutorClient";
import { PageHeader } from "@/components/layout/PageHeader";
import { auth } from "@/lib/auth";
import { getConversation, listConversations } from "@/lib/conversations";
import { getProfile } from "@/lib/profile";

type PageProps = {
  searchParams: { c?: string };
};

export default async function AiTutorPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = searchParams;
  const userId = session.user.id;

  const [conversations, profile] = await Promise.all([
    listConversations(userId),
    getProfile(userId),
  ]);

  const activeConversationId =
    params.c ?? conversations[0]?.id ?? null;

  const activeConversation = activeConversationId
    ? await getConversation(userId, activeConversationId).catch(() => null)
    : null;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-2.5rem)] max-h-[calc(100dvh-3.5rem-2.5rem)] flex-col gap-3 overflow-hidden sm:h-[calc(100dvh-3.5rem-3rem)] sm:max-h-[calc(100dvh-3.5rem-3rem)]">
      <PageHeader
        title="AI Tutor"
        description="Chat with your personal AI tutor. Responses stream in real time."
        className="mb-0 shrink-0"
      />
      <AiTutorClient
        conversations={conversations}
        profile={profile}
        activeConversation={activeConversation}
        activeConversationId={activeConversationId}
      />
    </div>
  );
}
