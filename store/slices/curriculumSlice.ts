import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { lessonTracks } from "@/data/curriculum/tracks";
import { lessonContents } from "@/data/curriculum/contents";
import type { LessonContent, LessonTrack, SessionSummary } from "@/types";

export interface CurriculumState {
  tracks: LessonTrack[];
  contents: Record<string, LessonContent>;
  selectedTrackId: string | null;
  selectedLessonId: string | null;
  completed: Record<string, { bestStars: number; attempts: number }>;
  recommendedLessonIds: string[];
}

const contentsMap = lessonContents.reduce<Record<string, LessonContent>>(
  (acc, content) => {
    acc[content.id] = content;
    return acc;
  },
  {}
);

const defaultTrackId = lessonTracks[0]?.id ?? null;
const defaultLessonId = lessonTracks[0]?.lessons[0]?.id ?? null;

const initialState: CurriculumState = {
  tracks: lessonTracks,
  contents: contentsMap,
  selectedTrackId: defaultTrackId,
  selectedLessonId: defaultLessonId,
  completed: {},
  recommendedLessonIds: defaultLessonId ? [defaultLessonId] : [],
};

interface SelectTrackPayload {
  trackId: string;
}

interface SelectLessonPayload {
  lessonId: string;
}

interface CompleteLessonPayload {
  lessonId: string;
  summary: SessionSummary;
}

const findNextLesson = (track: LessonTrack, lessonId: string) => {
  const index = track.lessons.findIndex((lesson) => lesson.id === lessonId);
  if (index >= 0 && index + 1 < track.lessons.length) {
    return track.lessons[index + 1].id;
  }
  return null;
};

const curriculumSlice = createSlice({
  name: "curriculum",
  initialState,
  reducers: {
    selectTrack(state, action: PayloadAction<SelectTrackPayload>) {
      const trackId = action.payload.trackId;
      state.selectedTrackId = trackId;
      const track = state.tracks.find((item) => item.id === trackId);
      if (track?.lessons[0]) {
        state.selectedLessonId = track.lessons[0].id;
      }
    },
    selectLesson(state, action: PayloadAction<SelectLessonPayload>) {
      state.selectedLessonId = action.payload.lessonId;
    },
    completeLesson(state, action: PayloadAction<CompleteLessonPayload>) {
      const { lessonId, summary } = action.payload;
      const record = state.completed[lessonId] ?? { bestStars: 0, attempts: 0 };
      state.completed[lessonId] = {
        bestStars: Math.max(record.bestStars, summary.starRating ?? 0),
        attempts: record.attempts + 1,
      };
      state.recommendedLessonIds = computeRecommendations(state, lessonId, summary);
    },
    setRecommendations(state, action: PayloadAction<string[]>) {
      state.recommendedLessonIds = action.payload;
    },
  },
});

const computeRecommendations = (
  state: CurriculumState,
  currentLessonId: string,
  summary: SessionSummary
) => {
  const track = state.tracks.find((item) =>
    item.lessons.some((lesson) => lesson.id === currentLessonId)
  );
  if (!track) {
    return [currentLessonId];
  }

  const accuracy = summary.accuracy ?? 0;
  const stars = summary.starRating ?? 0;

  if (stars < 3 || accuracy < 90) {
    return [currentLessonId];
  }

  const nextLessonId = findNextLesson(track, currentLessonId);
  if (nextLessonId) {
    return [nextLessonId];
  }

  const currentTrackIndex = state.tracks.findIndex((item) => item.id === track.id);
  if (currentTrackIndex >= 0 && currentTrackIndex + 1 < state.tracks.length) {
    const nextTrack = state.tracks[currentTrackIndex + 1];
    const firstLesson = nextTrack.lessons[0];
    if (firstLesson) {
      return [firstLesson.id];
    }
  }

  return [currentLessonId];
};

export const { selectTrack, selectLesson, completeLesson, setRecommendations } =
  curriculumSlice.actions;

export default curriculumSlice.reducer;

