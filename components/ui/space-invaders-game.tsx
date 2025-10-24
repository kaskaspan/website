"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface Bullet {
  id: number;
  position: Position;
  isPlayerBullet: boolean;
}

interface Enemy {
  id: number;
  position: Position;
  type: "basic" | "fast" | "strong";
}

interface GameState {
  player: Position;
  enemies: Enemy[];
  bullets: Bullet[];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 20;
const ENEMY_WIDTH = 30;
const ENEMY_HEIGHT = 20;
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 10;

export function SpaceInvadersGame() {
  const [gameState, setGameState] = useState<GameState>({
    player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 40 },
    enemies: [],
    bullets: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    isPaused: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [enemyDirection, setEnemyDirection] = useState(1);
  const [bulletIdCounter, setBulletIdCounter] = useState(0);
  const [enemyIdCounter, setEnemyIdCounter] = useState(0);

  // 生成敌人
  const generateEnemies = useCallback(
    (level: number) => {
      const enemies: Enemy[] = [];
      const rows = Math.min(3 + Math.floor(level / 2), 6);
      const cols = Math.min(8 + Math.floor(level / 3), 12);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const type = row === 0 ? "strong" : row === 1 ? "fast" : "basic";
          enemies.push({
            id: enemyIdCounter + row * cols + col,
            position: {
              x: 50 + col * (ENEMY_WIDTH + 10),
              y: 50 + row * (ENEMY_HEIGHT + 10),
            },
            type,
          });
        }
      }
      setEnemyIdCounter(enemyIdCounter + rows * cols);
      return enemies;
    },
    [enemyIdCounter]
  );

  // 移动敌人
  const moveEnemies = useCallback((enemies: Enemy[], direction: number) => {
    return enemies.map((enemy) => ({
      ...enemy,
      position: {
        x: enemy.position.x + direction * 2,
        y: enemy.position.y,
      },
    }));
  }, []);

  // 检查碰撞
  const checkCollision = useCallback(
    (
      rect1: Position & { width: number; height: number },
      rect2: Position & { width: number; height: number }
    ) => {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    },
    []
  );

  // 游戏循环
  const gameLoop = useCallback(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    setGameState((prevState) => {
      let newEnemies = [...prevState.enemies];
      let newBullets = [...prevState.bullets];
      let newScore = prevState.score;
      let newLives = prevState.lives;
      let newDirection = enemyDirection;
      let newLevel = prevState.level;

      // 移动敌人
      newEnemies = moveEnemies(newEnemies, newDirection);

      // 检查敌人是否到达边界
      const leftmostEnemy = Math.min(...newEnemies.map((e) => e.position.x));
      const rightmostEnemy = Math.max(
        ...newEnemies.map((e) => e.position.x + ENEMY_WIDTH)
      );

      if (leftmostEnemy <= 0 || rightmostEnemy >= CANVAS_WIDTH) {
        newDirection = -newDirection;
        setEnemyDirection(newDirection);
        // 敌人向下移动
        newEnemies = newEnemies.map((enemy) => ({
          ...enemy,
          position: { x: enemy.position.x, y: enemy.position.y + 20 },
        }));
      }

      // 移动子弹
      newBullets = newBullets.map((bullet) => ({
        ...bullet,
        position: {
          x: bullet.position.x,
          y: bullet.position.y + (bullet.isPlayerBullet ? -8 : 8),
        },
      }));

      // 移除超出边界的子弹
      newBullets = newBullets.filter(
        (bullet) => bullet.position.y > 0 && bullet.position.y < CANVAS_HEIGHT
      );

      // 检查子弹碰撞
      newBullets = newBullets.filter((bullet) => {
        if (bullet.isPlayerBullet) {
          // 玩家子弹击中敌人
          const hitEnemyIndex = newEnemies.findIndex((enemy) =>
            checkCollision(
              {
                ...bullet.position,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
              },
              { ...enemy.position, width: ENEMY_WIDTH, height: ENEMY_HEIGHT }
            )
          );

          if (hitEnemyIndex !== -1) {
            const hitEnemy = newEnemies[hitEnemyIndex];
            // 根据敌人类型给予不同分数
            const points =
              hitEnemy.type === "strong"
                ? 30
                : hitEnemy.type === "fast"
                ? 20
                : 10;
            newScore += points;
            newEnemies.splice(hitEnemyIndex, 1);
            return false; // 移除子弹
          }
        } else {
          // 敌人子弹击中玩家
          if (
            checkCollision(
              {
                ...bullet.position,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT,
              },
              {
                ...prevState.player,
                width: PLAYER_WIDTH,
                height: PLAYER_HEIGHT,
              }
            )
          ) {
            newLives--;
            return false; // 移除子弹
          }
        }
        return true;
      });

      // 敌人射击
      if (Math.random() < 0.02) {
        // 2% 概率
        const shootingEnemy =
          newEnemies[Math.floor(Math.random() * newEnemies.length)];
        if (shootingEnemy) {
          newBullets.push({
            id: bulletIdCounter,
            position: {
              x: shootingEnemy.position.x + ENEMY_WIDTH / 2 - BULLET_WIDTH / 2,
              y: shootingEnemy.position.y + ENEMY_HEIGHT,
            },
            isPlayerBullet: false,
          });
          setBulletIdCounter(bulletIdCounter + 1);
        }
      }

      // 检查游戏结束条件
      if (newLives <= 0) {
        setHighScore(Math.max(highScore, newScore));
        if (gameRecorder) {
          gameRecorder.endGame(newScore);
          setGameRecorder(null);
        }
        return { ...prevState, gameOver: true, lives: newLives };
      }

      // 检查是否消灭所有敌人
      if (newEnemies.length === 0) {
        newLevel++;
        newEnemies = generateEnemies(newLevel);
      }

      // 检查敌人是否到达底部
      const enemiesAtBottom = newEnemies.some(
        (enemy) => enemy.position.y >= CANVAS_HEIGHT - 60
      );
      if (enemiesAtBottom) {
        setHighScore(Math.max(highScore, newScore));
        if (gameRecorder) {
          gameRecorder.endGame(newScore);
          setGameRecorder(null);
        }
        return { ...prevState, gameOver: true };
      }

      // 更新自动记录器中的分数
      if (gameRecorder && newScore > prevState.score) {
        gameRecorder.updateScore(newScore);
      }

      return {
        ...prevState,
        enemies: newEnemies,
        bullets: newBullets,
        score: newScore,
        lives: newLives,
        level: newLevel,
      };
    });
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    enemyDirection,
    bulletIdCounter,
    generateEnemies,
    checkCollision,
    gameRecorder,
    highScore,
  ]);

  // 键盘控制
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

      setGameState((prevState) => {
        const newPlayer = { ...prevState.player };

        switch (e.key) {
          case "ArrowLeft":
          case "a":
            newPlayer.x = Math.max(0, newPlayer.x - 10);
            break;
          case "ArrowRight":
          case "d":
            newPlayer.x = Math.min(
              CANVAS_WIDTH - PLAYER_WIDTH,
              newPlayer.x + 10
            );
            break;
          case " ":
            // 发射子弹
            e.preventDefault();
            const newBullet = {
              id: bulletIdCounter,
              position: {
                x: newPlayer.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
                y: newPlayer.y,
              },
              isPlayerBullet: true,
            };
            setBulletIdCounter(bulletIdCounter + 1);
            return {
              ...prevState,
              player: newPlayer,
              bullets: [...prevState.bullets, newBullet],
            };
        }

        return { ...prevState, player: newPlayer };
      });
    },
    [isPlaying, gameState.gameOver, gameState.isPaused, bulletIdCounter]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(gameLoop, 50); // 20 FPS
      return () => clearInterval(interval);
    }
  }, [isPlaying, gameLoop]);

  const startGame = () => {
    const enemies = generateEnemies(1);
    setGameState({
      player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 40 },
      enemies,
      bullets: [],
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      isPaused: false,
    });
    setEnemyDirection(1);
    setBulletIdCounter(0);
    setIsPlaying(true);

    // 开始自动记录
    const recorder = integrateGameWithAutoRecorder(
      "Space Invaders",
      "space-invaders-game"
    );
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
      setGameRecorder(null);
    }
  };

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetGame = () => {
    setGameState({
      player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 40 },
      enemies: [],
      bullets: [],
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      isPaused: false,
    });
    setIsPlaying(false);
  };

  const getEnemyColor = (type: string) => {
    switch (type) {
      case "strong":
        return "bg-red-500";
      case "fast":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🚀 Space Invaders</h2>
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
                  className="relative bg-gradient-to-b from-blue-900 to-purple-900 rounded-lg overflow-hidden"
                  style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                >
                  {/* 玩家 */}
                  <div
                    className="absolute bg-blue-500 rounded-lg"
                    style={{
                      left: gameState.player.x,
                      top: gameState.player.y,
                      width: PLAYER_WIDTH,
                      height: PLAYER_HEIGHT,
                    }}
                  />

                  {/* 敌人 */}
                  {gameState.enemies.map((enemy) => (
                    <div
                      key={enemy.id}
                      className={`absolute rounded-lg ${getEnemyColor(
                        enemy.type
                      )}`}
                      style={{
                        left: enemy.position.x,
                        top: enemy.position.y,
                        width: ENEMY_WIDTH,
                        height: ENEMY_HEIGHT,
                      }}
                    />
                  ))}

                  {/* 子弹 */}
                  {gameState.bullets.map((bullet) => (
                    <div
                      key={bullet.id}
                      className={`absolute rounded ${
                        bullet.isPlayerBullet ? "bg-yellow-400" : "bg-red-400"
                      }`}
                      style={{
                        left: bullet.position.x,
                        top: bullet.position.y,
                        width: BULLET_WIDTH,
                        height: BULLET_HEIGHT,
                      }}
                    />
                  ))}
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
                  等级:{" "}
                  <span className="text-blue-400 font-bold">
                    {gameState.level}
                  </span>
                </div>
                <div>
                  敌人数量:{" "}
                  <span className="text-green-400 font-bold">
                    {gameState.enemies.length}
                  </span>
                </div>
                <div>
                  最高分数:{" "}
                  <span className="text-purple-400 font-bold">{highScore}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                控制说明
              </h3>
              <div className="space-y-1 text-sm text-white/70">
                <div>← → 移动飞船</div>
                <div>空格 发射子弹</div>
                <div>🎯 消灭所有敌人</div>
                <div>🔴 红色敌人: 30分</div>
                <div>🟡 黄色敌人: 20分</div>
                <div>🟢 绿色敌人: 10分</div>
              </div>
            </div>

            {gameState.gameOver && (
              <div className="bg-red-900/50 rounded-lg p-4 border border-red-500/50">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  游戏结束!
                </h3>
                <p className="text-white/80">最终分数: {gameState.score}</p>
                <Button
                  onClick={resetGame}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  重新开始
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
