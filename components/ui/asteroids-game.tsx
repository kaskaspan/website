"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const GAME_WIDTH = 400;
const GAME_HEIGHT = 300;
const SHIP_SIZE = 20;
const ASTEROID_SIZE = 30;
const BULLET_SIZE = 4;
const BULLET_SPEED = 5;
const SHIP_SPEED = 2;
const ROTATION_SPEED = 0.1;

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

interface Ship {
  position: Position;
  velocity: Velocity;
  angle: number;
  thrust: boolean;
}

interface Asteroid {
  id: number;
  position: Position;
  velocity: Velocity;
  size: "large" | "medium" | "small";
  rotation: number;
  rotationSpeed: number;
}

interface Bullet {
  id: number;
  position: Position;
  velocity: Velocity;
  life: number;
}

interface GameState {
  ship: Ship;
  asteroids: Asteroid[];
  bullets: Bullet[];
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
  invulnerable: number;
}

const ASTEROID_SIZES = {
  large: { size: 40, points: 20, children: 2 },
  medium: { size: 25, points: 50, children: 2 },
  small: { size: 15, points: 100, children: 0 },
};

export function AsteroidsGame() {
  const [gameState, setGameState] = useState<GameState>({
    ship: {
      position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
      velocity: { x: 0, y: 0 },
      angle: 0,
      thrust: false,
    },
    asteroids: [],
    bullets: [],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    isPaused: false,
    invulnerable: 0,
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

  // 生成小行星
  const generateAsteroid = useCallback(
    (size: "large" | "medium" | "small" = "large"): Asteroid => {
      const side = Math.floor(Math.random() * 4);
      let position: Position;

      switch (side) {
        case 0: // 上边
          position = { x: Math.random() * GAME_WIDTH, y: -ASTEROID_SIZE };
          break;
        case 1: // 右边
          position = {
            x: GAME_WIDTH + ASTEROID_SIZE,
            y: Math.random() * GAME_HEIGHT,
          };
          break;
        case 2: // 下边
          position = {
            x: Math.random() * GAME_WIDTH,
            y: GAME_HEIGHT + ASTEROID_SIZE,
          };
          break;
        default: // 左边
          position = { x: -ASTEROID_SIZE, y: Math.random() * GAME_HEIGHT };
          break;
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;

      return {
        id: Date.now() + Math.random(),
        position,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      };
    },
    []
  );

  // 生成关卡小行星
  const generateLevelAsteroids = useCallback(
    (level: number): Asteroid[] => {
      const asteroids: Asteroid[] = [];
      const count = 4 + level;

      for (let i = 0; i < count; i++) {
        asteroids.push(generateAsteroid("large"));
      }

      return asteroids;
    },
    [generateAsteroid]
  );

  // 检查碰撞
  const checkCollision = useCallback(
    (
      pos1: Position,
      pos2: Position,
      radius1: number,
      radius2: number
    ): boolean => {
      const dx = pos1.x - pos2.x;
      const dy = pos1.y - pos2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < radius1 + radius2;
    },
    []
  );

  // 分割小行星
  const splitAsteroid = useCallback((asteroid: Asteroid): Asteroid[] => {
    if (asteroid.size === "small") return [];

    const newSize = asteroid.size === "large" ? "medium" : "small";
    const children = ASTEROID_SIZES[asteroid.size].children;
    const newAsteroids: Asteroid[] = [];

    for (let i = 0; i < children; i++) {
      const angle = (Math.PI * 2 * i) / children + Math.random() * 0.5;
      const speed = 1 + Math.random() * 2;

      newAsteroids.push({
        id: Date.now() + Math.random() + i,
        position: { ...asteroid.position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        size: newSize,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      });
    }

    return newAsteroids;
  }, []);

  // 发射子弹
  const shootBullet = useCallback(() => {
    setGameState((prev) => {
      if (prev.bullets.length >= 10) return prev; // 限制子弹数量

      const bullet: Bullet = {
        id: Date.now() + Math.random(),
        position: { ...prev.ship.position },
        velocity: {
          x: Math.cos(prev.ship.angle) * BULLET_SPEED,
          y: Math.sin(prev.ship.angle) * BULLET_SPEED,
        },
        life: 60, // 1秒生命周期
      };

      return {
        ...prev,
        bullets: [...prev.bullets, bullet],
      };
    });
  }, []);

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        // 移动飞船
        const newShip = { ...prev.ship };

        if (keys.has("ArrowLeft") || keys.has("a")) {
          newShip.angle -= ROTATION_SPEED;
        }
        if (keys.has("ArrowRight") || keys.has("d")) {
          newShip.angle += ROTATION_SPEED;
        }
        if (keys.has("ArrowUp") || keys.has("w")) {
          newShip.thrust = true;
          newShip.velocity.x += Math.cos(newShip.angle) * 0.1;
          newShip.velocity.y += Math.sin(newShip.angle) * 0.1;
        } else {
          newShip.thrust = false;
        }

        // 应用摩擦力
        newShip.velocity.x *= 0.99;
        newShip.velocity.y *= 0.99;

        // 限制速度
        const maxSpeed = 3;
        const speed = Math.sqrt(
          newShip.velocity.x ** 2 + newShip.velocity.y ** 2
        );
        if (speed > maxSpeed) {
          newShip.velocity.x = (newShip.velocity.x / speed) * maxSpeed;
          newShip.velocity.y = (newShip.velocity.y / speed) * maxSpeed;
        }

        // 更新位置
        newShip.position.x += newShip.velocity.x;
        newShip.position.y += newShip.velocity.y;

        // 边界检查（环绕）
        if (newShip.position.x < 0) newShip.position.x = GAME_WIDTH;
        if (newShip.position.x > GAME_WIDTH) newShip.position.x = 0;
        if (newShip.position.y < 0) newShip.position.y = GAME_HEIGHT;
        if (newShip.position.y > GAME_HEIGHT) newShip.position.y = 0;

        // 移动小行星
        const newAsteroids = prev.asteroids
          .map((asteroid) => ({
            ...asteroid,
            position: {
              x: asteroid.position.x + asteroid.velocity.x,
              y: asteroid.position.y + asteroid.velocity.y,
            },
            rotation: asteroid.rotation + asteroid.rotationSpeed,
          }))
          .filter(
            (asteroid) =>
              asteroid.position.x > -ASTEROID_SIZE &&
              asteroid.position.x < GAME_WIDTH + ASTEROID_SIZE &&
              asteroid.position.y > -ASTEROID_SIZE &&
              asteroid.position.y < GAME_HEIGHT + ASTEROID_SIZE
          );

        // 移动子弹
        const newBullets = prev.bullets
          .map((bullet) => ({
            ...bullet,
            position: {
              x: bullet.position.x + bullet.velocity.x,
              y: bullet.position.y + bullet.velocity.y,
            },
            life: bullet.life - 1,
          }))
          .filter((bullet) => bullet.life > 0);

        // 检查子弹与小行星碰撞
        let finalAsteroids = [...newAsteroids];
        const finalBullets = [...newBullets];
        let newScore = prev.score;

        for (let i = finalBullets.length - 1; i >= 0; i--) {
          const bullet = finalBullets[i];
          for (let j = finalAsteroids.length - 1; j >= 0; j--) {
            const asteroid = finalAsteroids[j];
            if (
              checkCollision(
                bullet.position,
                asteroid.position,
                BULLET_SIZE,
                ASTEROID_SIZES[asteroid.size].size / 2
              )
            ) {
              // 碰撞发生
              newScore += ASTEROID_SIZES[asteroid.size].points;
              finalBullets.splice(i, 1);
              finalAsteroids.splice(j, 1);

              // 分割小行星
              const newAsteroids = splitAsteroid(asteroid);
              finalAsteroids.push(...newAsteroids);
              break;
            }
          }
        }

        // 检查飞船与小行星碰撞
        let newLives = prev.lives;
        let gameOver = prev.gameOver;
        let newInvulnerable = prev.invulnerable;

        if (newInvulnerable <= 0) {
          for (const asteroid of finalAsteroids) {
            if (
              checkCollision(
                newShip.position,
                asteroid.position,
                SHIP_SIZE / 2,
                ASTEROID_SIZES[asteroid.size].size / 2
              )
            ) {
              newLives -= 1;
              newInvulnerable = 120; // 2秒无敌时间
              if (newLives <= 0) {
                gameOver = true;
              }
              break;
            }
          }
        } else {
          newInvulnerable -= 1;
        }

        // 检查关卡完成
        let newLevel = prev.level;
        if (finalAsteroids.length === 0) {
          newLevel += 1;
          finalAsteroids = generateLevelAsteroids(newLevel);
        }

        // 更新自动记录器
        if (gameRecorder) {
          gameRecorder.updateScore(newScore);
        }

        return {
          ...prev,
          ship: newShip,
          asteroids: finalAsteroids,
          bullets: finalBullets,
          score: newScore,
          lives: newLives,
          level: newLevel,
          gameOver,
          invulnerable: newInvulnerable,
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
    splitAsteroid,
    generateLevelAsteroids,
    gameRecorder,
  ]);

  // 键盘控制
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.toLowerCase();
      setKeys((prev) => new Set(prev).add(key));

      if (key === " " || key === "enter") {
        shootBullet();
      }
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
  }, [isPlaying, shootBullet]);

  const startGame = () => {
    setGameState({
      ship: {
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
        velocity: { x: 0, y: 0 },
        angle: 0,
        thrust: false,
      },
      asteroids: generateLevelAsteroids(1),
      bullets: [],
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      isPaused: false,
      invulnerable: 0,
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Asteroids Game",
      "asteroids-game"
    );
    setGameRecorder(recorder);
  };

  const resetGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-6 bg-gradient-to-br from-black via-gray-900 to-blue-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🪨 Asteroids Game
          </h2>
          <p className="text-white/70">
            Destroy all asteroids! Use arrow keys to move and space to shoot.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Lives: {gameState.lives}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Level: {gameState.level}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">High Score: {highScore}</div>
          </div>
        </div>

        {/* 游戏区域 */}
        <div
          className="relative mx-auto mb-6 bg-black border-2 border-white/30 rounded-lg overflow-hidden"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* 背景星星 */}
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                left: Math.random() * GAME_WIDTH,
                top: Math.random() * GAME_HEIGHT,
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
              }}
            />
          ))}

          {/* 飞船 */}
          <div
            className={`absolute ${
              gameState.invulnerable > 0 ? "opacity-50" : "opacity-100"
            }`}
            style={{
              left: gameState.ship.position.x - SHIP_SIZE / 2,
              top: gameState.ship.position.y - SHIP_SIZE / 2,
              width: SHIP_SIZE,
              height: SHIP_SIZE,
              transform: `rotate(${gameState.ship.angle}rad)`,
            }}
          >
            <div className="w-full h-full bg-white border-2 border-white rounded-sm">
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                🚀
              </div>
            </div>
          </div>

          {/* 小行星 */}
          {gameState.asteroids.map((asteroid) => (
            <div
              key={asteroid.id}
              className="absolute bg-gray-600 rounded-full"
              style={{
                left:
                  asteroid.position.x - ASTEROID_SIZES[asteroid.size].size / 2,
                top:
                  asteroid.position.y - ASTEROID_SIZES[asteroid.size].size / 2,
                width: ASTEROID_SIZES[asteroid.size].size,
                height: ASTEROID_SIZES[asteroid.size].size,
                transform: `rotate(${asteroid.rotation}rad)`,
              }}
            >
              <div className="w-full h-full bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                🪨
              </div>
            </div>
          ))}

          {/* 子弹 */}
          {gameState.bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute bg-yellow-400 rounded-full"
              style={{
                left: bullet.position.x - BULLET_SIZE / 2,
                top: bullet.position.y - BULLET_SIZE / 2,
                width: BULLET_SIZE,
                height: BULLET_SIZE,
              }}
            />
          ))}
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              💥 Game Over!
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
          <p>🎮 Arrow keys to rotate and thrust, Space to shoot</p>
          <p>⏸️ Press P to pause</p>
          <p>🪨 Destroy all asteroids to advance to next level</p>
          <p>💥 Avoid collisions with asteroids</p>
          <p>🔄 Screen wraps around edges</p>
        </div>
      </Card>
    </div>
  );
}
