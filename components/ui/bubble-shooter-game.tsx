"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

// 游戏常量
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const BUBBLE_RADIUS = 20;
const SHOOTER_X = CANVAS_WIDTH / 2;
const SHOOTER_Y = CANVAS_HEIGHT - 50;
const BUBBLE_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#feca57",
  "#ff9ff3",
  "#54a0ff",
];

// 泡泡类型
interface Bubble {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  isActive: boolean;
}

// 子弹类型
interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
}

// 游戏状态
interface GameState {
  bubbles: Bubble[];
  bullets: Bullet[];
  nextBubble: string;
  score: number;
  level: number;
  lives: number;
  gameOver: boolean;
  isPaused: boolean;
  angle: number;
  power: number;
}

export function BubbleShooterGame() {
  const [gameState, setGameState] = useState<GameState>({
    bubbles: [],
    bullets: [],
    nextBubble: BUBBLE_COLORS[0],
    score: 0,
    level: 1,
    lives: 3,
    gameOver: false,
    isPaused: false,
    angle: 0,
    power: 0,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (score: number) => void;
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // 生成随机颜色
  const getRandomColor = useCallback((): string => {
    return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
  }, []);

  // 生成下一行泡泡
  const generateBubbleRow = useCallback(
    (y: number): Bubble[] => {
      const bubbles: Bubble[] = [];
      const cols = Math.floor(CANVAS_WIDTH / (BUBBLE_RADIUS * 2));
      const startX =
        (CANVAS_WIDTH - cols * BUBBLE_RADIUS * 2) / 2 + BUBBLE_RADIUS;

      for (let i = 0; i < cols; i++) {
        bubbles.push({
          id: `bubble-${Date.now()}-${i}`,
          x: startX + i * BUBBLE_RADIUS * 2,
          y: y,
          color: getRandomColor(),
          radius: BUBBLE_RADIUS,
          isActive: true,
        });
      }

      return bubbles;
    },
    [getRandomColor]
  );

  // 初始化游戏
  const initializeGame = useCallback(() => {
    const bubbles: Bubble[] = [];
    const rows = 8;

    for (let row = 0; row < rows; row++) {
      const y = 100 + row * BUBBLE_RADIUS * 2;
      const rowBubbles = generateBubbleRow(y);
      bubbles.push(...rowBubbles);
    }

    return {
      bubbles,
      bullets: [],
      nextBubble: getRandomColor(),
      score: 0,
      level: 1,
      lives: 3,
      gameOver: false,
      isPaused: false,
      angle: 0,
      power: 0,
    };
  }, [generateBubbleRow, getRandomColor]);

  // 计算两点间距离
  const distance = useCallback(
    (x1: number, y1: number, x2: number, y2: number): number => {
      return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    },
    []
  );

  // 检查碰撞
  const checkCollision = useCallback(
    (bullet: Bullet, bubble: Bubble): boolean => {
      return (
        distance(bullet.x, bullet.y, bubble.x, bubble.y) <
        bullet.radius + bubble.radius
      );
    },
    [distance]
  );

  // 找到相同颜色的泡泡组
  const findMatchingBubbles = useCallback(
    (startBubble: Bubble, allBubbles: Bubble[]): Bubble[] => {
      const visited = new Set<string>();
      const matching: Bubble[] = [];
      const queue: Bubble[] = [startBubble];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id)) continue;

        visited.add(current.id);
        matching.push(current);

        // 检查相邻的泡泡
        for (const bubble of allBubbles) {
          if (!visited.has(bubble.id) && bubble.isActive) {
            const dist = distance(current.x, current.y, bubble.x, bubble.y);
            if (dist <= BUBBLE_RADIUS * 2.1 && bubble.color === current.color) {
              queue.push(bubble);
            }
          }
        }
      }

      return matching;
    },
    [distance]
  );

  // 移除悬空的泡泡
  const removeFloatingBubbles = useCallback(
    (bubbles: Bubble[]): Bubble[] => {
      const connected = new Set<string>();
      const queue: Bubble[] = [];

      // 找到所有连接到顶部的泡泡
      const topBubbles = bubbles.filter(
        (b) => b.y <= 100 + BUBBLE_RADIUS && b.isActive
      );
      queue.push(...topBubbles);

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (connected.has(current.id)) continue;

        connected.add(current.id);

        // 检查相邻的泡泡
        for (const bubble of bubbles) {
          if (!connected.has(bubble.id) && bubble.isActive) {
            const dist = distance(current.x, current.y, bubble.x, bubble.y);
            if (dist <= BUBBLE_RADIUS * 2.1) {
              queue.push(bubble);
            }
          }
        }
      }

      // 移除未连接的泡泡
      return bubbles.map((bubble) => ({
        ...bubble,
        isActive: connected.has(bubble.id),
      }));
    },
    [distance]
  );

  // 发射子弹
  const shootBullet = useCallback(() => {
    if (gameState.gameOver || gameState.isPaused) return;

    const angle = gameState.angle;
    const speed = 8;
    const vx = Math.sin(angle) * speed;
    const vy = -Math.cos(angle) * speed;

    const bullet: Bullet = {
      id: `bullet-${Date.now()}`,
      x: SHOOTER_X,
      y: SHOOTER_Y,
      vx,
      vy,
      color: gameState.nextBubble,
      radius: BUBBLE_RADIUS,
    };

    setGameState((prev) => ({
      ...prev,
      bullets: [...prev.bullets, bullet],
      nextBubble: getRandomColor(),
    }));
  }, [gameState, getRandomColor]);

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = () => {
      setGameState((prev) => {
        // 移动子弹
        const newBullets = prev.bullets
          .map((bullet) => ({
            ...bullet,
            x: bullet.x + bullet.vx,
            y: bullet.y + bullet.vy,
          }))
          .filter(
            (bullet) =>
              bullet.x > -BUBBLE_RADIUS &&
              bullet.x < CANVAS_WIDTH + BUBBLE_RADIUS &&
              bullet.y > -BUBBLE_RADIUS
          );

        // 检查子弹与泡泡碰撞
        let newBubbles = [...prev.bubbles];
        let newScore = prev.score;
        let newLives = prev.lives;
        const finalBullets = [...newBullets];

        for (let i = finalBullets.length - 1; i >= 0; i--) {
          const bullet = finalBullets[i];
          let hit = false;

          for (let j = 0; j < newBubbles.length; j++) {
            const bubble = newBubbles[j];
            if (bubble.isActive && checkCollision(bullet, bubble)) {
              // 碰撞发生
              finalBullets.splice(i, 1);
              hit = true;

              // 创建新泡泡
              const newBubble: Bubble = {
                id: `bubble-${Date.now()}-${j}`,
                x: bullet.x,
                y: bullet.y,
                color: bullet.color,
                radius: BUBBLE_RADIUS,
                isActive: true,
              };
              newBubbles.push(newBubble);

              // 找到匹配的泡泡组
              const matchingBubbles = findMatchingBubbles(
                newBubble,
                newBubbles
              );

              if (matchingBubbles.length >= 3) {
                // 移除匹配的泡泡
                newBubbles = newBubbles.map((bubble) => ({
                  ...bubble,
                  isActive: !matchingBubbles.some((m) => m.id === bubble.id),
                }));

                // 移除悬空的泡泡
                newBubbles = removeFloatingBubbles(newBubbles);

                // 更新分数
                newScore += matchingBubbles.length * 10;
              }
              break;
            }
          }

          // 检查子弹是否击中顶部
          if (!hit && bullet.y <= 100) {
            finalBullets.splice(i, 1);
            newLives -= 1;
          }
        }

        // 检查游戏结束
        const gameOver = newLives <= 0;
        if (!gameOver) {
          // 检查是否还有泡泡
          const activeBubbles = newBubbles.filter((bubble) => bubble.isActive);
          if (activeBubbles.length === 0) {
            // 进入下一关
            // const newLevel = prev.level + 1;
            const newBubbles = [];
            for (let row = 0; row < 8; row++) {
              const y = 100 + row * BUBBLE_RADIUS * 2;
              const rowBubbles = generateBubbleRow(y);
              newBubbles.push(...rowBubbles);
            }
            newBubbles.push(...newBubbles);
            newScore += 1000; // 关卡奖励
          }
        }

        // 更新自动记录器
        if (gameRecorder && newScore !== prev.score) {
          gameRecorder.updateScore(newScore);
        }

        return {
          ...prev,
          bubbles: newBubbles,
          bullets: finalBullets,
          score: newScore,
          lives: newLives,
          gameOver,
        };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    checkCollision,
    findMatchingBubbles,
    removeFloatingBubbles,
    generateBubbleRow,
    gameRecorder,
  ]);

  // 鼠标控制
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameState.gameOver || gameState.isPaused) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const angle = Math.atan2(mouseX - SHOOTER_X, mouseY - SHOOTER_Y);

      setGameState((prev) => ({
        ...prev,
        angle,
      }));
    },
    [gameState.gameOver, gameState.isPaused]
  );

  const handleMouseClick = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameState.gameOver || gameState.isPaused) return;
      shootBullet();
    },
    [gameState.gameOver, gameState.isPaused, shootBullet]
  );

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameOver || !isPlaying) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          shootBullet();
          break;
        case "p":
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState.gameOver, isPlaying, shootBullet]);

  // 重置游戏
  const resetGame = useCallback(() => {
    const newGameState = initializeGame();
    setGameState(newGameState);
    setIsPlaying(false);
  }, [initializeGame]);

  // 开始游戏
  const startGame = useCallback(() => {
    const newGameState = initializeGame();
    setGameState(newGameState);
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Bubble Shooter",
      "bubble-shooter-game"
    );
    setGameRecorder(recorder);
  }, [initializeGame]);

  // 结束游戏
  const endGame = useCallback(() => {
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
    setIsPlaying(false);
  }, [gameRecorder, gameState.score]);

  // 渲染游戏
  const renderGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制背景
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制泡泡
    gameState.bubbles.forEach((bubble) => {
      if (bubble.isActive) {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = bubble.color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // 绘制子弹
    gameState.bullets.forEach((bullet) => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fillStyle = bullet.color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 绘制发射器
    ctx.fillStyle = "#333";
    ctx.fillRect(SHOOTER_X - 30, SHOOTER_Y - 10, 60, 20);

    // 绘制瞄准线
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SHOOTER_X, SHOOTER_Y);
    ctx.lineTo(
      SHOOTER_X + Math.sin(gameState.angle) * 100,
      SHOOTER_Y + Math.cos(gameState.angle) * 100
    );
    ctx.stroke();

    // 绘制下一个泡泡
    ctx.beginPath();
    ctx.arc(SHOOTER_X, SHOOTER_Y - 30, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gameState.nextBubble;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [gameState]);

  // 渲染游戏
  useEffect(() => {
    renderGame();
  }, [renderGame]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🫧 Bubble Shooter
          </h2>
          <p className="text-white/70">
            Shoot bubbles to match colors and clear the board!
          </p>
        </div>

        {/* 游戏信息 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Score: {gameState.score}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Level: {gameState.level}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Lives: {gameState.lives}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Bubbles: {gameState.bubbles.filter((b) => b.isActive).length}
            </div>
          </div>
        </div>

        {/* 游戏画布 */}
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-white/30 rounded-lg cursor-crosshair"
            onMouseMove={handleMouseMove}
            onClick={handleMouseClick}
          />
        </div>

        {/* 游戏结束 */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              💥 Game Over!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">Level Reached: {gameState.level}</p>
          </div>
        )}

        {/* 控制按钮 */}
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
              <Button
                onClick={endGame}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                End Game
              </Button>
            </>
          )}
        </div>

        {/* 游戏说明 */}
        <div className="mt-6 text-center text-white/70 text-sm">
          <p>
            Move mouse to aim, click or press space to shoot. Match 3+ bubbles
            to clear them!
          </p>
        </div>
      </Card>
    </div>
  );
}
