"use client";

import { ChevronDown, MessageSquarePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  deleteConversationAction,
  startNewConversationAction,
} from "@/app/dashboard/ai-tutor/actions";
import { ChatInterface } from "@/components/ai-tutor/ChatInterface";
import { ConversationListItem } from "@/components/ai-tutor/ConversationListItem";
import { LanguageHintBanner } from "@/components/ai-tutor/LanguageHintBanner";
import { SubjectSelector } from "@/components/ai-tutor/SubjectSelector";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getProfileCompletionScore } from "@/lib/profile";
import { getEducationDisplayLabel } from "@/lib/profile-constants";
import {
  parseTutorSubjects,
  serializeTutorSubjects,
} from "@/lib/tutor-subjects";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ConversationDetail, ConversationRow } from "@/types/ai";
import type { StudentProfile } from "@/types/profile";

export function AiTutorClient({
  conversations: initialConversations,
  profile,
  activeConversation,
  activeConversationId,
}: {
  conversations: ConversationRow[];
  profile: StudentProfile;
  activeConversation: ConversationDetail | null;
  activeConversationId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [conversations, setConversations] = useState(initialConversations);
  const [deleteTarget, setDeleteTarget] = useState<ConversationRow | null>(
    null
  );
  const [subjects, setSubjects] = useState<string[]>(() =>
    parseTutorSubjects(activeConversation?.subject)
  );
  const [subjectsOpen, setSubjectsOpen] = useState(false);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  useEffect(() => {
    setSubjects(parseTutorSubjects(activeConversation?.subject));
  }, [activeConversationId, activeConversation?.subject]);

  const selectConversation = (id: string) => {
    router.push(`/dashboard/ai-tutor?c=${id}`);
  };

  const handleNewChat = () => {
    startTransition(async () => {
      const created = await startNewConversationAction(
        subjects.length > 0 ? serializeTutorSubjects(subjects) : null
      );
      setConversations((prev) => [
        {
          id: created.id,
          title: created.title,
          subject: created.subject,
          createdAt: created.createdAt,
          messageCount: 0,
        },
        ...prev,
      ]);
      router.push(`/dashboard/ai-tutor?c=${created.id}`);
      router.refresh();
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startTransition(async () => {
      try {
        await deleteConversationAction(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        setDeleteTarget(null);
        if (activeConversationId === id) {
          router.push("/dashboard/ai-tutor");
        }
        router.refresh();
      } catch (e) {
        setDeleteTarget(null);
        toast.error(
          e instanceof Error
            ? e.message
            : "Could not delete this chat. Please try again."
        );
      }
    });
  };

  const handleRenamed = (updated: ConversationRow) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, title: updated.title } : c))
    );
  };

  const subjectsForChat =
    subjects.length > 0
      ? subjects
      : parseTutorSubjects(activeConversation?.subject);
  const topicsLabel =
    subjectsForChat.length > 0 ? subjectsForChat.join(", ") : null;
  const displayName = profile.fullName ?? profile.name ?? "there";
  const eduLabel = getEducationDisplayLabel(profile);
  const profileComplete = getProfileCompletionScore(profile) >= 60;

  return (
    <>
      <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-xl border bg-card p-3">
          <Button
            type="button"
            onClick={handleNewChat}
            disabled={isPending}
            className="w-full shrink-0 justify-start gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden />
            New chat
          </Button>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-2 py-4 text-xs text-muted-foreground">
                No conversations yet.
              </p>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="group flex items-center gap-0.5 rounded-lg pr-1 hover:bg-muted/80"
                >
                  <ConversationListItem
                    conversation={conversation}
                    isActive={activeConversationId === conversation.id}
                    disabled={isPending}
                    onSelect={() => selectConversation(conversation.id)}
                    onRenamed={handleRenamed}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                    disabled={isPending}
                    aria-label={`Delete ${conversation.title}`}
                    onClick={() => setDeleteTarget(conversation)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <details
            open={subjectsOpen}
            onToggle={(e) => setSubjectsOpen(e.currentTarget.open)}
            className="shrink-0 rounded-xl border bg-card group"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
              <span>
                Subjects
                {subjects.length > 0 ? (
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({subjects.length} selected)
                  </span>
                ) : (
                  <span className="ml-2 font-normal text-muted-foreground">
                    (optional)
                  </span>
                )}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  subjectsOpen && "rotate-180"
                )}
                aria-hidden
              />
            </summary>
            <div className="max-h-[min(40vh,280px)] space-y-3 overflow-y-auto border-t px-3 py-3">
              <LanguageHintBanner preferredLanguage={profile.language} />
              <SubjectSelector value={subjects} onChange={setSubjects} />
              <p className="text-xs text-muted-foreground">
                Level: {eduLabel ?? "Complete your profile"}
                {profile.gradeOrYear ? ` · ${profile.gradeOrYear}` : ""}
              </p>
            </div>
          </details>

          {activeConversation && activeConversationId ? (
            <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
              <ChatInterface
                key={activeConversationId}
                conversationId={activeConversationId}
                subjects={subjectsForChat}
                profile={profile}
                initialMessages={activeConversation.messages}
              />
            </div>
          ) : (
            <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border bg-card p-8 text-center">
              {profileComplete ? (
                <p className="max-w-md text-muted-foreground">
                  Hi <strong>{displayName}</strong>! I&apos;m your LearnFlow AI
                  tutor
                  {topicsLabel ? ` ready to help with ${topicsLabel}` : ""}
                  {eduLabel ? ` at ${eduLabel} level` : ""}.
                  {profile.weakSubjects.length > 0
                    ? ` I&apos;ll give extra attention to ${profile.weakSubjects.join(", ")}.`
                    : ""}{" "}
                  What would you like to work on today?
                </p>
              ) : (
                <p className="max-w-sm text-muted-foreground">
                  Welcome to LearnFlow!{" "}
                  <Link
                    href="/dashboard/profile"
                    className="text-primary underline"
                  >
                    Complete your profile
                  </Link>{" "}
                  to get personalised tutoring.
                </p>
              )}
              <Button
                type="button"
                className="mt-4"
                onClick={handleNewChat}
                disabled={isPending}
              >
                Start chatting
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete conversation?"
        description={`This will permanently remove "${deleteTarget?.title ?? "this chat"}" and all its messages.`}
        confirmLabel="Delete"
        isLoading={isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
