"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  speed: number;
  dinoY: number;
  dinoVelocity: number;
  obstacles: Array<{
    id: number;
    x: number;
    width: number;
    height: number;
  }>;
}

export function DinoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastObstacleTimeRef = useRef<number>(0);
  const obstacleIdRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    speed: 2,
    dinoY: 0,
    dinoVelocity: 0,
    obstacles: [],
  });

  const [highScore, setHighScore] = useState(0);

  // 游戏常量
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const GROUND_Y = 150;
  const DINO_SIZE = 40;
  const OBSTACLE_SPEED = 3;

  // 初始化游戏
  const initGame = useCallback(() => {
    setGameState({
      isPlaying: false,
      isGameOver: false,
      score: 0,
      speed: 2,
      dinoY: 0,
      dinoVelocity: 0,
      obstacles: [],
    });
  }, []);

  // 开始游戏
  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      score: 0,
      speed: 2,
      dinoY: 0,
      dinoVelocity: 0,
      obstacles: [],
    }));
  }, []);

  // 跳跃
  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    setGameState((prev) => ({
      ...prev,
      dinoVelocity: JUMP_FORCE,
    }));
  }, [gameState.isPlaying, gameState.isGameOver]);

  // 检查碰撞
  const checkCollision = useCallback(
    (dinoX: number, dinoY: number, obstacles: GameState["obstacles"]) => {
      const dinoLeft = dinoX;
      const dinoRight = dinoX + DINO_SIZE;
      const dinoTop = dinoY;
      const dinoBottom = dinoY + DINO_SIZE;

      for (const obstacle of obstacles) {
        const obstacleLeft = obstacle.x;
        const obstacleRight = obstacle.x + obstacle.width;
        const obstacleTop = GROUND_Y - obstacle.height;
        const obstacleBottom = GROUND_Y;

        if (
          dinoRight > obstacleLeft &&
          dinoLeft < obstacleRight &&
          dinoBottom > obstacleTop &&
          dinoTop < obstacleBottom
        ) {
          return true;
        }
      }
      return false;
    },
    []
  );

  // 游戏循环
  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    setGameState((prev) => {
      const newState = { ...prev };

      // 更新恐龙位置
      newState.dinoVelocity += GRAVITY;
      newState.dinoY += newState.dinoVelocity;

      // 限制恐龙不超出地面
      if (newState.dinoY > 0) {
        newState.dinoY = 0;
        newState.dinoVelocity = 0;
      }

      // 更新障碍物位置
      newState.obstacles = newState.obstacles
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - OBSTACLE_SPEED,
        }))
        .filter((obstacle) => obstacle.x + obstacle.width > 0);

      // 生成新障碍物
      const now = Date.now();
      if (now - lastObstacleTimeRef.current > 2000 + Math.random() * 1000) {
        const newObstacle = {
          id: obstacleIdRef.current++,
          x: 400,
          width: 20,
          height: 30 + Math.random() * 20,
        };
        newState.obstacles.push(newObstacle);
        lastObstacleTimeRef.current = now;
      }

      // 增加分数
      newState.score += 1;

      // 增加速度
      if (newState.score % 100 === 0) {
        newState.speed += 0.1;
      }

      // 检查碰撞
      if (
        checkCollision(
          50,
          GROUND_Y - DINO_SIZE - newState.dinoY,
          newState.obstacles
        )
      ) {
        newState.isGameOver = true;
        newState.isPlaying = false;

        // 更新最高分
        if (newState.score > highScore) {
          setHighScore(newState.score);
        }
      }

      return newState;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPlaying, gameState.isGameOver, checkCollision, highScore]);

  // 绘制游戏
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景
    ctx.fillStyle = "#f7f7f7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制地面
    ctx.fillStyle = "#535353";
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // 绘制恐龙
    const dinoX = 50;
    const dinoY = GROUND_Y - DINO_SIZE - gameState.dinoY;

    ctx.fillStyle = "#535353";
    ctx.fillRect(dinoX, dinoY, DINO_SIZE, DINO_SIZE);

    // 绘制障碍物
    ctx.fillStyle = "#535353";
    gameState.obstacles.forEach((obstacle) => {
      ctx.fillRect(
        obstacle.x,
        GROUND_Y - obstacle.height,
        obstacle.width,
        obstacle.height
      );
    });

    // 绘制分数
    ctx.fillStyle = "#535353";
    ctx.font = "16px Arial";
    ctx.fillText(`分数: ${gameState.score}`, 10, 30);

    // 绘制最高分
    ctx.fillText(`最高分: ${highScore}`, 10, 50);

    // 绘制游戏结束信息
    if (gameState.isGameOver) {
      ctx.fillStyle = "#535353";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("游戏结束!", canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = "14px Arial";
      ctx.fillText(
        "按空格键重新开始",
        canvas.width / 2,
        canvas.height / 2 + 10
      );
      ctx.textAlign = "left";
    }
  }, [gameState, highScore]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!gameState.isPlaying && !gameState.isGameOver) {
          startGame();
        } else if (gameState.isPlaying) {
          jump();
        } else if (gameState.isGameOver) {
          initGame();
          startGame();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, startGame, jump, initGame]);

  // 游戏循环
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isGameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isGameOver, gameLoop]);

  // 绘制游戏
  useEffect(() => {
    drawGame();
  }, [drawGame]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
          恐龙游戏
        </h1>
        <p className="text-gray-600 text-center mb-4">
          按空格键跳跃，避开障碍物！
        </p>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="border border-gray-300 rounded"
          />
        </div>

        <div className="text-center">
          {!gameState.isPlaying && !gameState.isGameOver && (
            <button
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded font-medium"
            >
              开始游戏
            </button>
          )}

          {gameState.isGameOver && (
            <button
              onClick={() => {
                initGame();
                startGame();
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded font-medium"
            >
              重新开始
            </button>
          )}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>按空格键跳跃</p>
          <p>当前分数: {gameState.score}</p>
          <p>最高分: {highScore}</p>
        </div>
      </div>
    </div>
  );
}

// 离线页面组件 - 使用恐龙游戏
export function OfflinePageWithGame() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <DinoGame />
    </div>
  );
}
