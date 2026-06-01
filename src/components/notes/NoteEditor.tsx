"use client";

import { formatDistanceToNow } from "date-fns";
import { Bold, ChevronLeft, Italic, List, Minus, Plus, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

import {
  createNoteAction,
  updateNoteAction,
} from "@/app/dashboard/notes/actions";
import { ExportPDF } from "@/components/notes/ExportPDF";
import { Button } from "@/components/ui/button";
import {
  buildNoteImageBlockHtml,
  countEmbeddedImagesInHtml,
  isNoteContentEmpty,
  noteContentPlainText,
  prepareContentForEditor,
  renumberEmbeddedImagesInElement,
} from "@/lib/note-content";
import { toast, toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { NoteRow } from "@/types/note";

function ToolbarButton({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded text-sm transition-colors",
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

export function NoteEditor({
  note,
  onSaved,
  onCancel,
  onNoteDraftCreated,
}: {
  note: NoteRow | null;
  onSaved?: (note: NoteRow, options?: { isNew?: boolean }) => void;
  onCancel?: () => void;
  /** Keeps the editor open after first save (e.g. image upload on a new note). */
  onNoteDraftCreated?: (note: NoteRow) => void;
}) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const loadedNoteIdRef = useRef<string | null>(null);
  const isCreateModeRef = useRef(!note?.id);
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(() =>
    prepareContentForEditor(note?.content ?? "")
  );
  const [subject, setSubject] = useState(note?.subject ?? "");
  const [tagsInput, setTagsInput] = useState(note?.tags.join(", ") ?? "");
  const [fileUrl, setFileUrl] = useState(note?.fileUrl ?? "");
  const [aiSummary, setAiSummary] = useState<string>(note?.aiSummary ?? "");
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<string | null>(
    note?.aiSummaryGeneratedAt ?? null
  );
  const [isPending, startTransition] = useTransition();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isBullet, setIsBullet] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }, []);

  const syncEditorFromNote = useCallback((rawContent: string) => {
    const prepared = prepareContentForEditor(rawContent);
    setContent(prepared);
    if (editorRef.current) {
      editorRef.current.innerHTML = prepared;
    }
  }, []);

  // Only reset the editor when switching to a different note (not on every parent re-render).
  useEffect(() => {
    const nextId = note?.id ?? null;

    if (nextId && note) {
      if (loadedNoteIdRef.current === nextId) return;
      loadedNoteIdRef.current = nextId;
      isCreateModeRef.current = false;
      setTitle(note.title ?? "");
      syncEditorFromNote(note.content ?? "");
      setSubject(note.subject ?? "");
      setTagsInput(note.tags.join(", ") ?? "");
      setFileUrl(note.fileUrl ?? "");
      setAiSummary(note.aiSummary ?? "");
      setSummaryGeneratedAt(note.aiSummaryGeneratedAt ?? null);
      return;
    }

    if (isCreateModeRef.current && loadedNoteIdRef.current === null) {
      return;
    }

    loadedNoteIdRef.current = null;
    isCreateModeRef.current = true;
    setTitle("");
    syncEditorFromNote("");
    setSubject("");
    setTagsInput("");
    setFileUrl("");
    setAiSummary("");
    setSummaryGeneratedAt(null);
  }, [note, syncEditorFromNote]);

  useEffect(() => {
    const updateToolbarState = () => {
      const editor = editorRef.current;
      if (!editor) return;
      const selection = window.getSelection();
      if (
        selection &&
        selection.rangeCount > 0 &&
        editor.contains(selection.anchorNode)
      ) {
        setIsBold(document.queryCommandState("bold"));
        setIsItalic(document.queryCommandState("italic"));
        setIsBullet(document.queryCommandState("insertUnorderedList"));
      }
    };
    document.addEventListener("selectionchange", updateToolbarState);
    return () => document.removeEventListener("selectionchange", updateToolbarState);
  }, []);

  const runExecCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    handleContentChange();
  };

  const applyFontSize = (newSize: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    if (!range.collapsed) {
      try {
        const span = document.createElement("span");
        span.style.fontSize = `${newSize}px`;
        range.surroundContents(span);
      } catch {
        const fragment = range.extractContents();
        const span = document.createElement("span");
        span.style.fontSize = `${newSize}px`;
        span.appendChild(fragment);
        range.insertNode(span);
      }
    } else {
      const span = document.createElement("span");
      span.style.fontSize = `${newSize}px`;
      span.appendChild(document.createTextNode("\u200B"));
      range.insertNode(span);
      const textNode = span.firstChild;
      if (textNode) {
        range.setStart(textNode, 1);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    setFontSize(newSize);
    handleContentChange();
  };

  const changeFontSize = (delta: number) => {
    const next = Math.min(20, Math.max(8, fontSize + delta));
    if (next === fontSize) return;
    applyFontSize(next);
  };

  const getEditorHtml = () => editorRef.current?.innerHTML ?? content;

  const parseTags = () =>
    tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const countEmbeddedImages = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? content;
    return countEmbeddedImagesInHtml(html);
  }, [content]);

  const embeddedImageCount = countEmbeddedImagesInHtml(content);

  const persistNoteAfterImage = async (html: string, titleValue: string) => {
    const payload = {
      title: titleValue,
      content: html,
      subject: subject.trim() || null,
      tags: parseTags(),
      fileUrl: fileUrl || null,
    };

    if (note?.id) {
      await updateNoteAction(note.id, payload);
      router.refresh();
      return;
    }

    const created = await createNoteAction(payload);
    loadedNoteIdRef.current = created.id;
    isCreateModeRef.current = false;
    onNoteDraftCreated?.(created);
    router.refresh();
  };

  const persistCurrentNote = useCallback(
    async (html: string) => {
      const titleValue = title.trim() || "Untitled";
      await persistNoteAfterImage(html, titleValue);
    },
    // persistNoteAfterImage uses note, title, subject, etc. from closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [note?.id, title, subject, tagsInput, fileUrl]
  );

  const appendImageToNote = useCallback(
    (url: string): string | null => {
      const editor = editorRef.current;
      if (!editor) return null;

      const imageNumber = countEmbeddedImages() + 1;
      const blockHtml = buildNoteImageBlockHtml(url, imageNumber);
      editor.insertAdjacentHTML("beforeend", blockHtml);
      renumberEmbeddedImagesInElement(editor);

      const block = editor.querySelector("[data-note-image]:last-of-type");
      block?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      const titleInput = block?.querySelector(
        "[data-note-image-title]"
      ) as HTMLInputElement | null;
      titleInput?.focus();

      const html = editor.innerHTML;
      setContent(html);
      return html;
    },
    [countEmbeddedImages]
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleEditorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const deleteBtn = target.closest("[data-note-image-delete]");
      if (!deleteBtn || !editor.contains(deleteBtn)) return;

      event.preventDefault();
      event.stopPropagation();

      const block = deleteBtn.closest("[data-note-image]");
      block?.remove();
      renumberEmbeddedImagesInElement(editor);

      const html = editor.innerHTML;
      setContent(html);

      if (note?.id || loadedNoteIdRef.current) {
        void persistCurrentNote(html);
      }

      toast.success("Image removed.");
    };

    editor.addEventListener("click", handleEditorClick);
    return () => editor.removeEventListener("click", handleEditorClick);
  }, [note?.id, persistCurrentNote]);

  const handleImageFile = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/notes/upload-attachment", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Image upload failed");
      }

      const html = appendImageToNote(data.url);
      if (!html) {
        throw new Error("Could not add image to the note");
      }

      const titleValue = title.trim() || "Untitled";

      await persistNoteAfterImage(html, titleValue);

      toast.success(
        note?.id
          ? "Screenshot added. Add a title above if you like."
          : "Screenshot added and saved. Add a note title if you like."
      );
    } catch (e) {
      toastError(e, "Image upload failed");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleSave = () => {
    const htmlContent = getEditorHtml();
    let finalTitle = title.trim();

    if (!finalTitle) {
      const imageCount = countEmbeddedImages();
      if (imageCount > 0) {
        finalTitle = "Untitled";
      } else {
        toast.error("Title is required.");
        return;
      }
    }

    startTransition(async () => {
      try {
        const payload = {
          title: finalTitle,
          content: htmlContent,
          subject: subject.trim() || null,
          tags: parseTags(),
          fileUrl: fileUrl || null,
        };

        if (note) {
          const updated = await updateNoteAction(note.id, payload);
          toast.success("Note updated.");
          onSaved?.(updated, { isNew: false });
        } else {
          const created = await createNoteAction(payload);
          setTitle("");
          syncEditorFromNote("");
          setSubject("");
          setTagsInput("");
          setFileUrl("");
          toast.success("Note created.");
          onSaved?.(created, { isNew: true });
        }
        router.refresh();
      } catch (e) {
        toastError(e, "Failed to save");
      }
    });
  };

  return (
    <div className="flex h-screen min-h-0 flex-col bg-white">
      {/* Zone 1 — top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-3 shadow-sm sm:gap-3 sm:px-4">
        {onCancel ? (
          <button
            type="button"
            onClick={() => onCancel()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Back to notes"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                embeddedImageCount > 0
                  ? "Add your screenshot title"
                  : "Untitled Note"
              }
              className="min-w-0 flex-1 border-0 bg-transparent text-[22px] font-bold text-gray-900 outline-none placeholder:text-gray-400"
            />
            {embeddedImageCount > 0 ? (
              <span className="shrink-0 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                {embeddedImageCount} screenshot
                {embeddedImageCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          {embeddedImageCount > 0 && !title.trim() ? (
            <p className="text-xs text-gray-500">
              Add your screenshot title above (optional)
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="h-8 max-w-[140px] rounded-full border border-gray-200 bg-gray-50 px-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
          />
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags"
            className="hidden h-8 max-w-[140px] rounded-full border border-gray-200 bg-gray-50 px-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 sm:block"
          />

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={
              isPending ||
              (!title.trim() &&
                isNoteContentEmpty(getEditorHtml()) &&
                countEmbeddedImages() === 0)
            }
            className="h-8"
          >
            {isPending ? "Saving…" : note ? "Update note" : "Create note"}
          </Button>
        </div>
      </header>

      {/* Zone 2 — formatting toolbar */}
      <div
        className="flex h-11 shrink-0 flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-3 sm:px-4"
        role="toolbar"
        aria-label="Text formatting"
      >
        <ToolbarButton
          active={isBold}
          ariaLabel="Bold"
          onClick={() => runExecCommand("bold")}
        >
          <Bold className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          active={isItalic}
          ariaLabel="Italic"
          onClick={() => runExecCommand("italic")}
        >
          <Italic className="h-4 w-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          active={isBullet}
          ariaLabel="Bullet list"
          onClick={() => runExecCommand("insertUnorderedList")}
        >
          <List className="h-4 w-4" aria-hidden />
        </ToolbarButton>

        <div
          className="mx-1 h-5 border-r border-gray-300 dark:border-border"
          aria-hidden
        />

        <div className="flex items-center gap-0.5">
          <ToolbarButton
            active={false}
            ariaLabel="Decrease font size"
            onClick={() => changeFontSize(-1)}
          >
            <Minus className="h-4 w-4" aria-hidden />
          </ToolbarButton>
          <span className="min-w-[3rem] px-1 text-center text-xs font-medium tabular-nums text-gray-700">
            {fontSize}px
          </span>
          <ToolbarButton
            active={false}
            ariaLabel="Increase font size"
            onClick={() => changeFontSize(1)}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </ToolbarButton>
        </div>
        <span className="ml-1 text-[10px] text-gray-500">8–20px</span>
      </div>

      {/* Zone 3 — document body (gray canvas scrolls; white page grows with content) */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100 px-4 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-[820px] pb-8">
          <div
            className="h-auto min-h-[calc(100dvh-7rem)] overflow-visible rounded bg-white px-8 py-12 shadow-[0_1px_4px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.06)] sm:px-[72px] sm:py-[60px]"
          >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentChange}
            className="note-editor-page block min-h-[600px] h-auto w-full overflow-visible break-words outline-none text-[#1a1a2e]"
            style={{
              fontSize: "15px",
              lineHeight: 1.8,
              fontFamily: "inherit",
            }}
            data-placeholder="Write your note here... (optional)"
          />

          {aiSummary ? (
            <div className="mt-8 border-t border-dashed border-purple-200 pt-6">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-purple-500">
                    <Sparkles size={15} aria-hidden />
                  </span>
                  <span className="text-sm font-semibold text-purple-700">
                    AI Summary
                  </span>
                </div>
                {summaryGeneratedAt ? (
                  <span className="text-xs text-gray-400">
                    Generated{" "}
                    {formatDistanceToNow(new Date(summaryGeneratedAt), {
                      addSuffix: true,
                    })}
                  </span>
                ) : null}
              </div>

              <div className="min-h-[60px] rounded-lg border border-purple-100 bg-purple-50 p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {aiSummary}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Open the note preview to regenerate the summary.
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-col gap-2 border-t border-gray-100 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImageFile(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingImage}
                onClick={() => imageInputRef.current?.click()}
              >
                {isUploadingImage ? "Uploading…" : "Upload image"}
              </Button>
              {fileUrl ? (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View attachment
                </a>
              ) : null}
              {note ? (
                <ExportPDF
                  note={{
                    ...note,
                    title: title.trim() || note.title,
                    content: getEditorHtml() || note.content,
                    subject: subject.trim() || null,
                    tags: parseTags(),
                  }}
                />
              ) : null}
            </div>
            <p className="text-xs text-gray-400">
              PNG, JPG, GIF, or WebP — each image is added below your note with a
              number label
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
