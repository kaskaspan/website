"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const TRACK_HEIGHT = 400;
const TRACK_WIDTH = 300;
const NOTE_WIDTH = 60;
const NOTE_HEIGHT = 20;
const TRACK_SPEED = 3;
const PERFECT_ZONE = 20;
const GOOD_ZONE = 40;

interface Note {
  id: number;
  lane: number;
  y: number;
  type: "tap" | "hold";
  duration?: number;
  isActive?: boolean;
}

interface GameState {
  notes: Note[];
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  good: number;
  miss: number;
  gameOver: boolean;
  isPaused: boolean;
  level: number;
  timeElapsed: number;
}

const LANES = 4;
const NOTE_SPAWN_RATE = 0.02;

export function RhythmGame() {
  const [gameState, setGameState] = useState<GameState>({
    notes: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    good: 0,
    miss: 0,
    gameOver: false,
    isPaused: false,
    level: 1,
    timeElapsed: 0,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 生成音符
  const generateNote = useCallback((): Note => {
    const lane = Math.floor(Math.random() * LANES);
    const type = Math.random() < 0.8 ? "tap" : "hold";

    return {
      id: Date.now() + Math.random(),
      lane,
      y: -NOTE_HEIGHT,
      type,
      duration: type === "hold" ? 100 : undefined,
      isActive: false,
    };
  }, []);

  // 检查音符命中
  const checkHit = useCallback(
    (
      lane: number,
      notes: Note[]
    ): { note: Note | null; accuracy: "perfect" | "good" | "miss" } => {
      const hitZone = TRACK_HEIGHT - 50;

      for (const note of notes) {
        if (note.lane === lane && !note.isActive) {
          const distance = Math.abs(note.y - hitZone);

          if (distance <= PERFECT_ZONE) {
            return { note, accuracy: "perfect" };
          } else if (distance <= GOOD_ZONE) {
            return { note, accuracy: "good" };
          }
        }
      }

      return { note: null, accuracy: "miss" };
    },
    []
  );

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        // 移动音符
        const newNotes = prev.notes
          .map((note) => ({
            ...note,
            y: note.y + TRACK_SPEED,
          }))
          .filter((note) => note.y < TRACK_HEIGHT + 100);

        // 生成新音符
        const shouldSpawnNote = Math.random() < NOTE_SPAWN_RATE;
        if (shouldSpawnNote) {
          newNotes.push(generateNote());
        }

        // 检查错过的音符
        const missedNotes = newNotes.filter(
          (note) => note.y > TRACK_HEIGHT + 50 && !note.isActive
        );

        const newScore = prev.score;
        let newCombo = prev.combo;
        let newMiss = prev.miss;
        const newMaxCombo = prev.maxCombo;

        // 处理错过的音符
        if (missedNotes.length > 0) {
          newCombo = 0;
          newMiss += missedNotes.length;
        }

        // 更新自动记录器
        if (gameRecorder) {
          gameRecorder.updateScore(newScore);
        }

        return {
          ...prev,
          notes: newNotes,
          score: newScore,
          combo: newCombo,
          miss: newMiss,
          maxCombo: newMaxCombo,
          timeElapsed: prev.timeElapsed + 16,
        };
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    generateNote,
    gameRecorder,
  ]);

  // 处理按键
  const handleKeyPress = useCallback(
    (lane: number) => {
      if (gameState.gameOver || gameState.isPaused) return;

      setGameState((prev) => {
        const { note, accuracy } = checkHit(lane, prev.notes);
        let newScore = prev.score;
        let newCombo = prev.combo;
        let newPerfect = prev.perfect;
        let newGood = prev.good;
        let newMiss = prev.miss;
        let newMaxCombo = prev.maxCombo;

        if (note) {
          // 命中音符
          const newNotes = prev.notes.map((n) =>
            n.id === note.id ? { ...n, isActive: true } : n
          );

          switch (accuracy) {
            case "perfect":
              newScore += 100 * (1 + newCombo * 0.1);
              newCombo += 1;
              newPerfect += 1;
              break;
            case "good":
              newScore += 50 * (1 + newCombo * 0.05);
              newCombo += 1;
              newGood += 1;
              break;
          }

          newMaxCombo = Math.max(newMaxCombo, newCombo);

          // 更新自动记录器
          if (gameRecorder) {
            gameRecorder.updateScore(newScore);
          }

          return {
            ...prev,
            notes: newNotes,
            score: newScore,
            combo: newCombo,
            perfect: newPerfect,
            good: newGood,
            maxCombo: newMaxCombo,
          };
        } else {
          // 未命中
          newCombo = 0;
          newMiss += 1;
        }

        return {
          ...prev,
          score: newScore,
          combo: newCombo,
          miss: newMiss,
          maxCombo: newMaxCombo,
        };
      });
    },
    [gameState.gameOver, gameState.isPaused, checkHit, gameRecorder]
  );

  // 键盘控制
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.toLowerCase();
      setKeys((prev) => new Set(prev).add(key));

      switch (key) {
        case "a":
        case "1":
          handleKeyPress(0);
          break;
        case "s":
        case "2":
          handleKeyPress(1);
          break;
        case "d":
        case "3":
          handleKeyPress(2);
          break;
        case "f":
        case "4":
          handleKeyPress(3);
          break;
        case "p":
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeys((prev) => {
        const newKeys = new Set(prev);
        newKeys.delete(key);
        return newKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPlaying, handleKeyPress]);

  const startGame = () => {
    setGameState({
      notes: [],
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfect: 0,
      good: 0,
      miss: 0,
      gameOver: false,
      isPaused: false,
      level: 1,
      timeElapsed: 0,
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Rhythm Game",
      "rhythm-game"
    );
    setGameRecorder(recorder);
  };

  const resetGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
  };

  // 渲染音符
  const renderNotes = () => {
    return gameState.notes.map((note) => (
      <div
        key={note.id}
        className={`absolute w-14 h-5 rounded ${
          note.type === "tap" ? "bg-blue-500" : "bg-purple-500"
        } ${note.isActive ? "opacity-50" : ""}`}
        style={{
          left: note.lane * (TRACK_WIDTH / LANES) + 10,
          top: note.y,
        }}
      />
    ));
  };

  // 渲染命中区域
  const renderHitZones = () => {
    return Array.from({ length: LANES }, (_, i) => (
      <div
        key={i}
        className="absolute w-14 h-5 border-2 border-yellow-400 bg-yellow-400/20"
        style={{
          left: i * (TRACK_WIDTH / LANES) + 10,
          top: TRACK_HEIGHT - 50,
        }}
      />
    ));
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🎵 Rhythm Game</h2>
          <p className="text-white/70">
            Hit the notes as they reach the bottom! Use A, S, D, F keys.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Combo: {gameState.combo}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Perfect: {gameState.perfect}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Good: {gameState.good}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Miss: {gameState.miss}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Max Combo: {gameState.maxCombo}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">High Score: {highScore}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Time: {Math.floor(gameState.timeElapsed / 1000)}s
            </div>
          </div>
        </div>

        {/* 游戏区域 */}
        <div
          className="relative mx-auto mb-6 bg-black/50 rounded-lg overflow-hidden"
          style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
        >
          {/* 车道线 */}
          {Array.from({ length: LANES - 1 }, (_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-full bg-white/30"
              style={{ left: (i + 1) * (TRACK_WIDTH / LANES) }}
            />
          ))}

          {/* 命中区域 */}
          {renderHitZones()}

          {/* 音符 */}
          {renderNotes()}
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              🎵 Game Over!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">Max Combo: {gameState.maxCombo}</p>
            <p className="text-white/70">
              Accuracy:{" "}
              {Math.round(
                ((gameState.perfect + gameState.good) /
                  (gameState.perfect + gameState.good + gameState.miss)) *
                  100
              )}
              %
            </p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          {!isPlaying ? (
            <Button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Start Game
            </Button>
          ) : (
            <>
              <Button
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    isPaused: !prev.isPaused,
                  }))
                }
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {gameState.isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                onClick={resetGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reset
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-white/70 text-sm">
          <p>🎮 Use A, S, D, F keys to hit notes</p>
          <p>⏸️ Press P to pause</p>
          <p>🎯 Hit notes when they reach the yellow zone</p>
          <p>🔥 Build combos for higher scores</p>
          <p>💙 Blue notes: Tap | 💜 Purple notes: Hold</p>
        </div>
      </Card>
    </div>
  );
}
