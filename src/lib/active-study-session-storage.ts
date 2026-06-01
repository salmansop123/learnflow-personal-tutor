export const ACTIVE_SESSION_STORAGE_KEY = "learnflow_active_session";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type StoredActiveSession = {
  sessionId: string;
  subjects: string[];
  startedAt: string;
  durationMins?: number | null;
};

export function saveActiveSession(data: StoredActiveSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadActiveSession(): StoredActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredActiveSession;
    if (
      !parsed?.sessionId ||
      !parsed.startedAt ||
      !Array.isArray(parsed.subjects) ||
      parsed.subjects.length === 0
    ) {
      clearActiveSession();
      return null;
    }
    const age = Date.now() - new Date(parsed.startedAt).getTime();
    if (Number.isNaN(age) || age < 0 || age > MAX_AGE_MS) {
      clearActiveSession();
      return null;
    }
    return parsed;
  } catch {
    clearActiveSession();
    return null;
  }
}

export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
