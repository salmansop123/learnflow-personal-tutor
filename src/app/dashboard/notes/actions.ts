"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { createNote, deleteNote, getNote, updateNote } from "@/lib/notes";
import type { NoteCreateInput, NoteRow, NoteUpdateInput } from "@/types/note";

function revalidateNotes() {
  revalidatePath("/dashboard/notes");
  revalidatePath("/dashboard");
}

export async function createNoteAction(
  data: NoteCreateInput
): Promise<NoteRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const note = await createNote(session.user.id, data);
  revalidateNotes();
  return note;
}

export async function updateNoteAction(
  noteId: string,
  data: NoteUpdateInput
): Promise<NoteRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const note = await updateNote(session.user.id, noteId, data);
  revalidateNotes();
  return note;
}

export async function deleteNoteAction(noteId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await deleteNote(session.user.id, noteId);
  revalidateNotes();
}

/** @deprecated Use createPinnedNoteAction or appendPinnedMessageToNoteAction */
export async function pinMessageToNoteAction(data: {
  messageId: string;
  content: string;
  subject?: string | null;
}): Promise<NoteRow> {
  const title =
    data.content.trim().slice(0, 60) +
      (data.content.length > 60 ? "…" : "") || "Pinned from AI Tutor";
  return createPinnedNoteAction({
    title,
    content: data.content,
    subject: data.subject ?? null,
    messageId: data.messageId,
  });
}

export async function createPinnedNoteAction(data: {
  title: string;
  content: string;
  subject?: string | null;
  messageId: string;
}): Promise<NoteRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const trimmedTitle = data.title.trim();
  if (!trimmedTitle) throw new Error("Title cannot be empty");

  const note = await createNote(session.user.id, {
    title: trimmedTitle.slice(0, 300),
    content: data.content.trim(),
    subject: data.subject ?? null,
    tags: ["ai-tutor"],
    pinnedFrom: data.messageId,
  });
  revalidateNotes();
  revalidatePath("/dashboard/ai-tutor");
  return note;
}

export async function appendPinnedMessageToNoteAction(data: {
  noteId: string;
  content: string;
  messageId: string;
}): Promise<NoteRow> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await getNote(session.user.id, data.noteId);
  const block = data.content.trim();
  if (!block) throw new Error("Nothing to pin");

  const merged = existing.content.trim()
    ? `${existing.content.trim()}\n\n---\n\n${block}`
    : block;

  const note = await updateNote(session.user.id, data.noteId, {
    content: merged,
    pinnedFrom: data.messageId,
  });
  revalidateNotes();
  revalidatePath("/dashboard/ai-tutor");
  return note;
}
