"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 300;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 20;
const PLATFORM_HEIGHT = 10;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const PLAYER_SPEED = 4;

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "normal" | "moving" | "breakable";
  velocity?: { x: number; y: number };
}

interface GameState {
  player: {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    onGround: boolean;
  };
  platforms: Platform[];
  score: number;
  gameOver: boolean;
  isPaused: boolean;
  level: number;
  cameraY: number;
}

const LEVEL_PLATFORMS = {
  1: [
    {
      x: 0,
      y: GAME_HEIGHT - 20,
      width: GAME_WIDTH,
      height: PLATFORM_HEIGHT,
      type: "normal",
    },
    {
      x: 100,
      y: GAME_HEIGHT - 80,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: "normal",
    },
    {
      x: 250,
      y: GAME_HEIGHT - 140,
      width: 80,
      height: PLATFORM_HEIGHT,
      type: "normal",
    },
    {
      x: 150,
      y: GAME_HEIGHT - 200,
      width: 100,
      height: PLATFORM_HEIGHT,
      type: "normal",
    },
  ],
  2: [
    {
      x: 0,
      y: GAME_HEIGHT - 20,
      width: GAME_WIDTH,
      height: PLATFORM_HEIGHT,
      type: "normal",
    },
    {
      x: 80,
      y: GAME_HEIGHT - 60,
      width: 60,
      height: PLATFORM_HEIGHT,
      type: "moving",
      velocity: { x: 2, y: 0 },
    },
    {
      x: 200,
      y: GAME_HEIGHT - 120,
      width: 60,
      height: PLATFORM_HEIGHT,
      type: "breakable",
    },
    {
      x: 300,
      y: GAME_HEIGHT - 180,
      width: 60,
      height: PLATFORM_HEIGHT,
      type: "normal",
    },
  ],
};

export function PlatformerGame() {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 50,
      y: GAME_HEIGHT - 50,
      velocityX: 0,
      velocityY: 0,
      onGround: false,
    },
    platforms: [],
    score: 0,
    gameOver: false,
    isPaused: false,
    level: 1,
    cameraY: 0,
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

  // 初始化关卡
  const initializeLevel = useCallback((level: number) => {
    const levelPlatforms =
      LEVEL_PLATFORMS[level as keyof typeof LEVEL_PLATFORMS] ||
      LEVEL_PLATFORMS[1];
    const platforms: Platform[] = levelPlatforms.map((platform, index) => ({
      id: index,
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: platform.height,
      type: platform.type as Platform["type"],
      velocity: "velocity" in platform ? platform.velocity : undefined,
    }));

    setGameState((prev) => ({
      ...prev,
      platforms,
      player: {
        x: 50,
        y: GAME_HEIGHT - 50,
        velocityX: 0,
        velocityY: 0,
        onGround: false,
      },
      cameraY: 0,
    }));
  }, []);

  // 检查碰撞
  const checkCollision = useCallback(
    (player: GameState["player"], platforms: Platform[]) => {
      const playerRect = {
        x: player.x,
        y: player.y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
      };

      for (const platform of platforms) {
        if (
          playerRect.x < platform.x + platform.width &&
          playerRect.x + playerRect.width > platform.x &&
          playerRect.y < platform.y + platform.height &&
          playerRect.y + playerRect.height > platform.y
        ) {
          return { platform, collision: true };
        }
      }
      return { platform: null, collision: false };
    },
    []
  );

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState((prevState) => {
        const newPlayer = { ...prevState.player };

        // 处理输入
        if (keys.has("ArrowLeft") || keys.has("a")) {
          newPlayer.velocityX = -PLAYER_SPEED;
        } else if (keys.has("ArrowRight") || keys.has("d")) {
          newPlayer.velocityX = PLAYER_SPEED;
        } else {
          newPlayer.velocityX *= 0.8; // 摩擦力
        }

        if (
          (keys.has("ArrowUp") || keys.has("w") || keys.has(" ")) &&
          newPlayer.onGround
        ) {
          newPlayer.velocityY = JUMP_FORCE;
          newPlayer.onGround = false;
        }

        // 应用重力
        newPlayer.velocityY += GRAVITY;

        // 更新位置
        newPlayer.x += newPlayer.velocityX;
        newPlayer.y += newPlayer.velocityY;

        // 边界检查
        if (newPlayer.x < 0) newPlayer.x = 0;
        if (newPlayer.x + PLAYER_WIDTH > GAME_WIDTH)
          newPlayer.x = GAME_WIDTH - PLAYER_WIDTH;

        // 检查是否掉出屏幕
        if (newPlayer.y > GAME_HEIGHT) {
          return {
            ...prevState,
            gameOver: true,
          };
        }

        // 移动平台
        const newPlatforms = prevState.platforms.map((platform) => {
          if (platform.type === "moving" && platform.velocity) {
            const newX = platform.x + platform.velocity.x;
            if (newX <= 0 || newX + platform.width >= GAME_WIDTH) {
              platform.velocity.x *= -1;
            }
            return { ...platform, x: newX };
          }
          return platform;
        });

        // 检查碰撞
        const { platform: collidedPlatform, collision } = checkCollision(
          newPlayer,
          newPlatforms
        );

        if (collision && collidedPlatform) {
          // 从上方碰撞（着陆）
          if (newPlayer.velocityY > 0 && newPlayer.y < collidedPlatform.y) {
            newPlayer.y = collidedPlatform.y - PLAYER_HEIGHT;
            newPlayer.velocityY = 0;
            newPlayer.onGround = true;

            // 处理特殊平台
            if (collidedPlatform.type === "breakable") {
              // 移除可破坏平台
              const updatedPlatforms = newPlatforms.filter(
                (p) => p.id !== collidedPlatform.id
              );
              return {
                ...prevState,
                player: newPlayer,
                platforms: updatedPlatforms,
                score: prevState.score + 10,
              };
            }
          }
        } else {
          newPlayer.onGround = false;
        }

        // 更新相机
        const newCameraY = Math.max(0, newPlayer.y - GAME_HEIGHT / 2);

        // 检查是否到达关卡顶部
        if (newPlayer.y < 50) {
          const newLevel = prevState.level + 1;
          return {
            ...prevState,
            level: newLevel,
            score: prevState.score + 100,
          };
        }

        // 更新自动记录器
        if (gameRecorder) {
          gameRecorder.updateScore(prevState.score + 1);
        }

        return {
          ...prevState,
          player: newPlayer,
          platforms: newPlatforms,
          cameraY: newCameraY,
          score: prevState.score + 1,
        };
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    keys,
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
    initializeLevel(1);
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Platformer Game",
      "platformer-game"
    );
    setGameRecorder(recorder);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState({
      player: {
        x: 50,
        y: GAME_HEIGHT - 50,
        velocityX: 0,
        velocityY: 0,
        onGround: false,
      },
      platforms: [],
      score: 0,
      gameOver: false,
      isPaused: false,
      level: 1,
      cameraY: 0,
    });
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-6 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🦘 Platformer Game
          </h2>
          <p className="text-white/70">
            Use arrow keys to move and jump, reach the top!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Level: {gameState.level}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">High Score: {highScore}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {gameState.player.onGround ? "On Ground" : "In Air"}
            </div>
          </div>
        </div>

        <div
          className="relative mx-auto mb-6 overflow-hidden"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* 背景 */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-green-400" />

          {/* 云朵 */}
          <div className="absolute top-4 left-8 w-12 h-6 bg-white/30 rounded-full" />
          <div className="absolute top-8 right-12 w-16 h-8 bg-white/30 rounded-full" />
          <div className="absolute top-12 left-32 w-10 h-5 bg-white/30 rounded-full" />

          {/* 平台 */}
          {gameState.platforms.map((platform) => (
            <div
              key={platform.id}
              className={`absolute ${
                platform.type === "normal"
                  ? "bg-green-600"
                  : platform.type === "moving"
                  ? "bg-blue-600"
                  : platform.type === "breakable"
                  ? "bg-red-600"
                  : "bg-gray-600"
              } border-2 border-white/50`}
              style={{
                left: platform.x,
                top: platform.y - gameState.cameraY,
                width: platform.width,
                height: platform.height,
              }}
            />
          ))}

          {/* 玩家 */}
          <div
            className="absolute bg-yellow-500 border-2 border-white rounded"
            style={{
              left: gameState.player.x,
              top: gameState.player.y - gameState.cameraY,
              width: PLAYER_WIDTH,
              height: PLAYER_HEIGHT,
            }}
          >
            <div className="w-full h-full bg-yellow-400 rounded flex items-center justify-center text-white font-bold text-xs">
              🦘
            </div>
          </div>
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              💀 Game Over!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">Level Reached: {gameState.level}</p>
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
          <p>🎮 Controls: Arrow keys to move, Space/W to jump</p>
          <p>⏸️ Press P to pause</p>
          <p>🏃‍♂️ Reach the top to advance levels</p>
          <p>💥 Red platforms break when touched</p>
          <p>🔵 Blue platforms move</p>
        </div>
      </Card>
    </div>
  );
}
