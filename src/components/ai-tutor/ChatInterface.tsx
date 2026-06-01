"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { MessageBubble } from "@/components/ai-tutor/MessageBubble";
import { PinToNotes, type PinToNotesPayload } from "@/components/ai-tutor/PinToNotes";
import { PinToNotesDialog } from "@/components/ai-tutor/PinToNotesDialog";
import {
  ChatAttachmentBar,
  useDocumentUpload,
} from "@/components/shared/DocumentUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messagesToUIMessages } from "@/lib/ai-messages";
import { buildDocumentContextBlock } from "@/lib/document-constants";
import { getProfileCompletionScore } from "@/lib/profile";
import { getEducationDisplayLabel } from "@/lib/profile-constants";
import { serializeTutorSubjects } from "@/lib/tutor-subjects";
import type { MessageRow } from "@/types/ai";
import type { StudentProfile } from "@/types/profile";

export function ChatInterface({
  conversationId,
  subjects,
  profile,
  initialMessages,
}: {
  conversationId: string;
  subjects: string[];
  profile: StudentProfile;
  initialMessages: MessageRow[];
}) {
  const subjectLine = serializeTutorSubjects(subjects);
  const hydratedMessages = useMemo(
    () => messagesToUIMessages(initialMessages),
    [initialMessages]
  );

  const {
    documents,
    uploadFile,
    removeDocument,
    readyDocuments,
    isUploading,
  } = useDocumentUpload(3);

  const documentContext = useMemo(
    () =>
      buildDocumentContextBlock(
        readyDocuments.map((d) => ({ name: d.name, text: d.text }))
      ),
    [readyDocuments]
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/chat",
        body: {
          conversationId,
          subject: subjectLine ?? undefined,
          subjects: subjects.length > 0 ? subjects : undefined,
          documentContext: documentContext || undefined,
          educationLevel: profile.educationLevel ?? undefined,
          educationTier: profile.educationTier ?? null,
          educationArchetype: profile.educationArchetype ?? null,
        },
      }),
    [conversationId, subjects, subjectLine, documentContext, profile]
  );

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: hydratedMessages,
    transport,
  });

  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef(status);
  const [input, setInput] = useState("");
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [pinPayload, setPinPayload] = useState<PinToNotesPayload | null>(null);
  const isBusy =
    status === "streaming" || status === "submitted" || isUploading;
  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (
      (prev === "streaming" || prev === "submitted") &&
      status === "ready"
    ) {
      router.refresh();
    }
  }, [status, router]);

  const handlePin = (payload: PinToNotesPayload) => {
    setPinPayload({
      ...payload,
      subject: payload.subject ?? subjectLine ?? undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    if (documents.some((d) => d.status === "uploading")) return;

    const attachmentNote =
      readyDocuments.length > 0
        ? `\n\n[Attached: ${readyDocuments.map((d) => d.name).join(", ")}]`
        : "";

    setInput("");
    await sendMessage({ text: text + attachmentNote });
  };

  const pinSaved =
    pinMessage &&
    (pinMessage.startsWith("Added") ||
      pinMessage.startsWith("Created") ||
      pinMessage.startsWith("Pinned"));

  return (
    <>
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-soft">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4"
      >
        {messages.length === 0 ? (
          <TutorWelcome profile={profile} subjects={subjects} />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((message: UIMessage) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageBubble message={message}>
                  {message.role === "assistant" ? (
                    <PinToNotes
                      messageId={message.id}
                      content={
                        message.parts
                          .filter((p) => p.type === "text")
                          .map((p) => (p.type === "text" ? p.text : ""))
                          .join("")
                      }
                      conversationId={conversationId}
                      subject={subjectLine}
                      onPin={handlePin}
                    />
                  ) : null}
                </MessageBubble>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        {isStreaming ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {isUploading ? "Processing file…" : "AI is thinking…"}
          </div>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error.message || "Something went wrong. Please try again."}
          </p>
        ) : null}
      </div>

      {pinMessage ? (
        <p className="shrink-0 border-t px-4 py-2 text-xs text-muted-foreground">
          {pinMessage}{" "}
          {pinSaved ? (
            <a href="/dashboard/notes" className="text-primary hover:underline">
              View notes
            </a>
          ) : null}
        </p>
      ) : null}

      <div className="shrink-0 border-t bg-card/95 backdrop-blur-sm">
        <ChatAttachmentBar
          documents={documents}
          uploadFile={uploadFile}
          removeDocument={removeDocument}
          disabled={isBusy}
        />

        <form onSubmit={handleSubmit} className="flex gap-2 p-4 pt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              readyDocuments.length > 0
                ? "Ask about your uploaded file…"
                : "Ask your AI tutor anything…"
            }
            disabled={isBusy}
            className="flex-1"
          />
          <Button type="submit" disabled={isBusy || !input.trim()} size="icon">
            <Send className="h-4 w-4" aria-hidden />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>

    <PinToNotesDialog
      open={!!pinPayload}
      payload={pinPayload}
      onClose={() => setPinPayload(null)}
      onSuccess={(message) => {
        setPinMessage(message);
        setPinPayload(null);
        router.refresh();
      }}
    />
    </>
  );
}

function TutorWelcome({
  profile,
  subjects,
}: {
  profile: StudentProfile;
  subjects: string[];
}) {
  const topicLabel = subjects.length > 0 ? subjects.join(", ") : null;
  const name = profile.fullName ?? profile.name ?? "there";
  const eduLabel = getEducationDisplayLabel(profile);
  const complete = getProfileCompletionScore(profile) >= 60;

  if (!complete) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/dashboard/profile" className="text-primary underline">
          Complete your profile
        </Link>{" "}
        for personalised tutoring.
      </p>
    );
  }

  return (
    <p className="text-center text-sm text-muted-foreground">
      Hi <strong>{name}</strong>! Ready to help
      {topicLabel ? ` with ${topicLabel}` : " with any topic you choose"}
      {eduLabel ? ` at ${eduLabel} level` : ""}.
      {profile.weakSubjects.length > 0
        ? ` Extra focus on: ${profile.weakSubjects.join(", ")}.`
        : ""}{" "}
      Attach a PDF or document below to ask questions about it.
    </p>
  );
}
