/** Serialize selected tutor subjects for Conversation.subject (varchar). */
export function serializeTutorSubjects(subjects: string[]): string | null {
  const normalized = normalizeSubjectList(subjects);
  if (normalized.length === 0) return null;
  return normalized.join(", ");
}

/** Parse Conversation.subject or legacy single-subject values. */
export function parseTutorSubjects(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return normalizeSubjectList(raw.split(","));
}

export function normalizeSubjectList(subjects: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const s of subjects) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export function toggleSubject(
  selected: string[],
  subject: string
): string[] {
  const key = subject.trim().toLowerCase();
  const exists = selected.some((s) => s.toLowerCase() === key);
  if (exists) {
    return selected.filter((s) => s.toLowerCase() !== key);
  }
  return normalizeSubjectList([...selected, subject.trim()]);
}
