"use client";

import { Pin } from "lucide-react";

import { Button } from "@/components/ui/button";

export type PinToNotesPayload = {
  messageId: string;
  content: string;
  conversationId?: string;
  subject?: string | null;
};

export function PinToNotes({
  messageId,
  content,
  conversationId,
  subject,
  onPin,
}: {
  messageId: string;
  content: string;
  conversationId?: string;
  subject?: string | null;
  onPin?: (payload: PinToNotesPayload) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs text-muted-foreground"
      onClick={() =>
        onPin?.({ messageId, content, conversationId, subject })
      }
    >
      <Pin className="h-3.5 w-3.5" aria-hidden />
      Pin to notes
    </Button>
  );
}
