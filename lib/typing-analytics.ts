import type { SessionSummary } from "@/types";

const STORAGE_KEY = "typing-analytics-records";
const MAX_RECORDS = 250;

export interface TypingSessionRecord {
  id: string;
  lessonId: string;
  lessonTitle: string;
  trackId?: string;
  trackName?: string;
  summary: SessionSummary;
  timestamp: number;
}

export interface LessonAggregate {
  lessonId: string;
  lessonTitle: string;
  attempts: number;
  averageWpm: number;
  averageAccuracy: number;
  bestStars: number;
}

export interface TypingAnalyticsData {
  totalSessions: number;
  totalDurationMs: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  starCounts: Record<number, number>;
  recentSessions: TypingSessionRecord[];
  sessionsLastSeven: TypingSessionRecord[];
  lessonSummary: LessonAggregate[];
}

export function addTypingSession(record: {
  lessonId: string;
  lessonTitle: string;
  trackId?: string;
  trackName?: string;
  summary: SessionSummary;
}) {
  if (typeof window === "undefined") return;
  const records = getRecords();
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const timestamp = Date.now();
  const next: TypingSessionRecord = { id, timestamp, ...record };
  const updated = [next, ...records].slice(0, MAX_RECORDS);
  saveRecords(updated);
}

export function getTypingAnalytics(): TypingAnalyticsData | null {
  if (typeof window === "undefined") return null;
  const records = getRecords();
  if (records.length === 0) return null;

  let totalWpm = 0;
  let totalAccuracy = 0;
  let totalDuration = 0;
  let bestWpm = 0;
  let bestAccuracy = 0;
  const starCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const lessonMap = new Map<string, { title: string; attempts: number; wpm: number; accuracy: number; bestStars: number }>();

  records.forEach((record) => {
    const { summary } = record;
    totalWpm += summary.wpm ?? 0;
    totalAccuracy += summary.accuracy ?? 0;
    totalDuration += summary.durationMs ?? 0;
    bestWpm = Math.max(bestWpm, summary.wpm ?? 0);
    bestAccuracy = Math.max(bestAccuracy, summary.accuracy ?? 0);
    const stars = Math.round(summary.starRating ?? 0);
    starCounts[stars] = (starCounts[stars] ?? 0) + 1;

    const lesson = lessonMap.get(record.lessonId) ?? {
      title: record.lessonTitle,
      attempts: 0,
      wpm: 0,
      accuracy: 0,
      bestStars: 0,
    };
    lesson.attempts += 1;
    lesson.wpm += summary.wpm ?? 0;
    lesson.accuracy += summary.accuracy ?? 0;
    lesson.bestStars = Math.max(lesson.bestStars, summary.starRating ?? 0);
    lessonMap.set(record.lessonId, lesson);
  });

  const totalSessions = records.length;
  const averageWpm = Math.round(totalWpm / totalSessions);
  const averageAccuracy = Math.round(totalAccuracy / totalSessions);

  const recentSessions = records.slice(0, 8);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sessionsLastSeven = records.filter((record) => record.timestamp >= sevenDaysAgo);

  const lessonSummary: LessonAggregate[] = Array.from(lessonMap.entries()).map(
    ([lessonId, value]) => ({
      lessonId,
      lessonTitle: value.title,
      attempts: value.attempts,
      averageWpm: Math.round(value.wpm / value.attempts),
      averageAccuracy: Math.round(value.accuracy / value.attempts),
      bestStars: value.bestStars,
    })
  );

  lessonSummary.sort((a, b) => b.attempts - a.attempts);

  return {
    totalSessions,
    totalDurationMs: totalDuration,
    averageWpm,
    averageAccuracy,
    bestWpm,
    bestAccuracy,
    starCounts,
    recentSessions,
    sessionsLastSeven,
    lessonSummary,
  };
}

export function getTypingRecords(): TypingSessionRecord[] {
  if (typeof window === "undefined") return [];
  return getRecords();
}

export function clearTypingAnalytics() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

function getRecords(): TypingSessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as TypingSessionRecord[];
  } catch (error) {
    console.error("Failed to parse typing analytics records", error);
    return [];
  }
}

function saveRecords(records: TypingSessionRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

