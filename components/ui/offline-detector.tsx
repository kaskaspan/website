"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OfflineDetectorProps {
  className?: string;
}

export function OfflineDetector({ className }: OfflineDetectorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // 检查初始网络状态
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      // 如果之前是离线状态，显示重新连接提示
      if (wasOffline) {
        setTimeout(() => {
          setWasOffline(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
    };

    // 监听网络状态变化
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  // 离线状态提示
  if (isOffline) {
    return (
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-3 px-4 text-center font-medium animate-slide-down",
          className
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
            />
          </svg>
          <span>无网络连接 - 请检查您的网络设置</span>
        </div>
      </div>
    );
  }

  // 重新连接成功提示
  if (wasOffline && !isOffline) {
    return (
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-green-600 text-white py-3 px-4 text-center font-medium animate-slide-down",
          className
        )}
      >
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>网络连接已恢复</span>
        </div>
      </div>
    );
  }

  return null;
}

// 离线页面组件 - 使用恐龙游戏
export function OfflinePage() {
  const [gameState, setGameState] = useState({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    highScore: 0,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastObstacleTimeRef = useRef<number>(0);
  const obstacleIdRef = useRef<number>(0);

  // 游戏状态
  const [dinoY, setDinoY] = useState(0);
  const [dinoVelocity, setDinoVelocity] = useState(0);
  const [obstacles, setObstacles] = useState<
    Array<{
      id: number;
      x: number;
      width: number;
      height: number;
    }>
  >([]);
  const [clouds, setClouds] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
    }>
  >([]);
  const [groundOffset, setGroundOffset] = useState(0);

  // 游戏常量 - 更像Google恐龙游戏
  const GRAVITY = 0.6;
  const JUMP_FORCE = -12;
  const GROUND_Y = 150;
  const DINO_SIZE = 40;
  const OBSTACLE_SPEED = 3;
  const CLOUD_SPEED = 0.5;
  const GROUND_SPEED = 2;

  // 跳跃函数
  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;
    setDinoVelocity(JUMP_FORCE);
  }, [gameState.isPlaying, gameState.isGameOver]);

  // 开始游戏
  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      score: 0,
    }));
    setDinoY(0);
    setDinoVelocity(0);
    setObstacles([]);
    setGroundOffset(0);

    // 初始化云朵
    const initialClouds = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      x: Math.random() * 400,
      y: 20 + Math.random() * 60,
      size: 10 + Math.random() * 10,
    }));
    setClouds(initialClouds);
  }, []);

  // 检查碰撞
  const checkCollision = useCallback(
    (
      dinoX: number,
      dinoYPos: number,
      obstaclesList: Array<{
        id: number;
        x: number;
        width: number;
        height: number;
      }>
    ) => {
      const dinoLeft = dinoX;
      const dinoRight = dinoX + DINO_SIZE;
      const dinoTop = dinoYPos;
      const dinoBottom = dinoYPos + DINO_SIZE;

      for (const obstacle of obstaclesList) {
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

    setDinoY((prev) => {
      const newY = prev + dinoVelocity;
      return newY > 0 ? 0 : newY;
    });

    setDinoVelocity((prev) => prev + GRAVITY);

    setObstacles((prev) => {
      const newObstacles = prev
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
        newObstacles.push(newObstacle);
        lastObstacleTimeRef.current = now;
      }

      return newObstacles;
    });

    // 更新云朵
    setClouds((prev) => {
      const newClouds = prev
        .map((cloud) => ({
          ...cloud,
          x: cloud.x - CLOUD_SPEED,
        }))
        .filter((cloud) => cloud.x + cloud.size > 0);

      // 生成新云朵
      if (Math.random() < 0.01) {
        const newCloud = {
          id: Date.now(),
          x: 400,
          y: 20 + Math.random() * 60,
          size: 10 + Math.random() * 10,
        };
        newClouds.push(newCloud);
      }

      return newClouds;
    });

    // 更新地面偏移
    setGroundOffset((prev) => (prev + GROUND_SPEED) % 20);

    setGameState((prev) => {
      const newScore = prev.score + 1;
      return { ...prev, score: newScore };
    });

    // 检查碰撞
    if (checkCollision(50, GROUND_Y - DINO_SIZE - dinoY, obstacles)) {
      setGameState((prev) => ({
        ...prev,
        isGameOver: true,
        isPlaying: false,
        highScore: Math.max(prev.highScore, prev.score),
      }));
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [
    gameState.isPlaying,
    gameState.isGameOver,
    dinoVelocity,
    dinoY,
    obstacles,
    checkCollision,
  ]);

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

    // 绘制云朵
    ctx.fillStyle = "#c0c0c0";
    clouds.forEach((cloud) => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 绘制地面 - 带移动效果
    ctx.fillStyle = "#535353";
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // 绘制地面纹理
    ctx.fillStyle = "#666666";
    for (let x = -groundOffset; x < canvas.width + 20; x += 20) {
      ctx.fillRect(x, GROUND_Y, 10, 2);
    }

    // 绘制恐龙 - 像素风格
    const dinoX = 50;
    const dinoYPos = GROUND_Y - DINO_SIZE - dinoY;

    ctx.fillStyle = "#535353";

    // 恐龙身体
    ctx.fillRect(dinoX + 5, dinoYPos + 10, 25, 20);
    // 恐龙头部
    ctx.fillRect(dinoX + 20, dinoYPos + 5, 15, 15);
    // 恐龙眼睛
    ctx.fillStyle = "#000000";
    ctx.fillRect(dinoX + 25, dinoYPos + 8, 3, 3);
    // 恐龙嘴巴
    ctx.fillStyle = "#535353";
    ctx.fillRect(dinoX + 30, dinoYPos + 12, 8, 3);
    // 恐龙腿
    ctx.fillRect(dinoX + 8, dinoYPos + 25, 6, 8);
    ctx.fillRect(dinoX + 18, dinoYPos + 25, 6, 8);
    // 恐龙尾巴
    ctx.fillRect(dinoX - 5, dinoYPos + 15, 8, 4);

    // 绘制障碍物 - 仙人掌风格
    ctx.fillStyle = "#228B22";
    obstacles.forEach((obstacle) => {
      const cactusX = obstacle.x;
      const cactusY = GROUND_Y - obstacle.height;
      const cactusWidth = obstacle.width;
      const cactusHeight = obstacle.height;

      // 仙人掌主体
      ctx.fillRect(cactusX, cactusY, cactusWidth, cactusHeight);

      // 仙人掌刺
      ctx.fillStyle = "#000000";
      for (let y = cactusY + 5; y < cactusY + cactusHeight - 5; y += 8) {
        for (let x = cactusX + 2; x < cactusX + cactusWidth - 2; x += 4) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // 仙人掌分支
      if (cactusHeight > 30) {
        ctx.fillStyle = "#228B22";
        ctx.fillRect(cactusX - 3, cactusY + cactusHeight * 0.6, 6, 8);
        ctx.fillRect(
          cactusX + cactusWidth - 3,
          cactusY + cactusHeight * 0.4,
          6,
          8
        );
      }

      ctx.fillStyle = "#228B22";
    });

    // 绘制分数
    ctx.fillStyle = "#535353";
    ctx.font = "16px Arial";
    ctx.fillText(`分数: ${gameState.score}`, 10, 30);
    ctx.fillText(`最高分: ${gameState.highScore}`, 10, 50);

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
  }, [dinoY, obstacles, gameState, clouds, groundOffset]);

  // 键盘和触摸事件处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!gameState.isPlaying && !gameState.isGameOver) {
          startGame();
        } else if (gameState.isPlaying) {
          jump();
        } else if (gameState.isGameOver) {
          startGame();
        }
      }
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      if (!gameState.isPlaying && !gameState.isGameOver) {
        startGame();
      } else if (gameState.isPlaying) {
        jump();
      } else if (gameState.isGameOver) {
        startGame();
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      if (!gameState.isPlaying && !gameState.isGameOver) {
        startGame();
      } else if (gameState.isPlaying) {
        jump();
      } else if (gameState.isGameOver) {
        startGame();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("touchstart", handleTouch);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("click", handleClick);
    };
  }, [gameState, startGame, jump]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 网络状态提示 */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-red-600 text-white py-2 px-4 rounded-lg text-center font-medium animate-slide-down">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
              />
            </svg>
            <span>无网络连接 - 玩个游戏等待网络恢复吧！</span>
          </div>
        </div>
      </div>

      {/* 恐龙游戏 - 移动端优化 */}
      <div className="flex flex-col items-center justify-center min-h-screen p-2 sm:p-4 mobile-game-container">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">
            🦕 恐龙游戏
          </h1>
          <p className="text-gray-600 text-center mb-4 text-sm sm:text-base">
            网络断开时，像Google一样玩个游戏吧！
          </p>

          {/* 游戏画布 - 响应式设计 */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                className="border border-gray-300 rounded w-full max-w-sm game-canvas"
              />
              {/* 移动端触摸提示 */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {!gameState.isPlaying && !gameState.isGameOver && (
                  <div className="bg-black/50 text-white px-4 py-2 rounded text-sm">
                    点击屏幕开始
                  </div>
                )}
                {gameState.isPlaying && (
                  <div className="bg-black/50 text-white px-4 py-2 rounded text-sm">
                    点击跳跃
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 游戏控制按钮 - 移动端友好 */}
          <div className="text-center mb-4">
            {!gameState.isPlaying && !gameState.isGameOver && (
              <button
                onClick={startGame}
                className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium text-lg touch-manipulation mobile-button"
              >
                开始游戏
              </button>
            )}

            {gameState.isGameOver && (
              <button
                onClick={startGame}
                className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-8 py-3 rounded-lg font-medium text-lg touch-manipulation mobile-button"
              >
                重新开始
              </button>
            )}
          </div>

          {/* 分数显示 - 移动端优化 */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-center">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-sm text-gray-600">当前分数</div>
              <div className="text-lg font-bold text-gray-800">
                {gameState.score}
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-sm text-gray-600">最高分</div>
              <div className="text-lg font-bold text-gray-800">
                {gameState.highScore}
              </div>
            </div>
          </div>

          {/* 操作说明 - 移动端 */}
          <div className="text-center text-xs text-gray-500 mb-4">
            <p className="hidden sm:block">按空格键或点击屏幕跳跃</p>
            <p className="block sm:hidden">点击屏幕跳跃</p>
          </div>

          {/* 重试网络连接按钮 */}
          <div className="text-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-6 py-2 rounded-lg text-sm touch-manipulation mobile-button"
            >
              重新检查网络连接
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 网络状态钩子
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // 检测慢速连接
    const checkConnectionSpeed = () => {
      const startTime = Date.now();

      // 尝试加载一个小图片来测试连接速度
      const img = new Image();
      img.onload = () => {
        const loadTime = Date.now() - startTime;
        setIsSlowConnection(loadTime > 3000); // 超过3秒认为连接较慢
      };
      img.onerror = () => {
        setIsSlowConnection(true);
      };
      img.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 定期检查连接速度
    const interval = setInterval(checkConnectionSpeed, 30000); // 每30秒检查一次

    checkConnectionSpeed(); // 初始检查

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, isSlowConnection };
}
