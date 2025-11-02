"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BALL_SIZE = 20;
const GRAVITY = 0.8;
const BOUNCE_DAMPING = 0.7;
const PLATFORM_SPEED = 5;

export function BallGame() {
  const [ballX, setBallX] = useState(GAME_WIDTH / 2);
  const [ballY, setBallY] = useState(50);
  const [ballVelocityX, setBallVelocityX] = useState(0);
  const [ballVelocityY, setBallVelocityY] = useState(0);
  const [platformX, setPlatformX] = useState(GAME_WIDTH / 2 - 50);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [keys, setKeys] = useState({ left: false, right: false });

  useEffect(() => {
    const stored = localStorage.getItem("ballGameHighScore");
    if (stored) setHighScore(parseInt(stored, 10));
  }, []);

  // 游戏循环
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // 物理更新
      setBallVelocityY((vy) => vy + GRAVITY);
      setBallX((x) => {
        const newX = x + ballVelocityX;
        if (newX < BALL_SIZE / 2 || newX > GAME_WIDTH - BALL_SIZE / 2) {
          setBallVelocityX((vx) => -vx * BOUNCE_DAMPING);
          return Math.max(
            BALL_SIZE / 2,
            Math.min(GAME_WIDTH - BALL_SIZE / 2, newX)
          );
        }
        return newX;
      });
      setBallY((y) => {
        const newY = y + ballVelocityY;
        if (newY < BALL_SIZE / 2) {
          setBallVelocityY((vy) => -vy * BOUNCE_DAMPING);
          return BALL_SIZE / 2;
        }

        // 检查与平台的碰撞
        const platformTop = GAME_HEIGHT - 40;
        const platformLeft = platformX;
        const platformRight = platformX + 100;

        if (
          newY + BALL_SIZE / 2 >= platformTop &&
          newY - BALL_SIZE / 2 <= platformTop + 10 &&
          ballX + BALL_SIZE / 2 >= platformLeft &&
          ballX - BALL_SIZE / 2 <= platformRight
        ) {
          const hitPos = (ballX - platformX) / 100;
          const angle = (hitPos - 0.5) * Math.PI * 0.5;
          setBallVelocityX(Math.sin(angle) * 8);
          setBallVelocityY(-Math.cos(angle) * 8);
          setScore((s) => s + 1);
          return platformTop - BALL_SIZE / 2;
        }

        if (newY > GAME_HEIGHT) {
          setGameOver(true);
          setHighScore((hs) => {
            const newHigh = Math.max(hs, score);
            localStorage.setItem("ballGameHighScore", newHigh.toString());
            return newHigh;
          });
        }

        return newY;
      });

      // 平台移动
      if (keys.left) {
        setPlatformX((x) => Math.max(0, x - PLATFORM_SPEED));
      }
      if (keys.right) {
        setPlatformX((x) => Math.min(GAME_WIDTH - 100, x + PLATFORM_SPEED));
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [
    isStarted,
    gameOver,
    ballX,
    ballY,
    ballVelocityX,
    ballVelocityY,
    platformX,
    keys,
    score,
  ]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        setKeys((k) => ({ ...k, left: true }));
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        setKeys((k) => ({ ...k, right: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        setKeys((k) => ({ ...k, left: false }));
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        setKeys((k) => ({ ...k, right: false }));
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
    setBallVelocityY(2);
    setBallVelocityX((Math.random() - 0.5) * 4);
  };

  const reset = () => {
    setBallX(GAME_WIDTH / 2);
    setBallY(50);
    setBallVelocityX(0);
    setBallVelocityY(0);
    setPlatformX(GAME_WIDTH / 2 - 50);
    setScore(0);
    setGameOver(false);
    setIsStarted(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-2">⚽ Ball Game</h2>
        <div className="flex justify-center gap-4 text-white">
          <div>Score: {score}</div>
          <div>Best: {highScore}</div>
        </div>
      </div>

      <Card
        className="relative bg-gradient-to-b from-blue-200 to-blue-400 overflow-hidden border-2 border-blue-500"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* 球 */}
        <div
          className="absolute rounded-full bg-red-500 border-2 border-red-700 shadow-lg"
          style={{
            left: ballX - BALL_SIZE / 2,
            top: ballY - BALL_SIZE / 2,
            width: BALL_SIZE,
            height: BALL_SIZE,
          }}
        />

        {/* 平台 */}
        <div
          className="absolute bg-green-500 rounded-lg border-2 border-green-700"
          style={{
            left: platformX,
            top: GAME_HEIGHT - 40,
            width: 100,
            height: 20,
          }}
        />

        {/* 游戏开始/结束覆盖层 */}
        {!isStarted && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Ball Game</h3>
              <p className="mb-4">Use ← → or A D to move platform!</p>
              <Button onClick={start} className="bg-blue-600 hover:bg-blue-700">
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
                className="bg-blue-600 hover:bg-blue-700 mt-4"
              >
                Play Again
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 text-center text-white/70 text-sm">
        Use ← → or A D to move the platform
      </div>
    </div>
  );
}
