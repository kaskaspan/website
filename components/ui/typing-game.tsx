"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import useTypingGame, {
  CharStateType,
  PhaseType,
} from "react-typing-game-hook";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const TYPING_TEXTS = [
  "The quick brown fox jumps over the lazy dog.",
  "Programming is the art of telling a computer what to do through a series of instructions.",
  "Practice makes perfect when it comes to typing speed and accuracy.",
  "The best way to learn coding is by building projects and solving real problems.",
  "React is a powerful library for building user interfaces with reusable components.",
  "TypeScript provides type safety and better developer experience for JavaScript projects.",
  "Web development combines creativity with technical skills to create amazing experiences.",
  "The journey of a thousand miles begins with a single step.",
  "Innovation distinguishes between a leader and a follower.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
];

interface TypingGameProps {
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function TypingGame({ onPlayingChange }: TypingGameProps) {
  const [textIndex, setTextIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  const currentText = TYPING_TEXTS[textIndex];

  const {
    states: {
      chars,
      charsState,
      currIndex,
      correctChar,
      errorChar,
      phase,
      startTime,
      endTime,
    },
    actions: { insertTyping, resetTyping, deleteTyping, getDuration },
  } = useTypingGame(currentText, {
    skipCurrentWordOnSpace: true,
    pauseOnError: false,
    countErrors: "everytime",
  });

  // 计算 WPM (Words Per Minute)
  const calculateWPM = () => {
    if (!startTime || phase === PhaseType.NotStarted) return 0;
    const duration = getDuration();
    if (duration === 0) return 0;
    const minutes = duration / 60000;
    const words = correctChar / 5; // 平均每个单词5个字符
    return Math.round(words / minutes);
  };

  // 计算准确率
  const calculateAccuracy = () => {
    const totalChars = correctChar + errorChar;
    if (totalChars === 0) return 100;
    return Math.round((correctChar / totalChars) * 100);
  };

  // 开始游戏
  const startGame = () => {
    resetTyping();
    setIsPlaying(true);
    onPlayingChange?.(true);
    const recorder = integrateGameWithAutoRecorder(
      "Typing Game",
      "typing-game"
    );
    setGameRecorder(recorder);
  };

  // 重置游戏
  const resetGame = () => {
    setIsPlaying(false);
    onPlayingChange?.(false);
    resetTyping();
    if (gameRecorder) {
      const finalScore = calculateWPM() * 10 + calculateAccuracy();
      gameRecorder.endGame(finalScore);
    }
  };

  // 选择新文本
  const selectNewText = () => {
    const newIndex = Math.floor(Math.random() * TYPING_TEXTS.length);
    setTextIndex(newIndex);
    resetTyping();
  };

  // 检查游戏是否完成
  useEffect(() => {
    if (phase === PhaseType.Ended && isPlaying) {
      const wpm = calculateWPM();
      const acc = calculateAccuracy();
      const finalScore = wpm * 10 + acc;
      if (gameRecorder) {
        gameRecorder.updateScore(finalScore);
        if (finalScore > highScore) {
          setHighScore(finalScore);
        }
      }
      // 游戏完成后恢复光标
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
    onPlayingChange,
  ]);

  // 键盘事件处理
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key;

      if (key === "Escape") {
        resetGame();
        return;
      }

      if (key === "Backspace") {
        deleteTyping(false);
        return;
      }

      if (key.length === 1) {
        insertTyping(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, insertTyping, deleteTyping, resetGame]);

  const wpm = calculateWPM();
  const accuracy = calculateAccuracy();
  const duration = getDuration();

  return (
    <Card className="w-full max-w-4xl mx-auto p-8 bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-2">⌨️ Typing Game</h2>
          <p className="text-white/70">Test your typing speed and accuracy!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{wpm}</div>
            <div className="text-sm text-white/70">WPM</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
            <div className="text-sm text-white/70">Accuracy</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {correctChar}
            </div>
            <div className="text-sm text-white/70">Correct</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{errorChar}</div>
            <div className="text-sm text-white/70">Errors</div>
          </div>
        </div>

        {/* Typing Area */}
        <div
          className="bg-black/30 rounded-lg p-6 min-h-[200px] border border-white/10 focus-within:border-purple-400/50 transition-colors"
          tabIndex={0}
        >
          {!isPlaying ? (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg mb-4">
                Click &quot;Start Game&quot; to begin typing!
              </p>
              <Button
                onClick={startGame}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                Start Game
              </Button>
            </div>
          ) : (
            <div className="text-xl leading-relaxed font-mono">
              {chars.split("").map((char, index) => {
                const state = charsState[index];
                const color =
                  state === CharStateType.Incomplete
                    ? "text-white/50"
                    : state === CharStateType.Correct
                    ? "text-green-400"
                    : "text-red-400 bg-red-400/20";

                // 高亮当前字符
                const isCurrentChar = index === currIndex;
                const bgColor =
                  isCurrentChar && phase === PhaseType.Started
                    ? "bg-purple-500/30"
                    : "";

                return (
                  <span
                    key={char + index}
                    className={`${color} ${bgColor} ${
                      isCurrentChar ? "animate-pulse" : ""
                    }`}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Instructions */}
        {isPlaying && phase === PhaseType.Started && (
          <div className="text-center text-white/60 text-sm">
            <p>Type the text above. Press ESC to reset.</p>
          </div>
        )}

        {/* Game Over */}
        {phase === PhaseType.Ended && isPlaying && (
          <div className="text-center space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-green-400 mb-2">
                Game Complete! 🎉
              </h3>
              <p className="text-white/90">
                Your final score: {wpm * 10 + accuracy} points
              </p>
              <p className="text-white/70 text-sm mt-2">
                WPM: {wpm} | Accuracy: {accuracy}%
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          {isPlaying && (
            <Button
              onClick={resetGame}
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10"
            >
              Reset Game
            </Button>
          )}
          {!isPlaying && (
            <Button
              onClick={selectNewText}
              variant="outline"
              className="text-white border-white/30 hover:bg-white/10"
            >
              New Text
            </Button>
          )}
        </div>

        {/* High Score */}
        {highScore > 0 && (
          <div className="text-center">
            <p className="text-white/70 text-sm">
              High Score:{" "}
              <span className="text-yellow-400 font-bold">{highScore}</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
