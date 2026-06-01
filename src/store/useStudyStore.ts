import { create } from "zustand";

import { clearActiveSession } from "@/lib/active-study-session-storage";

export type PendingTimeLogEntry = {
  sessionId: string;
  subjects: string[];
  durationMins: number;
};

interface StudyState {
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  pendingTimeLog: PendingTimeLogEntry | null;
  pendingTimeLogs: PendingTimeLogEntry[];
  enqueuePendingTimeLog: (data: PendingTimeLogEntry) => void;
  dequeueNextPendingTimeLog: () => void;
  sessionRestoredNotice: boolean;
  setSessionRestoredNotice: (show: boolean) => void;
  isEndingSession: boolean;
  setIsEndingSession: (ending: boolean) => void;
}

export const useStudyStore = create<StudyState>((set) => ({
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  pendingTimeLog: null,
  pendingTimeLogs: [],
  enqueuePendingTimeLog: (data) =>
    set((state) => {
      if (state.pendingTimeLog === null) {
        return { pendingTimeLog: data };
      }
      return { pendingTimeLogs: [...state.pendingTimeLogs, data] };
    }),
  dequeueNextPendingTimeLog: () =>
    set((state) => {
      if (state.pendingTimeLogs.length > 0) {
        const [next, ...rest] = state.pendingTimeLogs;
        const nextState = {
          pendingTimeLog: next,
          pendingTimeLogs: rest,
        };
        return nextState;
      }
      clearActiveSession();
      return { pendingTimeLog: null, pendingTimeLogs: [] };
    }),
  sessionRestoredNotice: false,
  setSessionRestoredNotice: (show) => set({ sessionRestoredNotice: show }),
  isEndingSession: false,
  setIsEndingSession: (ending) => set({ isEndingSession: ending }),
}));
