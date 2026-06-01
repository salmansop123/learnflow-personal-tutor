"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { renameConversationAction } from "@/app/dashboard/ai-tutor/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ConversationRow } from "@/types/ai";

export function ConversationListItem({
  conversation,
  isActive,
  disabled,
  onSelect,
  onRenamed,
}: {
  conversation: ConversationRow;
  isActive: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRenamed?: (conversation: ConversationRow) => void;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [isRenaming, startRename] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setDraftTitle(conversation.title);
  }, [conversation.title, isEditing]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const cancelEdit = () => {
    setDraftTitle(conversation.title);
    setIsEditing(false);
  };

  const saveTitle = () => {
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === conversation.title) {
      cancelEdit();
      return;
    }

    startRename(async () => {
      try {
        const updated = await renameConversationAction(conversation.id, trimmed);
        onRenamed?.(updated);
        setIsEditing(false);
        router.refresh();
      } catch {
        setDraftTitle(conversation.title);
        setIsEditing(false);
      }
    });
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-0.5 rounded-lg pr-1 transition-colors hover:bg-muted",
        isActive && "bg-muted"
      )}
    >
      {isEditing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1 px-2 py-1.5">
          <Input
            ref={inputRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveTitle();
              }
              if (e.key === "Escape") cancelEdit();
            }}
            disabled={isRenaming || disabled}
            className="h-8 text-sm"
            maxLength={120}
            aria-label="Chat title"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isRenaming || disabled}
            onClick={saveTitle}
            aria-label="Save title"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={isRenaming || disabled}
            onClick={cancelEdit}
            aria-label="Cancel rename"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onSelect}
            className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm transition-colors"
          >
            <p className="truncate font-medium">{conversation.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conversation.createdAt), {
                addSuffix: true,
              })}
            </p>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 opacity-0 transition-all duration-200 group-hover:opacity-100 focus:opacity-100 hover:scale-105"
            disabled={disabled || isRenaming}
            aria-label={`Rename ${conversation.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </>
      )}
    </div>
  );
}
