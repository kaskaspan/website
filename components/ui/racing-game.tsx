"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const TRACK_WIDTH = 300;
const TRACK_HEIGHT = 600;
const CAR_WIDTH = 20;
const CAR_HEIGHT = 30;
const ROAD_WIDTH = 200;
const LANE_WIDTH = 50;

interface Car {
  id: number;
  x: number;
  y: number;
  speed: number;
  lane: number;
  color: string;
}

interface GameState {
  playerX: number;
  playerY: number;
  playerLane: number;
  cars: Car[];
  score: number;
  speed: number;
  gameOver: boolean;
  isPaused: boolean;
  distance: number;
  level: number;
}

const DIFFICULTY_LEVELS = {
  easy: { carSpeed: 2, spawnRate: 0.02, lanes: 3 },
  medium: { carSpeed: 3, spawnRate: 0.03, lanes: 4 },
  hard: { carSpeed: 4, spawnRate: 0.04, lanes: 5 },
};

export function RacingGame() {
  const [gameState, setGameState] = useState<GameState>({
    playerX: TRACK_WIDTH / 2,
    playerY: TRACK_HEIGHT - 60,
    playerLane: 2,
    cars: [],
    score: 0,
    speed: 2,
    gameOver: false,
    isPaused: false,
    distance: 0,
    level: 1,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] =
    useState<keyof typeof DIFFICULTY_LEVELS>("medium");
  const [highScore, setHighScore] = useState(0);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 生成随机车辆
  const generateCar = useCallback((): Car => {
    const lanes = DIFFICULTY_LEVELS[difficulty].lanes;
    const lane = Math.floor(Math.random() * lanes);
    const x = 50 + lane * LANE_WIDTH + LANE_WIDTH / 2;

    const colors = ["red", "blue", "green", "yellow", "purple", "orange"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: Date.now() + Math.random(),
      x,
      y: -30,
      speed: DIFFICULTY_LEVELS[difficulty].carSpeed + Math.random() * 2,
      lane,
      color,
    };
  }, [difficulty]);

  // 检查碰撞
  const checkCollision = useCallback(
    (playerX: number, playerY: number, cars: Car[]): boolean => {
      return cars.some(
        (car) =>
          Math.abs(car.x - playerX) < 25 && Math.abs(car.y - playerY) < 25
      );
    },
    []
  );

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState((prevState) => {
        // 移动玩家
        let newPlayerX = prevState.playerX;
        let newPlayerLane = prevState.playerLane;

        if (keys.has("ArrowLeft") || keys.has("a")) {
          newPlayerLane = Math.max(0, newPlayerLane - 1);
          newPlayerX = 50 + newPlayerLane * LANE_WIDTH + LANE_WIDTH / 2;
        }
        if (keys.has("ArrowRight") || keys.has("d")) {
          const maxLane = DIFFICULTY_LEVELS[difficulty].lanes - 1;
          newPlayerLane = Math.min(maxLane, newPlayerLane + 1);
          newPlayerX = 50 + newPlayerLane * LANE_WIDTH + LANE_WIDTH / 2;
        }

        // 移动车辆
        const newCars = prevState.cars
          .map((car) => ({
            ...car,
            y: car.y + car.speed,
          }))
          .filter((car) => car.y < TRACK_HEIGHT + 50);

        // 生成新车辆
        const shouldSpawnCar =
          Math.random() < DIFFICULTY_LEVELS[difficulty].spawnRate;
        if (shouldSpawnCar) {
          newCars.push(generateCar());
        }

        // 检查碰撞
        const collision = checkCollision(
          newPlayerX,
          prevState.playerY,
          newCars
        );

        // 更新分数和距离
        const newDistance = prevState.distance + 1;
        const newScore = prevState.score + 1;
        const newLevel = Math.floor(newDistance / 1000) + 1;

        // 更新自动记录器
        if (gameRecorder && !collision) {
          gameRecorder.updateScore(newScore);
        }

        return {
          ...prevState,
          playerX: newPlayerX,
          playerLane: newPlayerLane,
          cars: newCars,
          score: newScore,
          distance: newDistance,
          level: newLevel,
          gameOver: collision,
        };
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    difficulty,
    keys,
    generateCar,
    checkCollision,
    gameRecorder,
  ]);

  // 键盘控制
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.toLowerCase();
      setKeys((prev) => new Set(prev).add(key));

      if (key === "p") {
        setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
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
  }, [isPlaying]);

  const startGame = () => {
    setGameState({
      playerX: TRACK_WIDTH / 2,
      playerY: TRACK_HEIGHT - 60,
      playerLane: 2,
      cars: [],
      score: 0,
      speed: 2,
      gameOver: false,
      isPaused: false,
      distance: 0,
      level: 1,
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Racing Game",
      "racing-game"
    );
    setGameRecorder(recorder);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState({
      playerX: TRACK_WIDTH / 2,
      playerY: TRACK_HEIGHT - 60,
      playerLane: 2,
      cars: [],
      score: 0,
      speed: 2,
      gameOver: false,
      isPaused: false,
      distance: 0,
      level: 1,
    });
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🏎️ Racing Game</h2>
          <p className="text-white/70">
            Use A/D or Arrow keys to change lanes, avoid other cars!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Distance: {gameState.distance}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Level: {gameState.level}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">High Score: {highScore}</div>
          </div>
        </div>

        <div
          className="relative mx-auto mb-6"
          style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
        >
          {/* 道路背景 */}
          <div
            className="absolute bg-gray-700 border-2 border-yellow-400"
            style={{
              left: 50,
              top: 0,
              width: ROAD_WIDTH,
              height: TRACK_HEIGHT,
            }}
          >
            {/* 车道线 */}
            {Array.from(
              { length: DIFFICULTY_LEVELS[difficulty].lanes - 1 },
              (_, i) => (
                <div
                  key={i}
                  className="absolute bg-yellow-400"
                  style={{
                    left: LANE_WIDTH * (i + 1) - 1,
                    top: 0,
                    width: 2,
                    height: TRACK_HEIGHT,
                  }}
                />
              )
            )}
          </div>

          {/* 玩家车辆 */}
          <div
            className="absolute bg-blue-500 border-2 border-white rounded"
            style={{
              left: gameState.playerX - CAR_WIDTH / 2,
              top: gameState.playerY - CAR_HEIGHT / 2,
              width: CAR_WIDTH,
              height: CAR_HEIGHT,
            }}
          >
            <div className="w-full h-full bg-blue-400 rounded flex items-center justify-center text-white font-bold text-xs">
              🚗
            </div>
          </div>

          {/* 其他车辆 */}
          {gameState.cars.map((car) => (
            <div
              key={car.id}
              className="absolute border-2 border-white rounded"
              style={{
                left: car.x - CAR_WIDTH / 2,
                top: car.y - CAR_HEIGHT / 2,
                width: CAR_WIDTH,
                height: CAR_HEIGHT,
                backgroundColor: car.color,
              }}
            >
              <div className="w-full h-full rounded flex items-center justify-center text-white font-bold text-xs">
                🚙
              </div>
            </div>
          ))}
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">💥 Crash!</p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">Distance: {gameState.distance}</p>
            <p className="text-white/70">Level Reached: {gameState.level}</p>
          </div>
        )}

        {!isPlaying && !gameState.gameOver && (
          <div className="mb-4">
            <div className="text-white text-center mb-2">
              Select Difficulty:
            </div>
            <div className="flex justify-center space-x-2">
              {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                <Button
                  key={key}
                  onClick={() =>
                    setDifficulty(key as keyof typeof DIFFICULTY_LEVELS)
                  }
                  className={`px-3 py-1 text-sm ${
                    difficulty === key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-white hover:bg-gray-500"
                  }`}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              ))}
            </div>
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
          <p>🎮 Controls: A/D or Arrow keys to change lanes</p>
          <p>⏸️ Press P to pause</p>
          <p>🏁 Avoid other cars to survive!</p>
          <p>📈 Higher levels = faster cars</p>
        </div>
      </Card>
    </div>
  );
}
