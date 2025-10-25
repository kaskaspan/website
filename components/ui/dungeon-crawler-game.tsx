"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const MAP_SIZE = 10;
const TILE_SIZE = 30;

interface Position {
  x: number;
  y: number;
}

interface Player {
  position: Position;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  level: number;
  experience: number;
  gold: number;
}

interface Enemy {
  id: number;
  position: Position;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  type: "goblin" | "orc" | "dragon";
  experience: number;
  gold: number;
}

interface Item {
  id: number;
  position: Position;
  type: "health" | "weapon" | "armor" | "gold";
  value: number;
}

interface GameState {
  player: Player;
  enemies: Enemy[];
  items: Item[];
  map: string[][];
  gameOver: boolean;
  isWon: boolean;
  score: number;
  floor: number;
  message: string;
}

const ENEMY_TYPES = {
  goblin: { health: 20, attack: 5, defense: 2, experience: 10, gold: 5 },
  orc: { health: 40, attack: 10, defense: 5, experience: 25, gold: 15 },
  dragon: { health: 100, attack: 20, defense: 10, experience: 100, gold: 50 },
};

export function DungeonCrawlerGame() {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      position: { x: 1, y: 1 },
      health: 100,
      maxHealth: 100,
      attack: 10,
      defense: 5,
      level: 1,
      experience: 0,
      gold: 0,
    },
    enemies: [],
    items: [],
    map: [],
    gameOver: false,
    isWon: false,
    score: 0,
    floor: 1,
    message: "Welcome to the dungeon! Use arrow keys to move.",
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

  // 生成地图
  const generateMap = useCallback((): string[][] => {
    const map: string[][] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_SIZE; x++) {
        if (x === 0 || x === MAP_SIZE - 1 || y === 0 || y === MAP_SIZE - 1) {
          map[y][x] = "#"; // 墙壁
        } else {
          map[y][x] = "."; // 空地
        }
      }
    }
    return map;
  }, []);

  // 生成敌人
  const generateEnemies = useCallback((floor: number): Enemy[] => {
    const enemies: Enemy[] = [];
    const enemyCount = Math.min(3 + floor, 8);

    for (let i = 0; i < enemyCount; i++) {
      let type: "goblin" | "orc" | "dragon";
      if (floor >= 5 && Math.random() < 0.1) {
        type = "dragon";
      } else if (floor >= 3 && Math.random() < 0.3) {
        type = "orc";
      } else {
        type = "goblin";
      }

      const config = ENEMY_TYPES[type];
      enemies.push({
        id: Date.now() + i,
        position: { x: 0, y: 0 },
        health: config.health + floor * 5,
        maxHealth: config.health + floor * 5,
        attack: config.attack + floor,
        defense: config.defense + Math.floor(floor / 2),
        type,
        experience: config.experience + floor * 5,
        gold: config.gold + floor * 2,
      });
    }

    // 随机放置敌人
    enemies.forEach((enemy) => {
      let x, y;
      do {
        x = Math.floor(Math.random() * (MAP_SIZE - 2)) + 1;
        y = Math.floor(Math.random() * (MAP_SIZE - 2)) + 1;
      } while (x === 1 && y === 1); // 避免放在玩家起始位置
      enemy.position = { x, y };
    });

    return enemies;
  }, []);

  // 生成道具
  const generateItems = useCallback((floor: number): Item[] => {
    const items: Item[] = [];
    const itemCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < itemCount; i++) {
      const types: Item["type"][] = ["health", "weapon", "armor", "gold"];
      const type = types[Math.floor(Math.random() * types.length)];
      const value = Math.floor(Math.random() * floor * 5) + 1;

      let x, y;
      do {
        x = Math.floor(Math.random() * (MAP_SIZE - 2)) + 1;
        y = Math.floor(Math.random() * (MAP_SIZE - 2)) + 1;
      } while (x === 1 && y === 1);

      items.push({
        id: Date.now() + i,
        position: { x, y },
        type,
        value,
      });
    }

    return items;
  }, []);

  // 初始化关卡
  const initializeFloor = useCallback(
    (floor: number) => {
      const map = generateMap();
      const enemies = generateEnemies(floor);
      const items = generateItems(floor);

      setGameState((prev) => ({
        ...prev,
        map,
        enemies,
        items,
        floor,
        message: `Floor ${floor}. Find the stairs to advance!`,
      }));
    },
    [generateMap, generateEnemies, generateItems]
  );

  // 移动玩家
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (gameState.gameOver) return;

      setGameState((prev) => {
        const newX = prev.player.position.x + dx;
        const newY = prev.player.position.y + dy;

        // 检查边界
        if (newX < 0 || newX >= MAP_SIZE || newY < 0 || newY >= MAP_SIZE) {
          return prev;
        }

        // 检查墙壁
        if (prev.map[newY][newX] === "#") {
          return prev;
        }

        const newPosition = { x: newX, y: newY };
        const newPlayer = { ...prev.player, position: newPosition };
        const newEnemies = [...prev.enemies];
        const newItems = [...prev.items];
        let newMessage = prev.message;
        let newScore = prev.score;

        // 检查敌人碰撞
        const enemyIndex = newEnemies.findIndex(
          (enemy) => enemy.position.x === newX && enemy.position.y === newY
        );

        if (enemyIndex !== -1) {
          const enemy = newEnemies[enemyIndex];
          newMessage = `You encounter a ${enemy.type}!`;

          // 战斗
          const playerDamage = Math.max(1, newPlayer.attack - enemy.defense);
          const enemyDamage = Math.max(1, enemy.attack - newPlayer.defense);

          enemy.health -= playerDamage;
          newPlayer.health -= enemyDamage;

          if (enemy.health <= 0) {
            // 敌人死亡
            newPlayer.experience += enemy.experience;
            newPlayer.gold += enemy.gold;
            newScore += enemy.experience;
            newMessage = `You defeated the ${enemy.type}! +${enemy.experience} XP, +${enemy.gold} gold`;
            newEnemies.splice(enemyIndex, 1);

            // 更新自动记录器
            if (gameRecorder) {
              gameRecorder.updateScore(newScore);
            }
          } else {
            newMessage = `You attack for ${playerDamage} damage! ${enemy.type} attacks for ${enemyDamage} damage!`;
          }
        }

        // 检查道具碰撞
        const itemIndex = newItems.findIndex(
          (item) => item.position.x === newX && item.position.y === newY
        );

        if (itemIndex !== -1) {
          const item = newItems[itemIndex];

          switch (item.type) {
            case "health":
              newPlayer.health = Math.min(
                newPlayer.maxHealth,
                newPlayer.health + item.value
              );
              newMessage = `You found a health potion! +${item.value} HP`;
              break;
            case "weapon":
              newPlayer.attack += item.value;
              newMessage = `You found a weapon! +${item.value} Attack`;
              break;
            case "armor":
              newPlayer.defense += item.value;
              newMessage = `You found armor! +${item.value} Defense`;
              break;
            case "gold":
              newPlayer.gold += item.value;
              newMessage = `You found ${item.value} gold!`;
              break;
          }
          newItems.splice(itemIndex, 1);
        }

        // 检查升级
        const expNeeded = newPlayer.level * 100;
        if (newPlayer.experience >= expNeeded) {
          newPlayer.level += 1;
          newPlayer.maxHealth += 20;
          newPlayer.health = newPlayer.maxHealth;
          newPlayer.attack += 2;
          newPlayer.defense += 1;
          newMessage = `Level up! You are now level ${newPlayer.level}!`;
        }

        // 检查游戏结束
        let gameOver = false;
        let isWon = false;

        if (newPlayer.health <= 0) {
          gameOver = true;
          isWon = false;
          newMessage = "You died! Game Over!";
        } else if (newEnemies.length === 0) {
          // 所有敌人都被击败，进入下一层
          const newFloor = prev.floor + 1;
          if (newFloor > 10) {
            gameOver = true;
            isWon = true;
            newMessage = "Congratulations! You cleared all 10 floors!";
          } else {
            // 初始化下一层
            setTimeout(() => initializeFloor(newFloor), 1000);
          }
        }

        return {
          ...prev,
          player: newPlayer,
          enemies: newEnemies,
          items: newItems,
          score: newScore,
          gameOver,
          isWon,
          message: newMessage,
        };
      });
    },
    [gameState.gameOver, gameRecorder, initializeFloor]
  );

  // 键盘控制
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.toLowerCase();
      setKeys((prev) => new Set(prev).add(key));

      switch (key) {
        case "arrowup":
        case "w":
          movePlayer(0, -1);
          break;
        case "arrowdown":
        case "s":
          movePlayer(0, 1);
          break;
        case "arrowleft":
        case "a":
          movePlayer(-1, 0);
          break;
        case "arrowright":
        case "d":
          movePlayer(1, 0);
          break;
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
  }, [isPlaying, movePlayer]);

  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      player: {
        position: { x: 1, y: 1 },
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        level: 1,
        experience: 0,
        gold: 0,
      },
      enemies: [],
      items: [],
      gameOver: false,
      isWon: false,
      score: 0,
      floor: 1,
      message: "Welcome to the dungeon! Use arrow keys to move.",
    }));
    initializeFloor(1);
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Dungeon Crawler",
      "dungeon-crawler-game"
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
      <Card className="p-6 bg-gradient-to-br from-gray-900 via-red-900 to-black border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🗡️ Dungeon Crawler
          </h2>
          <p className="text-white/70">
            Explore the dungeon, fight monsters, and reach the bottom!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Floor: {gameState.floor}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Level: {gameState.player.level}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Gold: {gameState.player.gold}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">
              HP: {gameState.player.health}/{gameState.player.maxHealth}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              XP: {gameState.player.experience}
            </div>
          </div>
        </div>

        {/* 地图 */}
        <div
          className="relative mx-auto mb-6"
          style={{ width: MAP_SIZE * TILE_SIZE, height: MAP_SIZE * TILE_SIZE }}
        >
          {gameState.map.map((row, y) =>
            row.map((tile, x) => (
              <div
                key={`${x}-${y}`}
                className={`absolute w-7 h-7 border ${
                  tile === "#" ? "bg-gray-800" : "bg-gray-600"
                }`}
                style={{ left: x * TILE_SIZE, top: y * TILE_SIZE }}
              >
                {/* 玩家 */}
                {x === gameState.player.position.x &&
                  y === gameState.player.position.y && (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                      🧙
                    </div>
                  )}

                {/* 敌人 */}
                {gameState.enemies.map(
                  (enemy) =>
                    enemy.position.x === x &&
                    enemy.position.y === y && (
                      <div
                        key={enemy.id}
                        className="w-full h-full bg-red-500 flex items-center justify-center text-white font-bold text-xs"
                      >
                        {enemy.type === "goblin"
                          ? "👹"
                          : enemy.type === "orc"
                          ? "👹"
                          : "🐉"}
                      </div>
                    )
                )}

                {/* 道具 */}
                {gameState.items.map(
                  (item) =>
                    item.position.x === x &&
                    item.position.y === y && (
                      <div
                        key={item.id}
                        className="w-full h-full bg-yellow-500 flex items-center justify-center text-white font-bold text-xs"
                      >
                        {item.type === "health"
                          ? "❤️"
                          : item.type === "weapon"
                          ? "⚔️"
                          : item.type === "armor"
                          ? "🛡️"
                          : "💰"}
                      </div>
                    )
                )}
              </div>
            ))
          )}
        </div>

        {/* 消息 */}
        <div className="text-center mb-4">
          <p className="text-white/70">{gameState.message}</p>
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            {gameState.isWon ? (
              <p className="text-2xl font-bold text-green-400 mb-2">
                🎉 Victory!
              </p>
            ) : (
              <p className="text-2xl font-bold text-red-400 mb-2">💀 Defeat!</p>
            )}
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">
              Floors Cleared: {gameState.floor - 1}
            </p>
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
            <Button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reset
            </Button>
          )}
        </div>

        <div className="mt-4 text-center text-white/70 text-sm">
          <p>🎮 Use arrow keys or WASD to move</p>
          <p>⚔️ Walk into enemies to fight them</p>
          <p>💎 Collect items to improve your stats</p>
          <p>🏰 Clear all enemies to advance to the next floor</p>
        </div>
      </Card>
    </div>
  );
}
