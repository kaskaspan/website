"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 300;
const FROG_SIZE = 20;
const LANE_HEIGHT = 30;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 20;
const LOG_WIDTH = 60;
const LOG_HEIGHT = 20;

interface Position {
  x: number;
  y: number;
}

interface Vehicle {
  id: number;
  position: Position;
  speed: number;
  direction: "left" | "right";
  type: "car" | "truck";
  color: string;
}

interface Log {
  id: number;
  position: Position;
  speed: number;
  direction: "left" | "right";
  length: number;
}

interface GameState {
  frog: Position;
  vehicles: Vehicle[];
  logs: Log[];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  isWon: boolean;
  isPaused: boolean;
  timeLeft: number;
}

const LANES = [
  { type: "road", direction: "right", speed: 1, vehicleType: "car" },
  { type: "road", direction: "left", speed: 1.5, vehicleType: "truck" },
  { type: "road", direction: "right", speed: 2, vehicleType: "car" },
  { type: "water", direction: "left", speed: 0.8, logType: "short" },
  { type: "water", direction: "right", speed: 1.2, logType: "long" },
  { type: "water", direction: "left", speed: 1, logType: "short" },
  { type: "safe", direction: "none", speed: 0, surface: "grass" },
];

const VEHICLE_COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

export function FroggerGame() {
  const [gameState, setGameState] = useState<GameState>({
    frog: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30 },
    vehicles: [],
    logs: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    isWon: false,
    isPaused: false,
    timeLeft: 60,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 生成车辆
  const generateVehicle = useCallback((lane: number): Vehicle => {
    const laneConfig = LANES[lane];
    const direction = laneConfig.direction as "left" | "right";
    const startX = direction === "right" ? -CAR_WIDTH : GAME_WIDTH;

    return {
      id: Date.now() + Math.random(),
      position: { x: startX, y: lane * LANE_HEIGHT + LANE_HEIGHT / 2 },
      speed: laneConfig.speed,
      direction,
      type: laneConfig.vehicleType as "car" | "truck",
      color: VEHICLE_COLORS[Math.floor(Math.random() * VEHICLE_COLORS.length)],
    };
  }, []);

  // 生成木头
  const generateLog = useCallback((lane: number): Log => {
    const laneConfig = LANES[lane];
    const direction = laneConfig.direction as "left" | "right";
    const startX = direction === "right" ? -LOG_WIDTH : GAME_WIDTH;
    const length = laneConfig.logType === "long" ? 2 : 1;

    return {
      id: Date.now() + Math.random(),
      position: { x: startX, y: lane * LANE_HEIGHT + LANE_HEIGHT / 2 },
      speed: laneConfig.speed,
      direction,
      length,
    };
  }, []);

  // 检查碰撞
  const checkCollision = useCallback(
    (
      pos1: Position,
      pos2: Position,
      width1: number,
      height1: number,
      width2: number,
      height2: number
    ): boolean => {
      return (
        pos1.x < pos2.x + width2 &&
        pos1.x + width1 > pos2.x &&
        pos1.y < pos2.y + height2 &&
        pos1.y + height1 > pos2.y
      );
    },
    []
  );

  // 移动青蛙
  const moveFrog = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      setGameState((prev) => {
        if (prev.gameOver || prev.isPaused) return prev;

        let newX = prev.frog.x;
        let newY = prev.frog.y;

        switch (direction) {
          case "up":
            newY = Math.max(0, prev.frog.y - LANE_HEIGHT);
            break;
          case "down":
            newY = Math.min(GAME_HEIGHT - FROG_SIZE, prev.frog.y + LANE_HEIGHT);
            break;
          case "left":
            newX = Math.max(0, prev.frog.x - LANE_HEIGHT);
            break;
          case "right":
            newX = Math.min(GAME_WIDTH - FROG_SIZE, prev.frog.x + LANE_HEIGHT);
            break;
        }

        // 检查边界
        if (
          newX < 0 ||
          newX > GAME_WIDTH - FROG_SIZE ||
          newY < 0 ||
          newY > GAME_HEIGHT - FROG_SIZE
        ) {
          return prev;
        }

        return {
          ...prev,
          frog: { x: newX, y: newY },
        };
      });
    },
    []
  );

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        // 移动车辆
        const newVehicles = prev.vehicles
          .map((vehicle) => ({
            ...vehicle,
            position: {
              x:
                vehicle.position.x +
                (vehicle.direction === "right"
                  ? vehicle.speed
                  : -vehicle.speed),
              y: vehicle.position.y,
            },
          }))
          .filter(
            (vehicle) =>
              vehicle.position.x > -CAR_WIDTH &&
              vehicle.position.x < GAME_WIDTH + CAR_WIDTH
          );

        // 移动木头
        const newLogs = prev.logs
          .map((log) => ({
            ...log,
            position: {
              x:
                log.position.x +
                (log.direction === "right" ? log.speed : -log.speed),
              y: log.position.y,
            },
          }))
          .filter(
            (log) =>
              log.position.x > -LOG_WIDTH * log.length &&
              log.position.x < GAME_WIDTH + LOG_WIDTH * log.length
          );

        // 生成新车辆和木头
        const newVehiclesWithSpawns = [...newVehicles];
        const newLogsWithSpawns = [...newLogs];

        LANES.forEach((lane, index) => {
          if (lane.type === "road" && Math.random() < 0.02) {
            newVehiclesWithSpawns.push(generateVehicle(index));
          } else if (lane.type === "water" && Math.random() < 0.03) {
            newLogsWithSpawns.push(generateLog(index));
          }
        });

        // 检查碰撞
        let newLives = prev.lives;
        let gameOver = prev.gameOver;
        let newScore = prev.score;
        let newFrog = prev.frog;

        // 检查与车辆碰撞
        const vehicleCollision = newVehiclesWithSpawns.some((vehicle) =>
          checkCollision(
            prev.frog,
            vehicle.position,
            FROG_SIZE,
            FROG_SIZE,
            CAR_WIDTH,
            CAR_HEIGHT
          )
        );

        if (vehicleCollision) {
          newLives -= 1;
          if (newLives <= 0) {
            gameOver = true;
          } else {
            newFrog = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30 };
          }
        }

        // 检查青蛙是否在水中
        const currentLane = Math.floor(prev.frog.y / LANE_HEIGHT);
        const laneConfig = LANES[currentLane];

        if (laneConfig.type === "water") {
          // 检查是否在木头上
          const onLog = newLogsWithSpawns.some((log) =>
            checkCollision(
              prev.frog,
              log.position,
              FROG_SIZE,
              FROG_SIZE,
              LOG_WIDTH * log.length,
              LOG_HEIGHT
            )
          );

          if (!onLog) {
            // 青蛙掉入水中
            newLives -= 1;
            if (newLives <= 0) {
              gameOver = true;
            } else {
              newFrog = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30 };
            }
          } else {
            // 青蛙在木头上，跟随木头移动
            const log = newLogsWithSpawns.find((l) =>
              checkCollision(
                prev.frog,
                l.position,
                FROG_SIZE,
                FROG_SIZE,
                LOG_WIDTH * l.length,
                LOG_HEIGHT
              )
            );
            if (log) {
              newFrog = {
                x:
                  prev.frog.x +
                  (log.direction === "right" ? log.speed : -log.speed),
                y: prev.frog.y,
              };
            }
          }
        }

        // 检查胜利条件
        let isWon = false;
        if (prev.frog.y <= 0) {
          isWon = true;
          newScore += 100;
          newFrog = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30 };
        }

        // 更新自动记录器
        if (gameRecorder) {
          gameRecorder.updateScore(newScore);
        }

        return {
          ...prev,
          frog: newFrog,
          vehicles: newVehiclesWithSpawns,
          logs: newLogsWithSpawns,
          lives: newLives,
          gameOver,
          isWon,
          score: newScore,
          timeLeft: Math.max(0, prev.timeLeft - 0.1),
        };
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    generateVehicle,
    generateLog,
    checkCollision,
    gameRecorder,
  ]);

  // 计时器
  useEffect(() => {
    if (!isPlaying || gameState.gameOver) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft <= 0) {
          return {
            ...prev,
            gameOver: true,
          };
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, gameState.gameOver]);

  // 键盘控制
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.toLowerCase();

      switch (key) {
        case "arrowup":
        case "w":
          moveFrog("up");
          break;
        case "arrowdown":
        case "s":
          moveFrog("down");
          break;
        case "arrowleft":
        case "a":
          moveFrog("left");
          break;
        case "arrowright":
        case "d":
          moveFrog("right");
          break;
        case "p":
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, moveFrog]);

  const startGame = () => {
    setGameState({
      frog: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 30 },
      vehicles: [],
      logs: [],
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      isWon: false,
      isPaused: false,
      timeLeft: 60,
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Frogger Game",
      "frogger-game"
    );
    setGameRecorder(recorder);
  };

  const resetGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-6 bg-gradient-to-br from-green-900 via-blue-900 to-yellow-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🐸 Frogger Game
          </h2>
          <p className="text-white/70">
            Help the frog cross the road and water to reach the other side!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Lives: {gameState.lives}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Time: {Math.floor(gameState.timeLeft)}s
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">High Score: {highScore}</div>
          </div>
        </div>

        {/* 游戏区域 */}
        <div
          className="relative mx-auto mb-6 overflow-hidden rounded-lg"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* 背景 */}
          {LANES.map((lane, index) => (
            <div
              key={index}
              className={`absolute w-full ${
                lane.type === "road"
                  ? "bg-gray-600"
                  : lane.type === "water"
                  ? "bg-blue-600"
                  : "bg-green-600"
              }`}
              style={{
                left: 0,
                top: index * LANE_HEIGHT,
                height: LANE_HEIGHT,
              }}
            />
          ))}

          {/* 车辆 */}
          {gameState.vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`absolute ${
                vehicle.type === "car" ? "bg-red-500" : "bg-blue-500"
              } rounded`}
              style={{
                left: vehicle.position.x,
                top: vehicle.position.y - CAR_HEIGHT / 2,
                width: CAR_WIDTH,
                height: CAR_HEIGHT,
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                🚗
              </div>
            </div>
          ))}

          {/* 木头 */}
          {gameState.logs.map((log) => (
            <div
              key={log.id}
              className="absolute bg-yellow-600 rounded"
              style={{
                left: log.position.x,
                top: log.position.y - LOG_HEIGHT / 2,
                width: LOG_WIDTH * log.length,
                height: LOG_HEIGHT,
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                🪵
              </div>
            </div>
          ))}

          {/* 青蛙 */}
          <div
            className="absolute bg-green-500 rounded-full"
            style={{
              left: gameState.frog.x,
              top: gameState.frog.y,
              width: FROG_SIZE,
              height: FROG_SIZE,
            }}
          >
            <div className="w-full h-full bg-green-400 rounded-full flex items-center justify-center text-white font-bold text-xs">
              🐸
            </div>
          </div>
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              💀 Game Over!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
          </div>
        )}

        {gameState.isWon && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-green-400 mb-2">
              🎉 You Made It!
            </p>
            <p className="text-white/70">Score: {gameState.score}</p>
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
          <p>🎮 Use arrow keys or WASD to move</p>
          <p>⏸️ Press P to pause</p>
          <p>🚗 Avoid cars on the road</p>
          <p>🪵 Jump on logs to cross water</p>
          <p>🏁 Reach the top to win!</p>
        </div>
      </Card>
    </div>
  );
}
