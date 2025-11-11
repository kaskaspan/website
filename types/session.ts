import type { TypingRuleSetting } from "./settings";

export interface TypingEvent {
  timestamp: number;
  key: string;
  action: "keydown" | "keyup" | "autoscroll";
  isCorrect?: boolean;
  latencyMs?: number;
  cursorIndex?: number;
}

export interface HesitationStat {
  averageMs: number;
  longestMs: number;
  occurrences: number;
}

export interface FingerUsageStat {
  finger: "thumb" | "index" | "middle" | "ring" | "pinky";
  hand: "left" | "right";
  presses: number;
  errors: number;
}

export type KeyHeatmap = Record<string, {
  presses: number;
  errors: number;
}>;

export interface SessionSummary {
  durationMs: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  errorRate: number;
  starRating: number;
  streak: number;
  burstSpeed?: number;
  hesitationStats?: HesitationStat;
  fingerUsage?: FingerUsageStat[];
  heatmap?: KeyHeatmap;
}

export interface TypingSession {
  id: string;
  userId: string;
  lessonId: string;
  trackId: string;
  startedAt: string;
  finishedAt?: string;
  config: TypingRuleSetting;
  summary?: SessionSummary;
  events?: TypingEvent[];
}

