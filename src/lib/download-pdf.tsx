"use client";

import type { NoteRow } from "@/types/note";
import type { StudySessionRow } from "@/types/study";

import type { StudySessionsPdfData } from "@/lib/pdf";

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "export"
  );
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function downloadNotePdf(note: NoteRow): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const { NoteDocument } = await import("@/lib/pdf");
  const blob = await pdf(<NoteDocument note={note} />).toBlob();
  triggerBlobDownload(blob, `${sanitizeFilename(note.title)}.pdf`);
}

export async function downloadStudySessionsPdf(
  sessions: StudySessionRow[],
  hoursBySubject: Record<string, number>
): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");
  const { StudySessionsDocument } = await import("@/lib/pdf");
  const data: StudySessionsPdfData = {
    sessions,
    hoursBySubject,
    exportedAt: new Date().toISOString(),
  };
  const blob = await pdf(<StudySessionsDocument data={data} />).toBlob();
  triggerBlobDownload(blob, "study-sessions.pdf");
}
