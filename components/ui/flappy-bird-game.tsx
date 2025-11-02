"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Pipe {
  id: string;
  x: number;
  gapY: number;
  gapHeight: number;
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2;

export function FlappyBirdGame() {
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("flappyBirdHighScore");
    if (stored) setHighScore(parseInt(stored, 10));
  }, []);

  // 生成管道
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const interval = setInterval(() => {
      setPipes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          x: GAME_WIDTH,
          gapY: Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50,
          gapHeight: PIPE_GAP,
        },
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isStarted, gameOver]);

  // 游戏循环
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setBirdVelocity((v) => v + GRAVITY);
      setBirdY((y) => {
        const newY = y + birdVelocity;
        return Math.max(0, Math.min(GAME_HEIGHT - 30, newY));
      });

      setPipes((prev) => {
        const newPipes = prev
          .map((pipe) => ({
            ...pipe,
            x: pipe.x - PIPE_SPEED,
          }))
          .filter((pipe) => pipe.x + PIPE_WIDTH > 0);

        // 检查得分
        newPipes.forEach((pipe) => {
          if (
            pipe.x + PIPE_WIDTH < 50 &&
            pipe.x + PIPE_WIDTH > 50 - PIPE_SPEED
          ) {
            setScore((s) => s + 1);
          }
        });

        // 检查碰撞
        newPipes.forEach((pipe) => {
          const birdRect = { x: 50, y: birdY, width: 30, height: 30 };
          const topPipe = {
            x: pipe.x,
            y: 0,
            width: PIPE_WIDTH,
            height: pipe.gapY,
          };
          const bottomPipe = {
            x: pipe.x,
            y: pipe.gapY + pipe.gapHeight,
            width: PIPE_WIDTH,
            height: GAME_HEIGHT - (pipe.gapY + pipe.gapHeight),
          };

          if (
            birdRect.x < topPipe.x + topPipe.width &&
            birdRect.x + birdRect.width > topPipe.x &&
            birdRect.y < topPipe.y + topPipe.height &&
            birdRect.y + birdRect.height > topPipe.y
          ) {
            setGameOver(true);
            setHighScore((hs) => {
              const newHigh = Math.max(hs, score + 1);
              localStorage.setItem("flappyBirdHighScore", newHigh.toString());
              return newHigh;
            });
          }

          if (
            birdRect.x < bottomPipe.x + bottomPipe.width &&
            birdRect.x + birdRect.width > bottomPipe.x &&
            birdRect.y < bottomPipe.y + bottomPipe.height &&
            birdRect.y + birdRect.height > bottomPipe.y
          ) {
            setGameOver(true);
            setHighScore((hs) => {
              const newHigh = Math.max(hs, score + 1);
              localStorage.setItem("flappyBirdHighScore", newHigh.toString());
              return newHigh;
            });
          }
        });

        return newPipes;
      });

      // 检查边界碰撞
      if (birdY >= GAME_HEIGHT - 30 || birdY <= 0) {
        setGameOver(true);
        setHighScore((hs) => {
          const newHigh = Math.max(hs, score);
          localStorage.setItem("flappyBirdHighScore", newHigh.toString());
          return newHigh;
        });
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isStarted, gameOver, birdY, birdVelocity, score]);

  const jump = useCallback(() => {
    if (gameOver) return;
    if (!isStarted) {
      setIsStarted(true);
      setBirdVelocity(JUMP_STRENGTH);
    } else {
      setBirdVelocity(JUMP_STRENGTH);
    }
  }, [gameOver, isStarted]);

  const reset = () => {
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setIsStarted(false);
  };

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [jump]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-2">🐦 Flappy Bird</h2>
        <div className="flex justify-center gap-4 text-white">
          <div>Score: {score}</div>
          <div>Best: {highScore}</div>
        </div>
      </div>

      <Card
        className="relative bg-gradient-to-b from-blue-400 to-blue-600 overflow-hidden border-2 border-blue-500"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        onClick={jump}
      >
        {/* 背景云朵 */}
        <div className="absolute top-20 left-20 w-32 h-16 bg-white/30 rounded-full blur-xl" />
        <div className="absolute top-40 right-20 w-24 h-12 bg-white/30 rounded-full blur-xl" />
        <div className="absolute bottom-40 left-40 w-28 h-14 bg-white/30 rounded-full blur-xl" />

        {/* 管道 */}
        {pipes.map((pipe) => (
          <div key={pipe.id}>
            {/* 顶部管道 */}
            <div
              className="absolute bg-green-500 border-2 border-green-700"
              style={{
                left: pipe.x,
                top: 0,
                width: PIPE_WIDTH,
                height: pipe.gapY,
              }}
            >
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-green-600 border-t-2 border-green-800" />
            </div>
            {/* 底部管道 */}
            <div
              className="absolute bg-green-500 border-2 border-green-700"
              style={{
                left: pipe.x,
                top: pipe.gapY + pipe.gapHeight,
                width: PIPE_WIDTH,
                height: GAME_HEIGHT - (pipe.gapY + pipe.gapHeight),
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-8 bg-green-600 border-b-2 border-green-800" />
            </div>
          </div>
        ))}

        {/* 小鸟 */}
        <div
          className="absolute bg-yellow-400 rounded-full border-2 border-yellow-600 transition-transform"
          style={{
            left: 50,
            top: birdY,
            width: 30,
            height: 30,
            transform: `rotate(${Math.min(birdVelocity * 3, 45)}deg)`,
          }}
        >
          <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full" />
          <div className="absolute top-4 right-4 w-3 h-2 bg-orange-500 rounded" />
        </div>

        {/* 地面 */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-600 to-green-500 border-t-4 border-green-700">
          <div className="absolute top-0 left-0 right-0 h-4 bg-green-700" />
        </div>

        {/* 游戏开始/结束覆盖层 */}
        {!isStarted && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Flappy Bird</h3>
              <p className="mb-4">Click or press Space to start!</p>
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
        Click or press Space/↑ to jump
      </div>
    </div>
  );
}
