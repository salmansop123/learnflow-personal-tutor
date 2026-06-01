"use client";

import { format } from "date-fns";
import { Loader2, Pencil, Pin, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ExportPDF } from "@/components/notes/ExportPDF";
import { Button } from "@/components/ui/button";
import {
  NOTE_CONTENT_MARKDOWN_CLASS,
  noteContentDisplayHtml,
  noteContentPlainText,
  polishNoteImagesForReadonly,
} from "@/lib/note-content";
import { persistNoteSummary, streamNoteSummary } from "@/lib/note-summarize";
import { toast } from "@/lib/toast";
import type { NoteRow } from "@/types/note";

export function NotePreview({
  note,
  open,
  onClose,
  onEdit,
  onNoteUpdated,
}: {
  note: NoteRow | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onNoteUpdated?: (note: NoteRow) => void;
}) {
  const router = useRouter();
  const [aiSummary, setAiSummary] = useState(note?.aiSummary ?? "");
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<string | null>(
    note?.aiSummaryGeneratedAt ?? null
  );
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!note) return;
    setAiSummary(note.aiSummary ?? "");
    setSummaryGeneratedAt(note.aiSummaryGeneratedAt ?? null);
    setSummaryError(null);
  }, [note?.id, note?.aiSummary, note?.aiSummaryGeneratedAt, note]);

  const handleSummarize = async () => {
    if (!note) return;
    const plainText = noteContentPlainText(note.content || "");
    if (!plainText.trim()) return;

    setIsSummarizing(true);
    setSummaryError(null);
    setAiSummary("");

    try {
      const fullSummary = await streamNoteSummary({
        content: plainText,
        noteId: note.id,
        subject: note.subject,
        onChunk: setAiSummary,
      });

      if (fullSummary) {
        const generatedAt = await persistNoteSummary(note.id, fullSummary);
        setSummaryGeneratedAt(generatedAt);
        onNoteUpdated?.({
          ...note,
          aiSummary: fullSummary,
          aiSummaryGeneratedAt: generatedAt,
        });
        router.refresh();
        toast.success("Summary generated.");
      }
    } catch {
      setSummaryError("Failed to generate summary. Please try again.");
      setAiSummary(note.aiSummary ?? "");
    } finally {
      setIsSummarizing(false);
    }
  };

  const hasContent = Boolean(
    note && noteContentPlainText(note.content || "").trim()
  );

  const noteBodyHtml = useMemo(() => {
    if (!note?.content) return "";
    const base = noteContentDisplayHtml(note.content);
    return polishNoteImagesForReadonly(base);
  }, [note?.content]);

  return (
    <AnimatePresence>
      {open && note ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close preview"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="glass-panel relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-glow"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b px-6 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-semibold">{note.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {note.subject ?? "General"} ·{" "}
                  {format(new Date(note.updatedAt), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>

            <div
              className="overflow-y-auto px-6 py-4 dark:[&_code]:bg-muted dark:[&_pre]:bg-muted"
              style={{ maxHeight: "calc(80vh - 140px)", overflowY: "auto" }}
            >
              {note.tags.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div
                className={NOTE_CONTENT_MARKDOWN_CLASS}
                dangerouslySetInnerHTML={{
                  __html: noteBodyHtml,
                }}
              />

              {(aiSummary || isSummarizing) && (
                <div className="mt-5 border-t border-dashed border-purple-200 pt-4 dark:border-purple-800/50">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles
                      className="h-3.5 w-3.5 text-purple-500"
                      aria-hidden
                    />
                    <span className="text-xs font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                      AI Summary
                    </span>
                    {summaryGeneratedAt && !isSummarizing && (
                      <span className="ml-auto text-xs text-gray-400 dark:text-muted-foreground">
                        {new Date(summaryGeneratedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    )}
                  </div>
                  <div className="min-h-[60px] rounded-xl border border-purple-100 bg-purple-50 p-3 dark:border-purple-900/50 dark:bg-purple-950/30">
                    {isSummarizing && aiSummary === "" && (
                      <div className="flex items-center gap-2 text-purple-400">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
                        <span className="text-sm">Generating summary...</span>
                      </div>
                    )}
                    {aiSummary && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-200">
                        {aiSummary}
                        {isSummarizing && (
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-purple-400" />
                        )}
                      </p>
                    )}
                  </div>
                  {summaryError ? (
                    <p className="mt-2 text-sm text-destructive">{summaryError}</p>
                  ) : null}
                </div>
              )}

              {note.pinnedFrom ? (
                <p className="mt-4 flex items-center gap-1 text-xs text-primary">
                  <Pin className="h-3 w-3" aria-hidden />
                  Pinned from AI tutor
                </p>
              ) : null}

              {note.fileUrl ? (
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm text-primary hover:underline"
                >
                  View attachment
                </a>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t px-6 py-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSummarizing || !hasContent}
                onClick={handleSummarize}
                className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSummarizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                )}
                Summarize
              </Button>
              <ExportPDF note={{ ...note, aiSummary, aiSummaryGeneratedAt: summaryGeneratedAt }} />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
