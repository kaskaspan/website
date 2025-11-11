"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectLesson, selectTrack } from "@/store/slices";
import type { LessonTrack } from "@/types";

export function LessonSelector() {
  const dispatch = useAppDispatch();
  const {
    tracks,
    selectedTrackId,
    selectedLessonId,
    recommendedLessonIds,
    completed,
  } = useAppSelector((state) => state.curriculum);

  const recommendedLessons = useMemo(() => {
    return recommendedLessonIds
      .map((lessonId) => findLessonMeta(tracks, lessonId))
      .filter((item): item is LessonWithTrack => Boolean(item));
  }, [recommendedLessonIds, tracks]);

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">推荐课程</h3>
            <p className="text-sm text-white/60">
              根据最近表现自动挑选，优先补足弱项。
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recommendedLessons.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-white/60">
              暂无推荐，完成一次练习后会给出建议。
            </div>
          )}
          {recommendedLessons.map(({ lesson, trackName, trackDifficulty }) => (
            <button
              key={lesson.id}
              onClick={() => dispatch(selectLesson({ lessonId: lesson.id }))}
              className={`flex flex-col gap-2 rounded-lg border px-4 py-3 text-left transition ${
                lesson.id === selectedLessonId
                  ? "border-purple-400/60 bg-purple-500/20 text-white"
                  : "border-white/10 bg-black/20 text-white/80 hover:border-purple-300/40 hover:bg-purple-500/10"
              }`}
            >
              <span className="text-sm font-semibold text-white">
                {lesson.title}
              </span>
              <span className="text-xs text-white/60">
                {trackName} · 预计 {lesson.estimatedMinutes} 分钟 · 难度 {trackDifficulty ?? "—"}
              </span>
              <span className="text-xs text-white/50">
                {lesson.tags?.join(" · ")}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {tracks.map((track) => (
          <Card key={track.id} className="border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{track.name}</h3>
                <p className="text-sm text-white/60">{track.description}</p>
              </div>
              <Button
                variant={selectedTrackId === track.id ? "secondary" : "outline"}
                onClick={() => dispatch(selectTrack({ trackId: track.id }))}
                className="border-white/20 text-white"
              >
                {selectedTrackId === track.id ? "当前课程" : "切换到此课程"}
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {track.lessons.map((lesson) => {
                const progress = completed[lesson.id];
                const stars = progress?.bestStars ?? 0;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => dispatch(selectLesson({ lessonId: lesson.id }))}
                    className={`flex flex-col gap-2 rounded-lg border px-4 py-3 text-left transition ${
                      lesson.id === selectedLessonId
                        ? "border-purple-400/60 bg-purple-500/20 text-white"
                        : "border-white/10 bg-black/20 text-white/80 hover:border-purple-300/40 hover:bg-purple-500/10"
                    }`}
                  >
                    <span className="text-sm font-semibold text-white">
                      {lesson.title}
                    </span>
                    <span className="text-xs text-white/60">
                      预计 {lesson.estimatedMinutes} 分钟 · 标签 {lesson.tags.join(" · ")}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>星级：</span>
                      <span>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span
                            key={index}
                            className={index < stars ? "text-yellow-300" : "text-white/20"}
                          >
                            ★
                          </span>
                        ))}
                      </span>
                      <span>{progress ? ` · 已练 ${progress.attempts} 次` : "· 未练习"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function findLessonMeta(tracks: LessonTrack[], lessonId: string) {
  for (const track of tracks) {
    const lesson = track.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      return {
        lesson,
        trackId: track.id,
        trackName: track.name,
        trackDifficulty: track.difficultyIndex,
      };
    }
  }
  return null;
}

type LessonWithTrack = ReturnType<typeof findLessonMeta> extends infer R
  ? R extends null
    ? never
    : R
  : never;

