// "use client" ensures this component runs only on the client side
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import styles from "@/components/ui/typing-game.module.css";
import TypingProgress from "@/components/ui/typing-progress";
import useTypingGame, { PhaseType } from "react-typing-game-hook";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";
import { addTypingSession } from "@/lib/typing-analytics";
import {
  VirtualKeyboard,
  StatsPanel,
  TypingController,
  VirtualHands,
} from "@/components/ui/typing/core";
import { LessonSelector } from "@/components/ui/typing/lessons";
import { TypingSettingsPanel } from "@/components/ui/typing/settings";
import { useKeySound } from "@/hooks/useKeySound";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  startSession,
  recordKeystroke,
  setSessionElapsed,
  endSession as endSessionAction,
  resetSession,
  updateCursor,
  completeLesson,
  selectLesson,
} from "@/store/slices";
import type { SessionSummary, LessonContent } from "@/types";
import Link from "next/link";
import { extractLessonText } from "@/lib/lesson-utils";

// ------------------------------------------------------------------
// Constants used for the UI guides and milestones
const KEY_GUIDES = [
  {
    id: "posture",
    title: "准备姿势",
    keys: ["坐姿", "视线"],
    finger: "放松肩膀",
    description: "坐直、手腕微抬，双眼看屏幕而非键盘。",
  },
  {
    id: "home-jf",
    title: "基准键 J · F",
    keys: ["J", "F"],
    finger: "双食指",
    description: "轻触凸点，随时回到这两个起点。",
  },
  {
    id: "home-kd",
    title: "延伸键 K · D",
    keys: ["K", "D"],
    finger: "外伸食指",
    description: "向上或向下后迅速回到 J/F。",
  },
  {
    id: "home-ls",
    title: "延伸键 L · S",
    keys: ["L", "S"],
    finger: "双中指",
    description: "保持节奏，避免手腕晃动。",
  },
  {
    id: "home-a;",
    title: "延伸键 A · ;",
    keys: ["A", ";"],
    finger: "双无名指",
    description: "指尖触底即可，不要压紧。",
  },
  {
    id: "shift-enter",
    title: "Shift · Enter",
    keys: ["Shift", "Enter"],
    finger: "双小指",
    description: "左手 Shift 配右手字母，换行用右手 Enter。",
  },
  {
    id: "top-row",
    title: "上排字母",
    keys: ["R", "T", "Y", "U"],
    finger: "向上延伸",
    description: "移动来自手指而非手臂。",
  },
  {
    id: "numbers",
    title: "数字行",
    keys: ["1", "2", "3", "4"],
    finger: "稳住手腕",
    description: "手指抬高后落下，仍要回到基准键。",
  },
  {
    id: "symbols",
    title: "符号搭配",
    keys: [",", ".", "/"],
    finger: "协调小指",
    description: "保持节奏，避免看键盘。",
  },
];

const SKILL_MILESTONES = [
  { id: "beginner", label: "初学者", requirement: "稳定掌握 J · F", starsNeeded: 1 },
  { id: "explorer", label: "进阶", requirement: "熟悉 KD / LS", starsNeeded: 3 },
  { id: "advanced", label: "高手", requirement: "4 ⭐ 即可进入下一阶段", starsNeeded: 4 },
  { id: "master", label: "大师", requirement: "满 5 ⭐ 全键盲打", starsNeeded: 5 },
];

const DEFAULT_FALLBACK_TEXT = "The quick brown fox jumps over the lazy dog.";

function calculateStarRating(wpm: number, accuracy: number) {
  if (wpm === 0) return 0;
  let stars = 1;
  if (wpm >= 20 && accuracy >= 80) stars = 2;
  if (wpm >= 35 && accuracy >= 88) stars = 3;
  if (wpm >= 45 && accuracy >= 92) stars = 4;
  if (wpm >= 60 && accuracy >= 95) stars = 5;
  return stars;
}

const formatDuration = (ms: number) => {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

interface TypingGameProps {
  onPlayingChange?: (isPlaying: boolean) => void;
  onStatsUpdate?: (stats: {
    wpm: number;
    accuracy: number;
    correctChars: number;
    errorChars: number;
    highScore?: number;
    durationMs: number;
    stars: number;
    isCompleted: boolean;
  }) => void;
  /** Override the lesson text – used for special modes */
  overrideLessonText?: string;
  mode?: string; // "book" or undefined
}

export function TypingGame({
  onPlayingChange,
  onStatsUpdate,
  overrideLessonText,
  mode,
}: TypingGameProps) {
  const dispatch = useAppDispatch();
  const { selectedLessonId, tracks, contents, recommendedLessonIds } =
    useAppSelector((state) => state.curriculum);
  const preferences = useAppSelector((state) => state.preferences.value);

  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Resolve the active lesson based on the selectedLessonId
  const activeLesson = useMemo(() => {
    if (!selectedLessonId) return null;
    for (const track of tracks) {
      const lesson = track.lessons.find((l) => l.id === selectedLessonId);
      if (lesson) {
        const content = lesson.contentRef ? contents[lesson.contentRef] : undefined;
        return {
          track: { id: track.id, name: track.name, difficultyIndex: track.difficultyIndex },
          lesson,
          content,
        } as const;
      }
    }
    return null;
  }, [contents, selectedLessonId, tracks]);

  // Determine the text that will be typed
  const lessonText = useMemo(() => {
    if (overrideLessonText) return overrideLessonText;
    const txt = activeLesson?.content ? extractLessonText(activeLesson.content) : "";
    return txt || DEFAULT_FALLBACK_TEXT;
  }, [overrideLessonText, activeLesson]);

  const lessonTitle = activeLesson?.lesson.title ?? "自由练习";
  const lessonId = activeLesson?.lesson.id ?? "custom-lesson";
  const audioPrefs = preferences.audio;
  const layoutPrefs = preferences.layout;

  // Hook from react-typing-game-hook
  const {
    states: { chars, currIndex, correctChar, errorChar, phase, startTime },
    actions: { insertTyping, resetTyping, deleteTyping, getDuration },
  } = useTypingGame(lessonText, {
    skipCurrentWordOnSpace: false,
    pauseOnError: true,
    countErrors: "everytime",
  });

  const prevCorrectRef = useRef(correctChar);
  const prevErrorRef = useRef(errorChar);
  const prevDurationRef = useRef(0);

  const { playKey, playError } = useKeySound({
    enabled: audioPrefs.keySoundEnabled,
    masterVolume: audioPrefs.masterVolume,
    keyVolume: audioPrefs.keySoundVolume,
    presetId: audioPrefs.keySoundProfile,
  });

  // Calculations for stats
  const calculateWPM = useCallback(() => {
    if (!startTime || phase === PhaseType.NotStarted) return 0;
    const duration = getDuration();
    if (duration === 0) return 0;
    const minutes = duration / 60000;
    const words = correctChar / 5;
    return Math.round(words / minutes);
  }, [correctChar, getDuration, phase, startTime]);

  const calculateAccuracy = useCallback(() => {
    const total = correctChar + errorChar;
    if (total === 0) return 100;
    return Math.round((correctChar / total) * 100);
  }, [correctChar, errorChar]);

  const wpm = useMemo(() => calculateWPM(), [calculateWPM]);
  const accuracy = useMemo(() => calculateAccuracy(), [calculateAccuracy]);
  const duration = useMemo(() => getDuration(), [getDuration]);
  const stars = useMemo(() => calculateStarRating(wpm, accuracy), [wpm, accuracy]);

  const keyboardStates = useMemo(() => {
    if (!isPlaying) return {} as Record<string, "hint">;
    const cur = chars[currIndex]?.toLowerCase();
    if (!cur) return {} as Record<string, "hint">;
    return { [cur]: "hint" } as Record<string, "hint">;
  }, [isPlaying, chars, currIndex]);

  // Reset when lesson changes
  useEffect(() => {
    setIsPlaying(false);
    dispatch(resetSession());
    resetTyping();
    prevCorrectRef.current = 0;
    prevErrorRef.current = 0;
    prevDurationRef.current = 0;
  }, [dispatch, lessonText, resetTyping]);

  // End‑of‑game handling
  useEffect(() => {
    if (phase === PhaseType.Ended && isPlaying) {
      const endScore = wpm * 10 + accuracy;
      const totalChars = correctChar + errorChar;
      const summary: SessionSummary = {
        durationMs: duration,
        wpm,
        cpm: duration > 0 ? Math.round((correctChar / duration) * 60000) : 0,
        accuracy,
        errorRate: totalChars > 0 ? errorChar / totalChars : 0,
        starRating: stars,
        streak: 0,
      };
      dispatch(setSessionElapsed(duration));
      dispatch(endSessionAction(summary));
      if (activeLesson?.lesson.id) {
        dispatch(completeLesson({ lessonId: activeLesson.lesson.id, summary }));
        addTypingSession({
          lessonId: activeLesson.lesson.id,
          lessonTitle: activeLesson.lesson.title,
          trackId: activeLesson.track.id,
          trackName: activeLesson.track.name,
          summary,
        });
      }
      if (endScore > highScore) setHighScore(endScore);
      if (gameRecorder) gameRecorder.updateScore(endScore);
      setIsPlaying(false);
      onPlayingChange?.(false);
    }
  }, [
    phase,
    isPlaying,
    gameRecorder,
    highScore,
    correctChar,
    errorChar,
    startTime,
    getDuration,
    wpm,
    accuracy,
    duration,
    stars,
    dispatch,
    activeLesson,
    onPlayingChange,
  ]);

  const startGame = useCallback(() => {
    dispatch(resetSession());
    dispatch(
      startSession({
        lessonId,
        text: lessonText,
        timestamp: Date.now(),
      })
    );
    prevCorrectRef.current = 0;
    prevErrorRef.current = 0;
    prevDurationRef.current = 0;
    resetTyping();
    setIsPlaying(true);
    onPlayingChange?.(true);
    const recorder = integrateGameWithAutoRecorder("Typing Game", "typing-game");
    setGameRecorder(recorder);
  }, [dispatch, lessonId, lessonText, resetTyping, onPlayingChange]);

  const resetGame = useCallback(() => {
    setIsPlaying(false);
    onPlayingChange?.(false);
    resetTyping();
    dispatch(resetSession());
    if (gameRecorder) {
      const finalScore = calculateWPM() * 10 + calculateAccuracy();
      gameRecorder.endGame(finalScore);
    }
  }, [dispatch, resetTyping, gameRecorder, onPlayingChange, calculateWPM, calculateAccuracy]);

  const selectNewText = useCallback(() => {
    const nextLessonId = recommendedLessonIds.find((id) => id !== lessonId) ?? lessonId;
    dispatch(selectLesson({ lessonId: nextLessonId }));
  }, [dispatch, recommendedLessonIds, lessonId]);

  // Auto‑advance when 4+ stars
  useEffect(() => {
    if (phase === PhaseType.Ended && stars >= 4) {
      const timer = setTimeout(() => selectNewText(), 2500);
      return () => clearTimeout(timer);
    }
  }, [phase, stars, selectNewText]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isPlaying) return;
      const key = event.key;
      if (key.length === 1 || key === "Backspace" || key === "Escape") {
        event.preventDefault();
      }
      if (key === "Escape") {
        resetGame();
        return;
      }
      if (key === "Backspace") {
        playKey();
        deleteTyping(false);
        return;
      }
      if (key.length === 1) {
        playKey();
        insertTyping(key);
      }
    },
    [isPlaying, resetGame, deleteTyping, insertTyping, playKey]
  );

  const [isErrorActive, setIsErrorActive] = useState(false);

  // Record keystrokes / errors
  useEffect(() => {
    if (!isPlaying) {
      prevCorrectRef.current = correctChar;
      prevErrorRef.current = errorChar;
      prevDurationRef.current = duration;
      setIsErrorActive(false);
      return;
    }
    const correctDiff = correctChar - prevCorrectRef.current;
    const errorDiff = errorChar - prevErrorRef.current;
    const deltaDuration = Math.max(0, duration - prevDurationRef.current);
    if (correctDiff > 0) {
      dispatch(recordKeystroke({ isCorrect: true, count: correctDiff }));
    }
    if (errorDiff > 0) {
      dispatch(recordKeystroke({ isCorrect: false, count: errorDiff }));
      playError();
      setIsErrorActive(true);
      const timer = setTimeout(() => setIsErrorActive(false), 300);
      return () => clearTimeout(timer);
    }
    if (deltaDuration > 0) {
      dispatch(setSessionElapsed(duration));
    }
    dispatch(updateCursor(currIndex));
    prevCorrectRef.current = correctChar;
    prevErrorRef.current = errorChar;
    prevDurationRef.current = duration;
  }, [
    isPlaying,
    correctChar,
    errorChar,
    duration,
    currIndex,
    dispatch,
    playError,
  ]);

  // Propagate stats to parent component
  useEffect(() => {
    if (!onStatsUpdate) return;
    onStatsUpdate({
      wpm,
      accuracy,
      correctChars: correctChar,
      errorChars: errorChar,
      highScore,
      durationMs: duration,
      stars,
      isCompleted: phase === PhaseType.Ended,
    });
  }, [wpm, accuracy, correctChar, errorChar, highScore, duration, stars, phase, onStatsUpdate]);

  // Render
  return (
    <div className={mode === "book" ? styles.bookMode : undefined}>
      <TypingSettingsPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <div className={styles.container}>
        {mode !== "book" && (
          <TypingProgress progress={chars.length ? (currIndex / chars.length) * 100 : 0} />
        )}
        <div className="space-y-6">
          {/* Header */}
          {mode !== "book" && (
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-between">
              <div className="text-center space-y-2 md:text-left">
                <h2 className="text-4xl font-bold text-gray-900">⌨️ Typing Game</h2>
                <p className="text-gray-600 text-base">
                  从基准键开始，逐步覆盖整块键盘。
                </p>
                <p className="text-sm text-gray-500">当前课程：{lessonTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  ⚙️ 设置
                </Button>
                <Button asChild variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Link href="/typing-analytics">统计</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  onClick={selectNewText}
                >
                  下一推荐
                </Button>
              </div>
            </div>
          )}

          {/* Lesson selector */}
          {mode !== "book" && <LessonSelector />}

          {/* Lesson Guide */}
          {mode !== "book" && (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 p-6 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">入门引导小方块</h3>
                  <p className="text-sm text-white/60">
                    先练一对按键，再向上、向下扩展；影子手指帮助你对齐键位。
                  </p>
                </div>
              </div>
              <div className="absolute -top-10 -right-6 hidden lg:block text-white/10 text-[140px] leading-none select-none pointer-events-none">
                🖐️
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {KEY_GUIDES.map((guide) => (
                  <div
                    key={guide.id}
                    className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-white/60 uppercase tracking-wide">
                      <span className="font-semibold text-white/90">{guide.title}</span>
                      <span>{guide.finger}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {guide.keys.map((key) => (
                        <span
                          key={key}
                          className="inline-flex min-w-[42px] items-center justify-center rounded-md bg-white/15 px-2 py-1 text-sm font-semibold text-white/90"
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-white/70 leading-relaxed">{guide.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {SKILL_MILESTONES.map((milestone) => {
                  const unlocked = stars >= milestone.starsNeeded && stars > 0;
                  return (
                    <div
                      key={milestone.id}
                      className={`flex items-start gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                        unlocked
                          ? "border-yellow-300/60 bg-yellow-400/10 text-yellow-200"
                          : "border-white/15 bg-white/5 text-white/60"
                      }`}
                    >
                      <span>{milestone.label}</span>
                      <span className="text-white/40">·</span>
                      <span className="max-w-[120px] leading-relaxed">{milestone.requirement}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stats */}
          {mode !== "book" && (
            <StatsPanel
              wpm={wpm}
              accuracy={accuracy}
              correct={correctChar}
              mistakes={errorChar}
              elapsedMs={duration}
              stars={stars}
            />
          )}

          {/* Typing Area */}
          <TypingController enabled={isPlaying} onKeyDown={handleKeyDown}>
            <div
              className={`relative min-h-[220px] rounded-lg p-6 transition-colors shadow-inner ${
                mode === "book"
                  ? "bg-[#fdf6e3] border border-[#e6dcc3]"
                  : "bg-gray-50 border border-gray-200 focus-within:border-blue-400"
              }`}
              onClick={!isPlaying ? startGame : undefined}
            >
              {!isPlaying ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-black/5 backdrop-blur-[2px] cursor-pointer hover:bg-black/10 transition-colors">
                  <div className="rounded-full bg-white p-4 shadow-lg">
                    <span className="text-4xl">▶️</span>
                  </div>
                  <p className="text-lg font-medium text-gray-600">点击开始练习</p>
                  {mode === "book" && (
                    <p className="text-sm text-[#5f4b32]/80 font-serif italic">&quot;阅读是另一种呼吸&quot;</p>
                  )}
                </div>
              ) : (
                <div className={styles.lesson}>
                  {chars.split("").map((char, i) => {
                    let cls = styles.char;
                    if (i < currIndex) cls += ` ${styles.correct}`;
                    else if (i === currIndex) {
                      cls += ` ${styles.current}`;
                      if (isErrorActive) cls += ` ${styles.currentError}`;
                    }
                    return (
                      <span key={i} className={cls}>
                        {char}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </TypingController>

          {/* Virtual keyboard & hands – hidden in book mode */}
          {mode !== "book" && (
            <>
              <VirtualKeyboard keyStates={keyboardStates} />
              <VirtualHands
                currentChar={chars[currIndex]}
                visible={layoutPrefs.showVirtualHands}
                transparency={layoutPrefs.handTransparency}
                theme={layoutPrefs.virtualHandTheme}
              />
            </>
          )}

          {/* Instructions */}
          {isPlaying && phase === PhaseType.Started && mode !== "book" && (
            <div className="text-center text-white/60 text-sm">
              <p>
                保持节奏：遇到错误按 <span className="rounded bg-white/10 px-1">Backspace</span>，需要暂停按 <span className="rounded bg-white/10 px-1">ESC</span>。
              </p>
            </div>
          )}

          {/* Game Over */}
          {phase === PhaseType.Ended && mode !== "book" && (
            <div className="text-center space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-900 p-6 text-white backdrop-blur-sm">
                <div className="mb-3 flex justify-center gap-1 text-3xl">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={i < stars ? "text-yellow-300 drop-shadow" : "text-white/15"}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl font-bold text-white">本轮结果</h3>
                <p className="mt-2 text-sm text-white/80">
                  WPM: {wpm} · 准确率: {accuracy}% · 用时: {formatDuration(duration)}
                </p>
                <p className="mt-1 text-sm text-white/60">总分：{wpm * 10 + accuracy}</p>
                {stars >= 4 ? (
                  <p className="mt-3 text-sm text-green-300">
                    🎉 获得 4 颗星，可以继续前往下一阶段的练习！
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-white/50">
                    凑够 4 颗星即可解锁进阶模块，加油！
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          {mode !== "book" && (
            <div className="flex gap-4 justify-center">
              {isPlaying && (
                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="text-gray-700 border-gray-300 hover:bg-gray-100"
                >
                  结束本轮
                </Button>
              )}
            </div>
          )}

          {/* High Score */}
          {highScore > 0 && mode !== "book" && (
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                最高分：<span className="text-yellow-600 font-bold">{highScore}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Helper moved to @/lib/lesson-utils.ts
