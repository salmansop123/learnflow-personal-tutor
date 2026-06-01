import { serverApiFetch } from "@/lib/api-server";
import type { NoteCreateInput, NoteRow, NoteUpdateInput } from "@/types/note";

export type NoteListFilters = {
  q?: string;
  subject?: string;
  tag?: string;
};

function queryString(filters?: NoteListFilters): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.subject) params.set("subject", filters.subject);
  if (filters.tag) params.set("tag", filters.tag);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listNotes(
  userId: string,
  filters?: NoteListFilters
): Promise<NoteRow[]> {
  return serverApiFetch<NoteRow[]>(`/notes${queryString(filters)}`, userId);
}

export async function getNote(
  userId: string,
  noteId: string
): Promise<NoteRow> {
  return serverApiFetch<NoteRow>(`/notes/${noteId}`, userId);
}

export async function createNote(
  userId: string,
  data: NoteCreateInput
): Promise<NoteRow> {
  return serverApiFetch<NoteRow>("/notes", userId, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateNote(
  userId: string,
  noteId: string,
  data: NoteUpdateInput
): Promise<NoteRow> {
  return serverApiFetch<NoteRow>(`/notes/${noteId}`, userId, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(
  userId: string,
  noteId: string
): Promise<void> {
  await serverApiFetch(`/notes/${noteId}`, userId, { method: "DELETE" });
}
