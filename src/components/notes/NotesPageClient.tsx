"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FileText } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { NoteCard } from "@/components/notes/NoteCard";
import { EmptyState } from "@/components/ui/empty-state";
import { AiUsageQuotaBanner } from "@/components/ai-usage/AiUsageQuotaBanner";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NotePreview } from "@/components/notes/NotePreview";
import { Input } from "@/components/ui/input";
import type { NoteRow } from "@/types/note";

type PanelMode = "empty" | "preview" | "edit" | "create";

function buildNotesHref(
  pathname: string,
  noteId: string | null,
  mode?: "edit" | null
): string {
  if (!noteId) return pathname;
  const params = new URLSearchParams({ noteId });
  if (mode === "edit") params.set("mode", "edit");
  return `${pathname}?${params.toString()}`;
}

export function NotesPageClient({ notes }: { notes: NoteRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<PanelMode>("empty");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [extraNotes, setExtraNotes] = useState<NoteRow[]>([]);
  const [quotaRefresh, setQuotaRefresh] = useState(0);
  const fetchingNoteIdRef = useRef<string | null>(null);

  const displayNotes = useMemo(() => {
    const serverIds = new Set(notes.map((n) => n.id));
    const pending = extraNotes.filter((n) => !serverIds.has(n.id));
    return [...pending, ...notes];
  }, [notes, extraNotes]);

  useEffect(() => {
    setExtraNotes((prev) => prev.filter((n) => notes.some((s) => s.id === n.id)));
  }, [notes]);

  const isEmptyList = displayNotes.length === 0;
  const showEditor = mode === "create" || mode === "edit";
  const [mounted, setMounted] = useState(false);

  const clearNotesUrl = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const setNotesUrl = useCallback(
    (noteId: string | null, editMode?: "edit" | null, options?: { push?: boolean }) => {
      const href = buildNotesHref(pathname, noteId, editMode);
      if (options?.push) {
        router.push(href, { scroll: false });
      } else {
        router.replace(href, { scroll: false });
      }
    },
    [router, pathname]
  );

  const applyNoteFromUrl = useCallback(
    (note: NoteRow, modeParam: string | null) => {
      setSelectedId(note.id);
      if (modeParam === "edit") {
        setMode("edit");
        setPreviewOpen(false);
      } else {
        setMode("preview");
        setPreviewOpen(true);
      }
    },
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showEditor) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showEditor]);

  // Restore note / edit state from URL (survives refresh; re-runs when searchParams hydrate).
  useEffect(() => {
    const noteId = searchParams.get("noteId");
    const modeParam = searchParams.get("mode");
    const wantsEdit = modeParam === "edit";

    if (!noteId) {
      fetchingNoteIdRef.current = null;
      return;
    }

    if (selectedId === noteId) {
      if (wantsEdit && mode === "edit") return;
      if (!wantsEdit && mode === "preview" && previewOpen) return;
    }

    const fromList = displayNotes.find((n) => n.id === noteId);
    if (fromList) {
      fetchingNoteIdRef.current = null;
      applyNoteFromUrl(fromList, modeParam);
      return;
    }

    if (fetchingNoteIdRef.current === noteId) return;
    fetchingNoteIdRef.current = noteId;

    fetch(`/api/notes?id=${encodeURIComponent(noteId)}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json() as Promise<NoteRow & { error?: string }>;
      })
      .then((note) => {
        if (note?.id && !note.error) {
          setExtraNotes((prev) => [
            note,
            ...prev.filter((n) => n.id !== note.id),
          ]);
          applyNoteFromUrl(note, modeParam);
        } else {
          clearNotesUrl();
        }
      })
      .catch(() => {
        clearNotesUrl();
      })
      .finally(() => {
        if (fetchingNoteIdRef.current === noteId) {
          fetchingNoteIdRef.current = null;
        }
      });
  }, [
    searchParams,
    displayNotes,
    notes,
    selectedId,
    mode,
    previewOpen,
    applyNoteFromUrl,
    clearNotesUrl,
  ]);

  // Browser back/forward while staying on the notes page.
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const noteId = params.get("noteId");
      const modeParam = params.get("mode");

      if (!noteId) {
        setSelectedId(null);
        setPreviewOpen(false);
        setMode("empty");
        return;
      }

      const targetNote = displayNotes.find((n) => n.id === noteId);
      if (targetNote) {
        applyNoteFromUrl(targetNote, modeParam);
        return;
      }

      fetch(`/api/notes?id=${encodeURIComponent(noteId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((note: (NoteRow & { error?: string }) | null) => {
          if (note?.id && !note.error) {
            setExtraNotes((prev) => [
              note,
              ...prev.filter((n) => n.id !== note.id),
            ]);
            applyNoteFromUrl(note, modeParam);
          }
        })
        .catch(() => undefined);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [displayNotes, applyNoteFromUrl]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    for (const n of displayNotes) {
      if (n.subject) set.add(n.subject);
    }
    return Array.from(set);
  }, [displayNotes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of displayNotes) {
      for (const t of n.tags) set.add(t);
    }
    return Array.from(set);
  }, [displayNotes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return displayNotes.filter((note) => {
      if (subjectFilter && note.subject !== subjectFilter) return false;
      if (tagFilter && !note.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [displayNotes, search, subjectFilter, tagFilter]);

  const selectedNote =
    selectedId ? displayNotes.find((n) => n.id === selectedId) ?? null : null;

  const openPreview = (noteId: string) => {
    setNotesUrl(noteId, null, { push: true });
    setSelectedId(noteId);
    setMode("preview");
    setPreviewOpen(true);
  };

  const openEdit = () => {
    if (!selectedNote) return;
    setNotesUrl(selectedNote.id, "edit", { push: true });
    setPreviewOpen(false);
    setMode("edit");
  };

  const openEditForNote = (noteId: string) => {
    setNotesUrl(noteId, "edit", { push: true });
    setSelectedId(noteId);
    setPreviewOpen(false);
    setMode("edit");
  };

  const openCreate = () => {
    clearNotesUrl();
    setSelectedId(null);
    setPreviewOpen(false);
    setMode("create");
  };

  const handleNoteSaved = (note: NoteRow, options?: { isNew?: boolean }) => {
    if (options?.isNew) {
      setExtraNotes((prev) => [note, ...prev.filter((n) => n.id !== note.id)]);
    }
    clearNotesUrl();
    setSelectedId(null);
    setPreviewOpen(false);
    setMode("empty");
  };

  const handleNoteDraftCreated = (draft: NoteRow) => {
    setExtraNotes((prev) => [draft, ...prev.filter((n) => n.id !== draft.id)]);
    setSelectedId(draft.id);
    setMode("edit");
    setPreviewOpen(false);
    setNotesUrl(draft.id, "edit", { push: false });
  };

  const handleEditorCancel = () => {
    clearNotesUrl();
    setSelectedId(null);
    setPreviewOpen(false);
    setMode("empty");
  };

  const handlePreviewClose = () => {
    clearNotesUrl();
    setPreviewOpen(false);
    setMode("empty");
    setSelectedId(null);
  };

  const editorOverlay =
    mounted &&
    createPortal(
      <AnimatePresence>
        {showEditor ? (
          <motion.div
            key="note-editor-overlay"
            className="fixed inset-0 z-[100] flex flex-col bg-white"
            style={{ zIndex: 100 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <NoteEditor
              note={mode === "edit" ? selectedNote : null}
              onSaved={handleNoteSaved}
              onCancel={handleEditorCancel}
              onNoteDraftCreated={handleNoteDraftCreated}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body
    );

  if (isEmptyList) {
    return (
      <>
        <AiUsageQuotaBanner
          features={["summary"]}
          refreshToken={quotaRefresh}
          compact
        />
        <div className="mx-auto max-w-2xl">
          {mode === "empty" ? (
            <EmptyState
              icon={FileText}
              title="No notes yet"
              description="Capture ideas, attach files, and summarize with AI."
              actionLabel="Create your first note"
              onAction={openCreate}
            />
          ) : null}
        </div>
        {editorOverlay}
      </>
    );
  }

  return (
    <>
      <div className="min-w-0 space-y-4">
        <AiUsageQuotaBanner
          features={["summary"]}
          refreshToken={quotaRefresh}
          compact
        />
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="flex-1"
            />
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              New note
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={FileText}
                  title="No matching notes"
                  description="Try a different search or clear your filters."
                  className="py-8"
                />
              </div>
            ) : (
              filtered.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  selected={
                    selectedId === note.id && previewOpen && mode === "preview"
                  }
                  onSelect={() => openPreview(note.id)}
                  onEdit={() => openEditForNote(note.id)}
                  onDeleted={(id) => {
                    if (selectedId === id) {
                      clearNotesUrl();
                      setPreviewOpen(false);
                      setMode("empty");
                      setSelectedId(null);
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>

        <NotePreview
          note={selectedNote}
          open={previewOpen && mode === "preview"}
          onClose={handlePreviewClose}
          onEdit={openEdit}
          onUsageConsumed={() => setQuotaRefresh((n) => n + 1)}
          onNoteUpdated={(updated) => {
            setExtraNotes((prev) => {
              const idx = prev.findIndex((n) => n.id === updated.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updated;
                return next;
              }
              return [updated, ...prev];
            });
          }}
        />
      </div>
      {editorOverlay}
    </>
  );
}
