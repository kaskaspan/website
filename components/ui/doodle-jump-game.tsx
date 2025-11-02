"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  type: "normal" | "moving" | "fragile";
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 15;

export function DoodleJumpGame() {
  const [doodleX, setDoodleX] = useState(GAME_WIDTH / 2);
  const [doodleY, setDoodleY] = useState(GAME_HEIGHT - 100);
  const [doodleVelocity, setDoodleVelocity] = useState(0);
  const [doodleVelocityX, setDoodleVelocityX] = useState(0);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [cameraY, setCameraY] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("doodleJumpHighScore");
    if (stored) setHighScore(parseInt(stored, 10));

    // 初始化平台
    const initialPlatforms: Platform[] = [];
    for (let i = 0; i < 20; i++) {
      initialPlatforms.push({
        id: `platform-${i}`,
        x: Math.random() * (GAME_WIDTH - PLATFORM_WIDTH),
        y: GAME_HEIGHT - 50 - i * 80,
        width: PLATFORM_WIDTH,
        type:
          Math.random() < 0.1
            ? "fragile"
            : Math.random() < 0.2
            ? "moving"
            : "normal",
      });
    }
    setPlatforms(initialPlatforms);
  }, []);

  // 游戏循环
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // 重力
      setDoodleVelocity((v) => v + GRAVITY);
      setDoodleY((y) => {
        const newY = y + doodleVelocity;
        const relativeY = newY - cameraY;

        // 相机跟随
        if (relativeY < GAME_HEIGHT / 3 && doodleVelocity < 0) {
          setCameraY((cy) => cy + doodleVelocity);
        }

        // 检查平台碰撞
        platforms.forEach((platform) => {
          const platformY = platform.y - cameraY;
          if (
            doodleVelocity > 0 &&
            newY + 30 > platformY &&
            newY + 30 < platformY + PLATFORM_HEIGHT &&
            doodleX + 20 > platform.x &&
            doodleX < platform.x + platform.width
          ) {
            setDoodleVelocity(JUMP_STRENGTH);
            setScore((s) => s + 1);

            if (platform.type === "fragile") {
              setPlatforms((ps) => ps.filter((p) => p.id !== platform.id));
            }
          }
        });

        return newY;
      });

      // 水平移动
      setDoodleX((x) => {
        let newX = x + doodleVelocityX;
        // 屏幕边界循环
        if (newX < -20) newX = GAME_WIDTH;
        if (newX > GAME_WIDTH) newX = -20;
        return newX;
      });

      // 移动平台
      setPlatforms((ps) =>
        ps.map((p) => {
          if (p.type === "moving") {
            const newX =
              p.x + Math.sin(Date.now() / 500 + parseInt(p.id) * 10) * 2;
            return {
              ...p,
              x: Math.max(0, Math.min(GAME_WIDTH - p.width, newX)),
            };
          }
          return p;
        })
      );

      // 生成新平台
      const highestPlatform = Math.min(...platforms.map((p) => p.y));
      if (cameraY < highestPlatform - GAME_HEIGHT) {
        const newPlatform: Platform = {
          id: Date.now().toString(),
          x: Math.random() * (GAME_WIDTH - PLATFORM_WIDTH),
          y: highestPlatform - 80,
          width: PLATFORM_WIDTH,
          type:
            Math.random() < 0.1
              ? "fragile"
              : Math.random() < 0.2
              ? "moving"
              : "normal",
        };
        setPlatforms((ps) => [...ps, newPlatform]);
      }

      // 移除旧平台
      setPlatforms((ps) => ps.filter((p) => p.y - cameraY < GAME_HEIGHT + 100));

      // 检查游戏结束
      if (doodleY - cameraY > GAME_HEIGHT) {
        setGameOver(true);
        setHighScore((hs) => {
          const newHigh = Math.max(hs, score);
          localStorage.setItem("doodleJumpHighScore", newHigh.toString());
          return newHigh;
        });
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [
    isStarted,
    gameOver,
    doodleY,
    doodleVelocity,
    doodleX,
    doodleVelocityX,
    cameraY,
    platforms,
    score,
  ]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        setDoodleVelocityX(-5);
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        setDoodleVelocityX(5);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        e.code === "ArrowLeft" ||
        e.code === "ArrowRight" ||
        e.code === "KeyA" ||
        e.code === "KeyD"
      ) {
        setDoodleVelocityX(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const start = () => {
    setIsStarted(true);
    setDoodleVelocity(JUMP_STRENGTH);
  };

  const reset = () => {
    setDoodleX(GAME_WIDTH / 2);
    setDoodleY(GAME_HEIGHT - 100);
    setDoodleVelocity(0);
    setDoodleVelocityX(0);
    setScore(0);
    setGameOver(false);
    setIsStarted(false);
    setCameraY(0);

    const initialPlatforms: Platform[] = [];
    for (let i = 0; i < 20; i++) {
      initialPlatforms.push({
        id: `platform-${i}`,
        x: Math.random() * (GAME_WIDTH - PLATFORM_WIDTH),
        y: GAME_HEIGHT - 50 - i * 80,
        width: PLATFORM_WIDTH,
        type:
          Math.random() < 0.1
            ? "fragile"
            : Math.random() < 0.2
            ? "moving"
            : "normal",
      });
    }
    setPlatforms(initialPlatforms);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-2">📱 Doodle Jump</h2>
        <div className="flex justify-center gap-4 text-white">
          <div>Score: {score}</div>
          <div>Best: {highScore}</div>
        </div>
      </div>

      <Card
        className="relative bg-gradient-to-b from-blue-300 to-blue-500 overflow-hidden border-2 border-blue-400"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* 平台 */}
        {platforms.map((platform) => {
          const platformY = platform.y - cameraY;
          if (platformY < -50 || platformY > GAME_HEIGHT + 50) return null;

          return (
            <div
              key={platform.id}
              className={`absolute ${
                platform.type === "fragile"
                  ? "bg-red-400 border-2 border-red-600"
                  : platform.type === "moving"
                  ? "bg-yellow-400 border-2 border-yellow-600"
                  : "bg-green-400 border-2 border-green-600"
              }`}
              style={{
                left: platform.x,
                top: platformY,
                width: platform.width,
                height: PLATFORM_HEIGHT,
              }}
            />
          );
        })}

        {/* 涂鸦 */}
        <div
          className="absolute bg-yellow-400 rounded-full border-2 border-yellow-600"
          style={{
            left: doodleX,
            top: doodleY - cameraY,
            width: 40,
            height: 40,
          }}
        >
          <div className="absolute top-2 left-2 w-3 h-3 bg-black rounded-full" />
          <div className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full" />
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black rounded-full" />
        </div>

        {/* 游戏开始/结束覆盖层 */}
        {!isStarted && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Doodle Jump</h3>
              <p className="mb-4">Use ← → or A D to move!</p>
              <Button
                onClick={start}
                className="bg-green-600 hover:bg-green-700"
              >
                Start
              </Button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-3xl font-bold mb-4">Game Over!</h3>
              <p className="text-xl mb-2">Score: {score}</p>
              {score === highScore && score > 0 && (
                <p className="text-yellow-400 mb-4">🎉 New High Score!</p>
              )}
              <Button
                onClick={reset}
                className="bg-green-600 hover:bg-green-700 mt-4"
              >
                Play Again
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 text-center text-white/70 text-sm">
        Use ← → or A D keys to move left/right
      </div>
    </div>
  );
}
