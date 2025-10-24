"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface Brick {
  position: Position;
  width: number;
  height: number;
  color: string;
  points: number;
  destroyed: boolean;
}

interface Ball {
  position: Position;
  velocity: Position;
  radius: number;
}

interface Paddle {
  position: Position;
  width: number;
  height: number;
}

interface GameState {
  paddle: Paddle;
  ball: Ball;
  bricks: Brick[];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
  gameWon: boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const BRICK_ROWS = 6;
const BRICK_COLS = 10;
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 18;
const BRICK_SPACING = 3;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 6;
const BALL_SPEED = 4;

const DIFFICULTY_LEVELS = {
  easy: {
    ballSpeed: 3,
    paddleSpeed: 6,
    name: "Easy",
    lives: 5,
  },
  medium: {
    ballSpeed: 4,
    paddleSpeed: 5,
    name: "Medium",
    lives: 3,
  },
  hard: {
    ballSpeed: 5,
    paddleSpeed: 4,
    name: "Hard",
    lives: 2,
  },
  expert: {
    ballSpeed: 6,
    paddleSpeed: 3,
    name: "Expert",
    lives: 1,
  },
};

const BRICK_COLORS = [
  "#ff6b6b", // 红色
  "#4ecdc4", // 青色
  "#45b7d1", // 蓝色
  "#96ceb4", // 绿色
  "#feca57", // 黄色
  "#ff9ff3", // 粉色
  "#54a0ff", // 蓝色
  "#5f27cd", // 紫色
];

export function BreakoutGame() {
  const [gameState, setGameState] = useState<GameState>({
    paddle: {
      position: {
        x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
        y: CANVAS_HEIGHT - 40,
      },
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    },
    ball: {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: { x: BALL_SPEED, y: -BALL_SPEED },
      radius: BALL_RADIUS,
    },
    bricks: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    isPaused: false,
    gameWon: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);
  const [difficulty, setDifficulty] =
    useState<keyof typeof DIFFICULTY_LEVELS>("medium");
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // 生成砖块
  const generateBricks = useCallback((): Brick[] => {
    const bricks: Brick[] = [];
    const startX =
      (CANVAS_WIDTH -
        (BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_SPACING)) /
      2;
    const startY = 80;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          position: {
            x: startX + col * (BRICK_WIDTH + BRICK_SPACING),
            y: startY + row * (BRICK_HEIGHT + BRICK_SPACING),
          },
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: BRICK_COLORS[row],
          points: (BRICK_ROWS - row) * 10,
          destroyed: false,
        });
      }
    }
    return bricks;
  }, []);

  // 检查碰撞
  const checkCollision = useCallback(
    (
      ball: Ball,
      rect: { position: Position; width: number; height: number }
    ) => {
      return (
        ball.position.x + ball.radius > rect.position.x &&
        ball.position.x - ball.radius < rect.position.x + rect.width &&
        ball.position.y + ball.radius > rect.position.y &&
        ball.position.y - ball.radius < rect.position.y + rect.height
      );
    },
    []
  );

  // 重置球的位置
  const resetBall = useCallback(() => {
    return {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: { x: BALL_SPEED, y: -BALL_SPEED },
      radius: BALL_RADIUS,
    };
  }, []);

  // 游戏循环
  const gameLoop = useCallback(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    setGameState((prevState) => {
      // 更新球的位置
      const newBall = {
        ...prevState.ball,
        position: {
          x: prevState.ball.position.x + prevState.ball.velocity.x,
          y: prevState.ball.position.y + prevState.ball.velocity.y,
        },
      };

      // 检查墙壁碰撞
      if (
        newBall.position.x <= newBall.radius ||
        newBall.position.x >= CANVAS_WIDTH - newBall.radius
      ) {
        newBall.velocity.x = -newBall.velocity.x;
      }
      if (newBall.position.y <= newBall.radius) {
        newBall.velocity.y = -newBall.velocity.y;
      }

      // 检查球是否掉出底部
      if (newBall.position.y >= CANVAS_HEIGHT) {
        const newLives = prevState.lives - 1;
        setCombo(0); // 重置连击
        if (newLives <= 0) {
          // 游戏结束
          setHighScore(Math.max(highScore, prevState.score));
          if (gameRecorder) {
            gameRecorder.endGame(prevState.score);
            setGameRecorder(null);
          }
          return { ...prevState, gameOver: true, lives: newLives };
        }
        return { ...prevState, ball: resetBall(), lives: newLives };
      }

      // 检查球拍碰撞
      if (checkCollision(newBall, prevState.paddle)) {
        const paddleCenter =
          prevState.paddle.position.x + prevState.paddle.width / 2;
        const ballCenter = newBall.position.x;
        const relativePosition =
          (ballCenter - paddleCenter) / (prevState.paddle.width / 2);
        const angle = (relativePosition * Math.PI) / 3; // 最大60度角

        newBall.velocity.x = Math.sin(angle) * BALL_SPEED;
        newBall.velocity.y = -Math.abs(Math.cos(angle) * BALL_SPEED);
      }

      // 检查砖块碰撞
      const newBricks = [...prevState.bricks];
      let newScore = prevState.score;
      let bricksDestroyed = 0;

      newBricks.forEach((brick, index) => {
        if (!brick.destroyed && checkCollision(newBall, brick)) {
          newBricks[index] = { ...brick, destroyed: true };

          // 连击系统
          const newCombo = combo + 1;
          const comboMultiplier = Math.floor(newCombo / 5) + 1; // 每5个砖块连击增加倍数
          const difficultyMultiplier =
            DIFFICULTY_LEVELS[difficulty].name === "Expert"
              ? 3
              : DIFFICULTY_LEVELS[difficulty].name === "Hard"
              ? 2
              : 1;

          newScore += brick.points * comboMultiplier * difficultyMultiplier;
          bricksDestroyed++;

          setCombo(newCombo);
          setMaxCombo(Math.max(maxCombo, newCombo));

          // 反弹球
          const brickCenterX = brick.position.x + brick.width / 2;
          const ballCenterX = newBall.position.x;

          if (ballCenterX < brickCenterX) {
            newBall.velocity.x = -Math.abs(newBall.velocity.x);
          } else {
            newBall.velocity.x = Math.abs(newBall.velocity.x);
          }
          newBall.velocity.y = -newBall.velocity.y;
        }
      });

      // 更新自动记录器中的分数
      if (gameRecorder && bricksDestroyed > 0) {
        gameRecorder.updateScore(newScore);
      }

      // 检查是否所有砖块都被摧毁
      const remainingBricks = newBricks.filter((brick) => !brick.destroyed);
      if (remainingBricks.length === 0) {
        // 游戏胜利
        if (gameRecorder) {
          gameRecorder.endGame(newScore);
          setGameRecorder(null);
        }
        return {
          ...prevState,
          gameWon: true,
          bricks: newBricks,
          score: newScore,
        };
      }

      return {
        ...prevState,
        ball: newBall,
        bricks: newBricks,
        score: newScore,
      };
    });
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    gameRecorder,
    checkCollision,
    resetBall,
  ]);

  // 鼠标控制
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPlaying || gameState.gameOver) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const paddleX = Math.max(
        0,
        Math.min(CANVAS_WIDTH - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2)
      );

      setGameState((prevState) => ({
        ...prevState,
        paddle: {
          ...prevState.paddle,
          position: { ...prevState.paddle.position, x: paddleX },
        },
      }));
    },
    [isPlaying, gameState.gameOver]
  );

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(gameLoop, 16); // 60 FPS
      return () => clearInterval(interval);
    }
  }, [isPlaying, gameLoop]);

  const startGame = () => {
    const currentDifficulty = DIFFICULTY_LEVELS[difficulty];
    setGameState({
      paddle: {
        position: {
          x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
          y: CANVAS_HEIGHT - 30,
        },
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
      },
      ball: resetBall(),
      bricks: generateBricks(),
      score: 0,
      lives: currentDifficulty.lives,
      level: 1,
      gameOver: false,
      isPaused: false,
      gameWon: false,
    });
    setCombo(0);
    setMaxCombo(0);
    setIsPlaying(true);

    // 开始自动记录
    const recorder = integrateGameWithAutoRecorder("Breakout", "breakout-game");
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);

    // 结束自动记录
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
      setGameRecorder(null);
    }
  };

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">💥 Breakout</h2>
          <div className="flex gap-2">
            {!isPlaying ? (
              <Button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                开始游戏
              </Button>
            ) : (
              <>
                <Button
                  onClick={togglePause}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {gameState.isPaused ? "继续" : "暂停"}
                </Button>
                <Button
                  onClick={stopGame}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  结束
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 游戏画布 */}
          <div className="lg:col-span-3">
            <div className="bg-black/50 rounded-lg p-4 border border-white/20">
              <div className="flex justify-center">
                <div
                  className="relative bg-gradient-to-b from-blue-900 to-purple-900 rounded-lg overflow-hidden cursor-none"
                  style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                  onMouseMove={handleMouseMove}
                >
                  {/* 砖块 */}
                  {gameState.bricks.map((brick, index) =>
                    !brick.destroyed ? (
                      <div
                        key={index}
                        className="absolute rounded-sm border border-white/20"
                        style={{
                          left: brick.position.x,
                          top: brick.position.y,
                          width: brick.width,
                          height: brick.height,
                          backgroundColor: brick.color,
                        }}
                      />
                    ) : null
                  )}

                  {/* 球拍 */}
                  <div
                    className="absolute bg-white rounded-lg border-2 border-gray-300 shadow-lg"
                    style={{
                      left: gameState.paddle.position.x,
                      top: gameState.paddle.position.y,
                      width: gameState.paddle.width,
                      height: gameState.paddle.height,
                    }}
                  />

                  {/* 球 */}
                  <div
                    className="absolute bg-yellow-400 rounded-full"
                    style={{
                      left: gameState.ball.position.x - gameState.ball.radius,
                      top: gameState.ball.position.y - gameState.ball.radius,
                      width: gameState.ball.radius * 2,
                      height: gameState.ball.radius * 2,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 游戏信息 */}
          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                游戏信息
              </h3>
              <div className="space-y-2 text-white/80">
                <div>
                  分数:{" "}
                  <span className="text-yellow-400 font-bold">
                    {gameState.score}
                  </span>
                </div>
                <div>
                  生命:{" "}
                  <span className="text-red-400 font-bold">
                    {gameState.lives}
                  </span>
                </div>
                <div>
                  连击:{" "}
                  <span className="text-purple-400 font-bold">{combo}</span>
                </div>
                <div>
                  最高连击:{" "}
                  <span className="text-orange-400 font-bold">{maxCombo}</span>
                </div>
                <div>
                  最高分数:{" "}
                  <span className="text-green-400 font-bold">{highScore}</span>
                </div>
                <div>
                  剩余砖块:{" "}
                  <span className="text-blue-400 font-bold">
                    {
                      gameState.bricks.filter((brick) => !brick.destroyed)
                        .length
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                控制说明
              </h3>
              <div className="space-y-1 text-sm text-white/70">
                <div>🖱️ 鼠标移动控制球拍</div>
                <div>🎯 目标: 摧毁所有砖块</div>
                <div>⚡ 不同颜色砖块有不同分数</div>
                <div>🔥 连击获得额外分数</div>
                <div>💀 球掉下去会失去生命</div>
              </div>
            </div>

            {!isPlaying && !gameState.gameOver && (
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  选择难度
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                    <Button
                      key={key}
                      onClick={() =>
                        setDifficulty(key as keyof typeof DIFFICULTY_LEVELS)
                      }
                      className={`text-xs ${
                        difficulty === key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      {level.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {gameState.gameOver && (
              <div className="bg-red-900/50 rounded-lg p-4 border border-red-500/50">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  游戏结束!
                </h3>
                <p className="text-white/80">最终分数: {gameState.score}</p>
              </div>
            )}

            {gameState.gameWon && (
              <div className="bg-green-900/50 rounded-lg p-4 border border-green-500/50">
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  恭喜通关!
                </h3>
                <p className="text-white/80">最终分数: {gameState.score}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
