"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FilePlus, FileText, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  appendPinnedMessageToNoteAction,
  createPinnedNoteAction,
} from "@/app/dashboard/notes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PinToNotesPayload } from "@/components/ai-tutor/PinToNotes";
import type { NoteRow } from "@/types/note";
import { cn } from "@/lib/utils";

type Step = "choose" | "pick-note" | "new-title";

export function PinToNotesDialog({
  open,
  payload,
  onClose,
  onSuccess,
}: {
  open: boolean;
  payload: PinToNotesPayload | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}) {
  const [step, setStep] = useState<Step>("choose");
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setStep("choose");
      setTitle("");
      setError(null);
      return;
    }

    setLoadingNotes(true);
    fetch("/api/notes")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load notes");
        return res.json() as Promise<NoteRow[]>;
      })
      .then((list) => {
        setNotes(list);
        if (list.length === 0) setStep("new-title");
      })
      .catch(() => {
        setNotes([]);
        setStep("new-title");
        setError("Could not load your notes. You can still create a new one.");
      })
      .finally(() => setLoadingNotes(false));
  }, [open]);

  const saveToExisting = (noteId: string) => {
    if (!payload) return;
    startTransition(async () => {
      try {
        const note = await appendPinnedMessageToNoteAction({
          noteId,
          content: payload.content,
          messageId: payload.messageId,
        });
        onSuccess?.(`Added to "${note.title}".`);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save to note");
      }
    });
  };

  const saveNewNote = () => {
    if (!payload) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Please enter a note title.");
      return;
    }
    startTransition(async () => {
      try {
        const note = await createPinnedNoteAction({
          title: trimmedTitle,
          content: payload.content,
          subject: payload.subject ?? null,
          messageId: payload.messageId,
        });
        onSuccess?.(`Created note "${note.title}".`);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create note");
      }
    });
  };

  if (!open || !payload) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pin-notes-title"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="glass-panel relative z-10 flex w-full max-w-md flex-col rounded-2xl p-6 shadow-glow"
        >
          <h2 id="pin-notes-title" className="text-lg font-semibold">
            Pin to notes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Save this AI answer to an existing note or create a new one.
          </p>

          {loadingNotes ? (
            <div className="mt-6 flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading your notes…
            </div>
          ) : (
            <div className="mt-4 min-h-0">
              {step === "choose" ? (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto justify-start gap-3 py-3"
                    onClick={() => setStep("pick-note")}
                  >
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-left">
                      <span className="block font-medium">Existing note</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Append this message to a note you already have
                      </span>
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto justify-start gap-3 py-3"
                    onClick={() => {
                      setError(null);
                      setStep("new-title");
                    }}
                  >
                    <FilePlus className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-left">
                      <span className="block font-medium">New note</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Create a note with a title you choose
                      </span>
                    </span>
                  </Button>
                </div>
              ) : null}

              {step === "pick-note" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Choose a note to append this message to:
                  </p>
                  <ul className="max-h-52 space-y-1 overflow-y-auto rounded-lg border p-1">
                    {notes.map((note) => (
                      <li key={note.id}>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => saveToExisting(note.id)}
                          className={cn(
                            "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                            "disabled:opacity-50"
                          )}
                        >
                          <span className="block truncate font-medium">
                            {note.title}
                          </span>
                          {note.subject ? (
                            <span className="text-xs text-muted-foreground">
                              {note.subject}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("choose")}
                  >
                    Back
                  </Button>
                </div>
              ) : null}

              {step === "new-title" ? (
                <div className="space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      You don&apos;t have any notes yet. Enter a title to create
                      your first note with this message.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Enter a title for the new note:
                    </p>
                  )}
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title"
                    maxLength={300}
                    disabled={isPending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveNewNote();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    {notes.length > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setStep("choose")}
                        disabled={isPending}
                      >
                        Back
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={saveNewNote}
                      disabled={isPending || !title.trim()}
                    >
                      {isPending ? "Saving…" : "Create note"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}

          {step === "choose" && !loadingNotes ? (
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
