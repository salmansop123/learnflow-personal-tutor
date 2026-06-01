"use client";

import { formatDistanceToNow } from "date-fns";
import { Pencil, Pin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent } from "react";

import { deleteNoteAction } from "@/app/dashboard/notes/actions";
import { ExportPDF } from "@/components/notes/ExportPDF";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { noteContentPreviewText } from "@/lib/note-content";
import { cn } from "@/lib/utils";
import type { NoteRow } from "@/types/note";

export function NoteCard({
  note,
  selected,
  onSelect,
  onEdit,
  onDeleted,
}: {
  note: NoteRow;
  selected: boolean;
  onSelect: () => void;
  onEdit?: () => void;
  onDeleted?: (noteId: string) => void;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const previewText = noteContentPreviewText(note.content || "", 5);

  return (
    <>
      <Card
        className={cn(
          "flex h-full cursor-pointer flex-col transition-colors hover:bg-muted/40",
          selected && "border-primary ring-1 ring-primary"
        )}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-base">{note.title}</CardTitle>
              <CardDescription className="mt-0.5">
                {note.subject ?? "General"} ·{" "}
                {formatDistanceToNow(new Date(note.updatedAt), {
                  addSuffix: true,
                })}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {onEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  aria-label={`Edit ${note.title}`}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmOpen(true);
                }}
                aria-label="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-2 pb-2">
          {previewText ? (
            <p className="line-clamp-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {previewText}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">No content yet</p>
          )}

          {note.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {note.tags.length > 4 ? (
                <span className="text-xs text-muted-foreground">
                  +{note.tags.length - 4}
                </span>
              ) : null}
            </div>
          ) : null}

          {note.pinnedFrom ? (
            <p className="flex items-center gap-1 text-xs text-primary">
              <Pin className="h-3 w-3 shrink-0" aria-hidden />
              Pinned from AI tutor
            </p>
          ) : null}
        </CardContent>

        <div
          className="mt-auto border-t bg-muted/20 px-4 py-3"
          onClick={(e: MouseEvent) => e.stopPropagation()}
        >
          <ExportPDF note={note} />
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this note?"
        description={`Are you sure you want to delete "${note.title}"? This action cannot be undone.`}
        confirmLabel="Delete note"
        isLoading={isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          startTransition(async () => {
            await deleteNoteAction(note.id);
            setConfirmOpen(false);
            onDeleted?.(note.id);
            router.refresh();
          })
        }
      />
    </>
  );
}
