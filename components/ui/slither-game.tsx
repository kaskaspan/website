"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Food {
  id: string;
  x: number;
  y: number;
}

interface SnakeSegment {
  x: number;
  y: number;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 600;
const GRID_SIZE = 20;
const INITIAL_LENGTH = 5;

export function SlitherGame() {
  const [snake, setSnake] = useState<SnakeSegment[]>([]);
  const [direction, setDirection] = useState<"up" | "down" | "left" | "right">(
    "right"
  );
  const [food, setFood] = useState<Food | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [nextDirection, setNextDirection] = useState<
    "up" | "down" | "left" | "right"
  >("right");

  useEffect(() => {
    const stored = localStorage.getItem("slitherHighScore");
    if (stored) setHighScore(parseInt(stored, 10));
  }, []);

  // 初始化蛇
  const initSnake = useCallback(() => {
    const initialSnake: SnakeSegment[] = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      initialSnake.push({
        x: Math.floor(GAME_WIDTH / GRID_SIZE / 2) * GRID_SIZE - i * GRID_SIZE,
        y: Math.floor(GAME_HEIGHT / GRID_SIZE / 2) * GRID_SIZE,
      });
    }
    setSnake(initialSnake);
    setDirection("right");
    setNextDirection("right");
  }, []);

  // 生成食物
  const generateFood = useCallback(() => {
    const maxX = Math.floor(GAME_WIDTH / GRID_SIZE);
    const maxY = Math.floor(GAME_HEIGHT / GRID_SIZE);
    const foodX = Math.floor(Math.random() * maxX) * GRID_SIZE;
    const foodY = Math.floor(Math.random() * maxY) * GRID_SIZE;

    // 确保食物不在蛇身上
    const onSnake = snake.some((seg) => seg.x === foodX && seg.y === foodY);
    if (!onSnake) {
      setFood({ id: Date.now().toString(), x: foodX, y: foodY });
    } else {
      generateFood();
    }
  }, [snake]);

  useEffect(() => {
    if (isStarted && !food) {
      generateFood();
    }
  }, [isStarted, food, generateFood]);

  // 游戏循环
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setDirection(nextDirection);

      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };

        switch (nextDirection) {
          case "up":
            head.y -= GRID_SIZE;
            break;
          case "down":
            head.y += GRID_SIZE;
            break;
          case "left":
            head.x -= GRID_SIZE;
            break;
          case "right":
            head.x += GRID_SIZE;
            break;
        }

        // 检查边界
        if (
          head.x < 0 ||
          head.x >= GAME_WIDTH ||
          head.y < 0 ||
          head.y >= GAME_HEIGHT
        ) {
          setGameOver(true);
          setHighScore((hs) => {
            const newHigh = Math.max(hs, score);
            localStorage.setItem("slitherHighScore", newHigh.toString());
            return newHigh;
          });
          return prevSnake;
        }

        // 检查自身碰撞
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          setHighScore((hs) => {
            const newHigh = Math.max(hs, score);
            localStorage.setItem("slitherHighScore", newHigh.toString());
            return newHigh;
          });
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // 检查是否吃到食物
        if (food && head.x === food.x && head.y === food.y) {
          setScore((s) => s + 10);
          setFood(null);
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 150);

    return () => clearInterval(gameLoop);
  }, [isStarted, gameOver, nextDirection, food, generateFood, score]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isStarted || gameOver) return;

      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          if (direction !== "down") {
            setNextDirection("up");
          }
          break;
        case "ArrowDown":
        case "KeyS":
          if (direction !== "up") {
            setNextDirection("down");
          }
          break;
        case "ArrowLeft":
        case "KeyA":
          if (direction !== "right") {
            setNextDirection("left");
          }
          break;
        case "ArrowRight":
        case "KeyD":
          if (direction !== "left") {
            setNextDirection("right");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isStarted, gameOver, direction]);

  const start = () => {
    initSnake();
    setIsStarted(true);
    generateFood();
  };

  const reset = () => {
    initSnake();
    setFood(null);
    setScore(0);
    setGameOver(false);
    setIsStarted(false);
    setTimeout(() => generateFood(), 100);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-2">🐍 Slither.io</h2>
        <div className="flex justify-center gap-4 text-white">
          <div>Score: {score}</div>
          <div>Best: {highScore}</div>
        </div>
      </div>

      <Card
        className="relative bg-green-600 overflow-hidden border-2 border-green-500"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* 网格 */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: GAME_WIDTH / GRID_SIZE }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute border-l border-white"
              style={{ left: i * GRID_SIZE, top: 0, bottom: 0 }}
            />
          ))}
          {Array.from({ length: GAME_HEIGHT / GRID_SIZE }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute border-t border-white"
              style={{ top: i * GRID_SIZE, left: 0, right: 0 }}
            />
          ))}
        </div>

        {/* 食物 */}
        {food && (
          <div
            className="absolute rounded-full bg-red-500 border-2 border-red-700 animate-pulse"
            style={{
              left: food.x,
              top: food.y,
              width: GRID_SIZE,
              height: GRID_SIZE,
            }}
          />
        )}

        {/* 蛇 */}
        {snake.map((segment, index) => (
          <div
            key={`${segment.x}-${segment.y}-${index}`}
            className={`absolute rounded ${
              index === 0
                ? "bg-yellow-400 border-2 border-yellow-600"
                : "bg-green-400 border border-green-600"
            }`}
            style={{
              left: segment.x,
              top: segment.y,
              width: GRID_SIZE,
              height: GRID_SIZE,
            }}
          >
            {index === 0 && (
              <>
                <div className="absolute top-1 left-1 w-1 h-1 bg-black rounded-full" />
                <div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full" />
              </>
            )}
          </div>
        ))}

        {/* 游戏开始/结束覆盖层 */}
        {!isStarted && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Slither.io</h3>
              <p className="mb-4">Use arrow keys or WASD to move!</p>
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
        Use arrow keys or WASD to control the snake
      </div>
    </div>
  );
}
