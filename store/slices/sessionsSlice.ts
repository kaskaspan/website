import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import type { SessionSummary } from "@/types";

export interface ActiveSessionState {
  sessionId: string | null;
  lessonId: string | null;
  text: string;
  cursorIndex: number;
  correct: number;
  errors: number;
  charactersTyped: number;
  startedAt: number | null;
  elapsedMs: number;
  isRunning: boolean;
}

export interface SessionsState {
  active: ActiveSessionState;
  history: SessionSummary[];
}

const createInitialActiveSession = (): ActiveSessionState => ({
  sessionId: null,
  lessonId: null,
  text: "",
  cursorIndex: 0,
  correct: 0,
  errors: 0,
  charactersTyped: 0,
  startedAt: null,
  elapsedMs: 0,
  isRunning: false,
});

const initialState: SessionsState = {
  active: createInitialActiveSession(),
  history: [],
};

interface StartSessionPayload {
  lessonId: string;
  text: string;
  timestamp?: number;
}

interface RecordKeystrokePayload {
  isCorrect: boolean;
  deltaMs?: number;
  count?: number;
}

const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    startSession(state, action: PayloadAction<StartSessionPayload>) {
      const { lessonId, text, timestamp } = action.payload;
      state.active = {
        sessionId: nanoid(),
        lessonId,
        text,
        cursorIndex: 0,
        correct: 0,
        errors: 0,
        charactersTyped: 0,
        startedAt: timestamp ?? Date.now(),
        elapsedMs: 0,
        isRunning: true,
      };
    },
    setSessionText(state, action: PayloadAction<string>) {
      state.active.text = action.payload;
      state.active.cursorIndex = 0;
      state.active.correct = 0;
      state.active.errors = 0;
      state.active.charactersTyped = 0;
    },
    recordKeystroke(state, action: PayloadAction<RecordKeystrokePayload>) {
      if (!state.active.isRunning) return;
      const count = Math.max(1, action.payload.count ?? 1);
      state.active.charactersTyped += count;
      if (action.payload.isCorrect) {
        state.active.correct += count;
      } else {
        state.active.errors += count;
      }
      if (typeof action.payload.deltaMs === "number") {
        state.active.elapsedMs += action.payload.deltaMs;
      }
    },
    updateCursor(state, action: PayloadAction<number>) {
      state.active.cursorIndex = action.payload;
    },
    setSessionElapsed(state, action: PayloadAction<number>) {
      state.active.elapsedMs = action.payload;
    },
    endSession(state, action: PayloadAction<SessionSummary>) {
      if (!state.active.isRunning) return;
      state.active.isRunning = false;
      state.history.unshift(action.payload);
      state.history = state.history.slice(0, 25);
    },
    resetSession(state) {
      state.active = createInitialActiveSession();
    },
    hydrateHistory(state, action: PayloadAction<SessionSummary[]>) {
      state.history = action.payload;
    },
  },
});

export const {
  startSession,
  setSessionText,
  recordKeystroke,
  updateCursor,
  setSessionElapsed,
  endSession,
  resetSession,
  hydrateHistory,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;

