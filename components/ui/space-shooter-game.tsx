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
  velocity: Position;
  type: "player" | "enemy";
  damage: number;
}

interface Enemy {
  id: number;
  position: Position;
  velocity: Position;
  health: number;
  maxHealth: number;
  type: "basic" | "fast" | "heavy" | "boss";
  points: number;
  lastShot: number;
}

interface PowerUp {
  id: number;
  position: Position;
  type: "health" | "weapon" | "shield" | "multiShot";
  value: number;
}

interface GameState {
  player: {
    position: Position;
    health: number;
    maxHealth: number;
    shield: number;
    weapon: "single" | "double" | "triple";
    score: number;
    level: number;
  };
  bullets: Bullet[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  gameOver: boolean;
  isPaused: boolean;
  wave: number;
  enemiesKilled: number;
  combo: number;
  maxCombo: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const ENEMY_SPEED = 2;

const DIFFICULTY_LEVELS = {
  easy: { enemySpawnRate: 0.02, enemyHealth: 1, name: "Easy" },
  medium: { enemySpawnRate: 0.03, enemyHealth: 2, name: "Medium" },
  hard: { enemySpawnRate: 0.05, enemyHealth: 3, name: "Hard" },
  expert: { enemySpawnRate: 0.08, enemyHealth: 5, name: "Expert" },
};

export function SpaceShooterGame() {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50 },
      health: 100,
      maxHealth: 100,
      shield: 0,
      weapon: "single",
      score: 0,
      level: 1,
    },
    bullets: [],
    enemies: [],
    powerUps: [],
    gameOver: false,
    isPaused: false,
    wave: 1,
    enemiesKilled: 0,
    combo: 0,
    maxCombo: 0,
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
  const [keys, setKeys] = useState<Set<string>>(new Set());

  // 生成敌人
  const generateEnemy = useCallback((): Enemy => {
    const types: ("basic" | "fast" | "heavy")[] = ["basic", "fast", "heavy"];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const enemyConfig = {
      basic: { health: 1, points: 10, velocity: { x: 0, y: ENEMY_SPEED } },
      fast: { health: 1, points: 20, velocity: { x: 0, y: ENEMY_SPEED * 1.5 } },
      heavy: {
        health: 3,
        points: 30,
        velocity: { x: 0, y: ENEMY_SPEED * 0.7 },
      },
    };

    const config = enemyConfig[randomType];

    return {
      id: Date.now() + Math.random(),
      position: { x: Math.random() * (GAME_WIDTH - 40), y: -40 },
      velocity: config.velocity,
      health: config.health,
      maxHealth: config.health,
      type: randomType,
      points: config.points,
      lastShot: 0,
    };
  }, []);

  // 生成道具
  const generatePowerUp = useCallback((position: Position): PowerUp => {
    const types: PowerUp["type"][] = [
      "health",
      "weapon",
      "shield",
      "multiShot",
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
      id: Date.now() + Math.random(),
      position,
      type: randomType,
      value: randomType === "health" ? 20 : 1,
    };
  }, []);

  // 发射子弹
  const shootBullet = useCallback(
    (position: Position, type: "player" | "enemy" = "player") => {
      const bullet: Bullet = {
        id: Date.now() + Math.random(),
        position: { ...position },
        velocity:
          type === "player"
            ? { x: 0, y: -BULLET_SPEED }
            : { x: 0, y: BULLET_SPEED },
        type,
        damage: 1,
      };

      setGameState((prev) => ({
        ...prev,
        bullets: [...prev.bullets, bullet],
      }));
    },
    []
  );

  // 多发射击
  const shootMultiBullet = useCallback((position: Position) => {
    const angles = [-0.3, 0, 0.3];
    angles.forEach((angle) => {
      const bullet: Bullet = {
        id: Date.now() + Math.random() + angle,
        position: { ...position },
        velocity: {
          x: Math.sin(angle) * BULLET_SPEED,
          y: -BULLET_SPEED * Math.cos(angle),
        },
        type: "player",
        damage: 1,
      };
      setGameState((prev) => ({
        ...prev,
        bullets: [...prev.bullets, bullet],
      }));
    });
  }, []);

  // 游戏循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState((prevState) => {
        // 移动玩家
        const newPlayer = { ...prevState.player };
        if (keys.has("ArrowLeft") || keys.has("a")) {
          newPlayer.position.x = Math.max(
            0,
            newPlayer.position.x - PLAYER_SPEED
          );
        }
        if (keys.has("ArrowRight") || keys.has("d")) {
          newPlayer.position.x = Math.min(
            GAME_WIDTH - 40,
            newPlayer.position.x + PLAYER_SPEED
          );
        }
        if (keys.has("ArrowUp") || keys.has("w")) {
          newPlayer.position.y = Math.max(
            0,
            newPlayer.position.y - PLAYER_SPEED
          );
        }
        if (keys.has("ArrowDown") || keys.has("s")) {
          newPlayer.position.y = Math.min(
            GAME_HEIGHT - 40,
            newPlayer.position.y + PLAYER_SPEED
          );
        }

        // 移动子弹
        const newBullets = prevState.bullets
          .map((bullet) => ({
            ...bullet,
            position: {
              x: bullet.position.x + bullet.velocity.x,
              y: bullet.position.y + bullet.velocity.y,
            },
          }))
          .filter(
            (bullet) =>
              bullet.position.y > -10 &&
              bullet.position.y < GAME_HEIGHT + 10 &&
              bullet.position.x > -10 &&
              bullet.position.x < GAME_WIDTH + 10
          );

        // 移动敌人
        const newEnemies = prevState.enemies
          .map((enemy) => ({
            ...enemy,
            position: {
              x: enemy.position.x + enemy.velocity.x,
              y: enemy.position.y + enemy.velocity.y,
            },
          }))
          .filter((enemy) => enemy.position.y < GAME_HEIGHT + 50);

        // 生成新敌人
        const shouldSpawnEnemy =
          Math.random() < DIFFICULTY_LEVELS[difficulty].enemySpawnRate;
        if (shouldSpawnEnemy) {
          newEnemies.push(generateEnemy());
        }

        // 检查碰撞
        let newScore = prevState.player.score;
        let newHealth = newPlayer.health;
        let newShield = newPlayer.shield;
        let newCombo = prevState.combo;
        let newMaxCombo = prevState.maxCombo;
        let newEnemiesKilled = prevState.enemiesKilled;

        // 子弹击中敌人
        const remainingBullets = newBullets.filter((bullet) => {
          if (bullet.type !== "player") return true;

          const hitEnemy = newEnemies.find(
            (enemy) =>
              Math.abs(bullet.position.x - enemy.position.x) < 30 &&
              Math.abs(bullet.position.y - enemy.position.y) < 30
          );

          if (hitEnemy) {
            hitEnemy.health -= bullet.damage;
            if (hitEnemy.health <= 0) {
              newScore += hitEnemy.points;
              newEnemiesKilled++;
              newCombo++;
              newMaxCombo = Math.max(newMaxCombo, newCombo);

              // 生成道具
              if (Math.random() < 0.1) {
                prevState.powerUps.push(generatePowerUp(hitEnemy.position));
              }
            }
            return false; // 移除子弹
          }
          return true;
        });

        // 敌人击中玩家
        const hitPlayer = newEnemies.find(
          (enemy) =>
            Math.abs(enemy.position.x - newPlayer.position.x) < 30 &&
            Math.abs(enemy.position.y - newPlayer.position.y) < 30
        );

        if (hitPlayer) {
          if (newShield > 0) {
            newShield -= 20;
          } else {
            newHealth -= 20;
          }
          newCombo = 0;
        }

        // 敌人子弹击中玩家
        const enemyBullets = remainingBullets.filter(
          (bullet) => bullet.type === "enemy"
        );
        const hitByBullet = enemyBullets.find(
          (bullet) =>
            Math.abs(bullet.position.x - newPlayer.position.x) < 20 &&
            Math.abs(bullet.position.y - newPlayer.position.y) < 20
        );

        if (hitByBullet) {
          if (newShield > 0) {
            newShield -= 10;
          } else {
            newHealth -= 10;
          }
          newCombo = 0;
        }

        // 玩家获得道具
        const newPowerUps = prevState.powerUps.filter((powerUp) => {
          const distance = Math.sqrt(
            Math.pow(powerUp.position.x - newPlayer.position.x, 2) +
              Math.pow(powerUp.position.y - newPlayer.position.y, 2)
          );

          if (distance < 30) {
            switch (powerUp.type) {
              case "health":
                newHealth = Math.min(
                  newPlayer.maxHealth,
                  newHealth + powerUp.value
                );
                break;
              case "weapon":
                newPlayer.weapon =
                  newPlayer.weapon === "single" ? "double" : "triple";
                break;
              case "shield":
                newShield = Math.min(100, newShield + 50);
                break;
              case "multiShot":
                newPlayer.weapon = "triple";
                break;
            }
            return false; // 移除道具
          }
          return true;
        });

        // 检查游戏结束
        const gameOver = newHealth <= 0;

        // 更新自动记录器
        if (gameRecorder) {
          gameRecorder.updateScore(newScore);
        }

        if (gameOver) {
          setHighScore(Math.max(highScore, newScore));
          if (gameRecorder) {
            gameRecorder.endGame(newScore);
            setGameRecorder(null);
          }
        }

        return {
          ...prevState,
          player: {
            ...newPlayer,
            health: newHealth,
            shield: newShield,
            score: newScore,
          },
          bullets: remainingBullets.filter(
            (bullet) => bullet.type === "player"
          ),
          enemies: newEnemies,
          powerUps: newPowerUps,
          gameOver,
          combo: newCombo,
          maxCombo: newMaxCombo,
          enemiesKilled: newEnemiesKilled,
        };
      });
    }, 16); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    difficulty,
    keys,
    generateEnemy,
    generatePowerUp,
    gameRecorder,
    highScore,
  ]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver) return;

      const key = e.key.toLowerCase();
      setKeys((prev) => new Set(prev).add(key));

      if (key === " ") {
        e.preventDefault();
        if (gameState.player.weapon === "triple") {
          shootMultiBullet(gameState.player.position);
        } else {
          shootBullet(gameState.player.position);
        }
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
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.player.position,
    gameState.player.weapon,
    shootBullet,
    shootMultiBullet,
  ]);

  const startGame = () => {
    setGameState({
      player: {
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50 },
        health: 100,
        maxHealth: 100,
        shield: 0,
        weapon: "single",
        score: 0,
        level: 1,
      },
      bullets: [],
      enemies: [],
      powerUps: [],
      gameOver: false,
      isPaused: false,
      wave: 1,
      enemiesKilled: 0,
      combo: 0,
      maxCombo: 0,
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Space Shooter",
      "space-shooter-game"
    );
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.player.score);
      setGameRecorder(null);
    }
  };

  const resetGame = () => {
    setGameState({
      player: {
        position: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50 },
        health: 100,
        maxHealth: 100,
        shield: 0,
        weapon: "single",
        score: 0,
        level: 1,
      },
      bullets: [],
      enemies: [],
      powerUps: [],
      gameOver: false,
      isPaused: false,
      wave: 1,
      enemiesKilled: 0,
      combo: 0,
      maxCombo: 0,
    });
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🚀 Space Shooter
          </h2>
          <p className="text-white/70">
            Use arrow keys to move, SPACE to shoot, P to pause
          </p>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">
              Score: {gameState.player.score}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Health: {gameState.player.health}/{gameState.player.maxHealth}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Shield: {gameState.player.shield}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Combo: {gameState.combo}</div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <div
            className="relative border-2 border-white/30 rounded-lg overflow-hidden bg-black"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Player */}
            <div
              className="absolute w-8 h-8 bg-blue-500 rounded-full"
              style={{
                left: gameState.player.position.x,
                top: gameState.player.position.y,
              }}
            />

            {/* Bullets */}
            {gameState.bullets.map((bullet) => (
              <div
                key={bullet.id}
                className={`absolute w-2 h-2 ${
                  bullet.type === "player" ? "bg-yellow-400" : "bg-red-400"
                } rounded-full`}
                style={{
                  left: bullet.position.x,
                  top: bullet.position.y,
                }}
              />
            ))}

            {/* Enemies */}
            {gameState.enemies.map((enemy) => (
              <div
                key={enemy.id}
                className={`absolute w-8 h-8 rounded-full ${
                  enemy.type === "basic"
                    ? "bg-red-500"
                    : enemy.type === "fast"
                    ? "bg-orange-500"
                    : enemy.type === "heavy"
                    ? "bg-purple-500"
                    : "bg-gray-500"
                }`}
                style={{
                  left: enemy.position.x,
                  top: enemy.position.y,
                }}
              />
            ))}

            {/* Power-ups */}
            {gameState.powerUps.map((powerUp) => (
              <div
                key={powerUp.id}
                className={`absolute w-6 h-6 rounded-full ${
                  powerUp.type === "health"
                    ? "bg-green-500"
                    : powerUp.type === "weapon"
                    ? "bg-blue-500"
                    : powerUp.type === "shield"
                    ? "bg-cyan-500"
                    : "bg-yellow-500"
                } animate-pulse`}
                style={{
                  left: powerUp.position.x,
                  top: powerUp.position.y,
                }}
              />
            ))}
          </div>
        </div>

        {/* Game Over Message */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              💥 Game Over!
            </p>
            <p className="text-white/70">
              Final Score: {gameState.player.score}
            </p>
            <p className="text-white/70">
              Enemies Killed: {gameState.enemiesKilled}
            </p>
            <p className="text-white/70">Max Combo: {gameState.maxCombo}</p>
          </div>
        )}

        {/* Difficulty Selection */}
        {!isPlaying && !gameState.gameOver && (
          <div className="mb-4">
            <div className="text-white text-center mb-2">
              Select Difficulty:
            </div>
            <div className="flex justify-center space-x-2">
              {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                <Button
                  key={key}
                  onClick={() =>
                    setDifficulty(key as keyof typeof DIFFICULTY_LEVELS)
                  }
                  className={`px-3 py-1 text-sm ${
                    difficulty === key
                      ? "bg-purple-600 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
                >
                  {level.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!isPlaying && !gameState.gameOver && (
            <Button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Start Game
            </Button>
          )}

          {isPlaying && !gameState.gameOver && (
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
                onClick={stopGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Stop
              </Button>
            </>
          )}

          {gameState.gameOver && (
            <Button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Play Again
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-white/60 text-sm">
          <p>🎮 Use Arrow Keys to move</p>
          <p>🔫 Press SPACE to shoot</p>
          <p>⏸️ Press P to pause</p>
          <p>💚 Green power-ups: Health</p>
          <p>🔵 Blue power-ups: Better weapons</p>
          <p>🛡️ Cyan power-ups: Shield</p>
          <p>💛 Yellow power-ups: Multi-shot</p>
          <p>🔥 Build combos for higher scores!</p>
        </div>
      </Card>
    </div>
  );
}
