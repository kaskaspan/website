"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

// 游戏常量
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const TILE_SIZE = 30;
const PLAYER_SPEED = 1;
const ENEMY_SPEED = 0.5;

// 地图瓦片类型
type TileType =
  | "floor"
  | "wall"
  | "door"
  | "stairs"
  | "chest"
  | "enemy"
  | "player";

// 位置类型
interface Position {
  x: number;
  y: number;
}

// 玩家类型
interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  level: number;
  experience: number;
  gold: number;
  inventory: string[];
}

// 敌人类型
interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  name: string;
  symbol: string;
  experience: number;
  gold: number;
}

// 物品类型
interface Item {
  id: string;
  x: number;
  y: number;
  name: string;
  type: "weapon" | "armor" | "potion" | "gold";
  value: number;
  description: string;
}

// 游戏状态
interface GameState {
  map: TileType[][];
  player: Player;
  enemies: Enemy[];
  items: Item[];
  currentLevel: number;
  score: number;
  gameOver: boolean;
  isPaused: boolean;
  message: string;
  inventoryOpen: boolean;
  shopOpen: boolean;
}

export function RoguelikeGame() {
  const [gameState, setGameState] = useState<GameState>({
    map: [],
    player: {
      x: 1,
      y: 1,
      health: 100,
      maxHealth: 100,
      attack: 10,
      defense: 5,
      level: 1,
      experience: 0,
      gold: 0,
      inventory: [],
    },
    enemies: [],
    items: [],
    currentLevel: 1,
    score: 0,
    gameOver: false,
    isPaused: false,
    message: "Welcome to the dungeon!",
    inventoryOpen: false,
    shopOpen: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (score: number) => void;
  } | null>(null);

  // 生成随机地图
  const generateMap = useCallback((): TileType[][] => {
    const map: TileType[][] = [];

    // 初始化地图
    for (let y = 0; y < MAP_HEIGHT; y++) {
      map[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
          map[y][x] = "wall";
        } else {
          map[y][x] = "floor";
        }
      }
    }

    // 添加房间
    const rooms = [];
    for (let i = 0; i < 5; i++) {
      const room = {
        x: Math.floor(Math.random() * (MAP_WIDTH - 10)) + 1,
        y: Math.floor(Math.random() * (MAP_HEIGHT - 8)) + 1,
        width: Math.floor(Math.random() * 8) + 4,
        height: Math.floor(Math.random() * 6) + 3,
      };
      rooms.push(room);
    }

    // 创建房间
    rooms.forEach((room) => {
      for (
        let y = room.y;
        y < room.y + room.height && y < MAP_HEIGHT - 1;
        y++
      ) {
        for (
          let x = room.x;
          x < room.x + room.width && x < MAP_WIDTH - 1;
          x++
        ) {
          map[y][x] = "floor";
        }
      }
    });

    // 添加楼梯
    const stairsX = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
    const stairsY = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
    map[stairsY][stairsX] = "stairs";

    return map;
  }, []);

  // 生成敌人
  const generateEnemies = useCallback((level: number): Enemy[] => {
    const enemies: Enemy[] = [];
    const enemyTypes = [
      {
        name: "Goblin",
        symbol: "👹",
        health: 20,
        attack: 5,
        defense: 2,
        experience: 10,
        gold: 5,
      },
      {
        name: "Orc",
        symbol: "👹",
        health: 40,
        attack: 8,
        defense: 4,
        experience: 20,
        gold: 10,
      },
      {
        name: "Troll",
        symbol: "👹",
        health: 60,
        attack: 12,
        defense: 6,
        experience: 30,
        gold: 15,
      },
      {
        name: "Dragon",
        symbol: "🐉",
        health: 100,
        attack: 20,
        defense: 10,
        experience: 50,
        gold: 25,
      },
    ];

    const enemyCount = Math.min(3 + level, 8);

    for (let i = 0; i < enemyCount; i++) {
      const type = enemyTypes[Math.min(level - 1, enemyTypes.length - 1)];
      const x = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
      const y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;

      enemies.push({
        id: `enemy-${i}`,
        x,
        y,
        health: type.health + level * 5,
        maxHealth: type.health + level * 5,
        attack: type.attack + level * 2,
        defense: type.defense + level,
        name: type.name,
        symbol: type.symbol,
        experience: type.experience + level * 5,
        gold: type.gold + level * 2,
      });
    }

    return enemies;
  }, []);

  // 生成物品
  const generateItems = useCallback((level: number): Item[] => {
    const items: Item[] = [];
    const itemTypes = [
      {
        name: "Health Potion",
        type: "potion" as const,
        value: 20,
        description: "Restores 20 health",
      },
      {
        name: "Iron Sword",
        type: "weapon" as const,
        value: 5,
        description: "+5 attack",
      },
      {
        name: "Leather Armor",
        type: "armor" as const,
        value: 3,
        description: "+3 defense",
      },
      {
        name: "Gold Coin",
        type: "gold" as const,
        value: 10,
        description: "Worth 10 gold",
      },
    ];

    const itemCount = Math.min(2 + level, 6);

    for (let i = 0; i < itemCount; i++) {
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
      const x = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
      const y = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;

      items.push({
        id: `item-${i}`,
        x,
        y,
        name: type.name,
        type: type.type,
        value: type.value + level * 2,
        description: type.description,
      });
    }

    return items;
  }, []);

  // 检查位置是否有效
  const isValidPosition = useCallback(
    (x: number, y: number, map: TileType[][]): boolean => {
      return (
        x >= 0 &&
        x < MAP_WIDTH &&
        y >= 0 &&
        y < MAP_HEIGHT &&
        map[y][x] === "floor"
      );
    },
    []
  );

  // 移动玩家
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      if (gameState.gameOver || gameState.isPaused) return;

      setGameState((prev) => {
        const newX = prev.player.x + dx;
        const newY = prev.player.y + dy;

        if (!isValidPosition(newX, newY, prev.map)) {
          return prev;
        }

        // 检查是否与敌人碰撞
        const enemy = prev.enemies.find((e) => e.x === newX && e.y === newY);
        if (enemy) {
          // 战斗
          const playerDamage = Math.max(1, prev.player.attack - enemy.defense);
          const enemyDamage = Math.max(1, enemy.attack - prev.player.defense);

          const newEnemies = prev.enemies.map((e) =>
            e.id === enemy.id
              ? { ...e, health: Math.max(0, e.health - playerDamage) }
              : e
          );

          const newPlayer = {
            ...prev.player,
            health: Math.max(0, prev.player.health - enemyDamage),
          };

          // 检查敌人是否死亡
          if (enemy.health - playerDamage <= 0) {
            const newScore = prev.score + enemy.experience;
            const newGold = prev.player.gold + enemy.gold;
            const newExperience = prev.player.experience + enemy.experience;

            // 检查升级
            const newLevel = Math.floor(newExperience / 100) + 1;
            const leveledUp = newLevel > prev.player.level;

            return {
              ...prev,
              enemies: newEnemies.filter((e) => e.id !== enemy.id),
              player: {
                ...newPlayer,
                gold: newGold,
                experience: newExperience,
                level: newLevel,
                health: leveledUp ? newPlayer.maxHealth : newPlayer.health,
                maxHealth: leveledUp
                  ? newPlayer.maxHealth + 20
                  : newPlayer.maxHealth,
                attack: leveledUp ? newPlayer.attack + 2 : newPlayer.attack,
                defense: leveledUp ? newPlayer.defense + 1 : newPlayer.defense,
              },
              score: newScore,
              message: `Defeated ${enemy.name}! Gained ${enemy.experience} XP and ${enemy.gold} gold!`,
              gameOver: newPlayer.health <= 0,
            };
          }

          return {
            ...prev,
            enemies: newEnemies,
            player: newPlayer,
            message: `Attacked ${enemy.name}! You took ${enemyDamage} damage.`,
            gameOver: newPlayer.health <= 0,
          };
        }

        // 检查是否与物品碰撞
        const item = prev.items.find((i) => i.x === newX && i.y === newY);
        if (item) {
          const newItems = prev.items.filter((i) => i.id !== item.id);
          const newInventory = [...prev.player.inventory, item.name];
          const newGold =
            item.type === "gold"
              ? prev.player.gold + item.value
              : prev.player.gold;

          return {
            ...prev,
            items: newItems,
            player: {
              ...prev.player,
              inventory: newInventory,
              gold: newGold,
            },
            message: `Found ${item.name}! ${item.description}`,
          };
        }

        // 检查是否到达楼梯
        if (prev.map[newY][newX] === "stairs") {
          // 进入下一层
          const newLevel = prev.currentLevel + 1;
          const newMap = generateMap();
          const newEnemies = generateEnemies(newLevel);
          const newItems = generateItems(newLevel);

          return {
            ...prev,
            map: newMap,
            enemies: newEnemies,
            items: newItems,
            currentLevel: newLevel,
            player: {
              ...prev.player,
              x: 1,
              y: 1,
            },
            message: `Entered level ${newLevel}!`,
          };
        }

        return {
          ...prev,
          player: {
            ...prev.player,
            x: newX,
            y: newY,
          },
          message: "",
        };
      });
    },
    [gameState, isValidPosition, generateMap, generateEnemies, generateItems]
  );

  // 使用物品
  const useItem = useCallback((itemName: string) => {
    setGameState((prev) => {
      const newInventory = prev.player.inventory.filter(
        (item) => item !== itemName
      );

      if (itemName.includes("Potion")) {
        const newHealth = Math.min(
          prev.player.maxHealth,
          prev.player.health + 20
        );
        return {
          ...prev,
          player: {
            ...prev.player,
            health: newHealth,
            inventory: newInventory,
          },
          message: `Used ${itemName}! Restored 20 health.`,
        };
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          inventory: newInventory,
        },
        message: `Used ${itemName}!`,
      };
    });
  }, []);

  // 初始化游戏
  const initializeGame = useCallback(() => {
    const map = generateMap();
    const enemies = generateEnemies(1);
    const items = generateItems(1);

    return {
      map,
      player: {
        x: 1,
        y: 1,
        health: 100,
        maxHealth: 100,
        attack: 10,
        defense: 5,
        level: 1,
        experience: 0,
        gold: 0,
        inventory: [],
      },
      enemies,
      items,
      currentLevel: 1,
      score: 0,
      gameOver: false,
      isPaused: false,
      message: "Welcome to the dungeon!",
      inventoryOpen: false,
      shopOpen: false,
    };
  }, [generateMap, generateEnemies, generateItems]);

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
      "Roguelike",
      "roguelike-game"
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

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameOver || !isPlaying) return;

      switch (e.key.toLowerCase()) {
        case "w":
        case "arrowup":
          movePlayer(0, -1);
          break;
        case "s":
        case "arrowdown":
          movePlayer(0, 1);
          break;
        case "a":
        case "arrowleft":
          movePlayer(-1, 0);
          break;
        case "d":
        case "arrowright":
          movePlayer(1, 0);
          break;
        case "i":
          setGameState((prev) => ({
            ...prev,
            inventoryOpen: !prev.inventoryOpen,
          }));
          break;
        case "p":
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState.gameOver, isPlaying, movePlayer]);

  // 渲染地图
  const renderMap = useCallback(() => {
    return gameState.map.map((row, y) =>
      row.map((tile, x) => {
        let content = "";
        let className =
          "w-8 h-8 border border-gray-600 flex items-center justify-center text-xs";

        switch (tile) {
          case "wall":
            content = "█";
            className += " bg-gray-800 text-gray-400";
            break;
          case "floor":
            content = "·";
            className += " bg-gray-900 text-gray-600";
            break;
          case "stairs":
            content = "⏬";
            className += " bg-yellow-800 text-yellow-400";
            break;
          default:
            content = "·";
            className += " bg-gray-900 text-gray-600";
        }

        // 检查玩家位置
        if (x === gameState.player.x && y === gameState.player.y) {
          content = "👤";
          className += " bg-blue-600 text-white";
        }

        // 检查敌人位置
        const enemy = gameState.enemies.find((e) => e.x === x && e.y === y);
        if (enemy) {
          content = enemy.symbol;
          className += " bg-red-600 text-white";
        }

        // 检查物品位置
        const item = gameState.items.find((i) => i.x === x && i.y === y);
        if (item) {
          content = "💰";
          className += " bg-yellow-600 text-white";
        }

        return (
          <div key={`${x}-${y}`} className={className}>
            {content}
          </div>
        );
      })
    );
  }, [gameState]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="p-6 bg-gradient-to-br from-gray-900 via-red-900 to-black border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🗡️ Roguelike</h2>
          <p className="text-white/70">
            Explore dungeons, fight monsters, and collect treasure!
          </p>
        </div>

        {/* 游戏信息 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Level: {gameState.currentLevel}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Health: {gameState.player.health}/{gameState.player.maxHealth}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Gold: {gameState.player.gold}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Score: {gameState.score}
            </div>
          </div>
        </div>

        {/* 玩家状态 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Attack: {gameState.player.attack}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Defense: {gameState.player.defense}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Level: {gameState.player.level}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              XP: {gameState.player.experience}
            </div>
          </div>
        </div>

        {/* 游戏区域 */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-20 gap-0 p-4 bg-black rounded-lg">
            {renderMap()}
          </div>
        </div>

        {/* 消息 */}
        {gameState.message && (
          <div className="text-center mb-4">
            <p className="text-white/70">{gameState.message}</p>
          </div>
        )}

        {/* 游戏结束 */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              💀 Game Over!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">
              Level Reached: {gameState.currentLevel}
            </p>
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
                onClick={() =>
                  setGameState((prev) => ({
                    ...prev,
                    inventoryOpen: !prev.inventoryOpen,
                  }))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Inventory (I)
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

        {/* 物品栏 */}
        {gameState.inventoryOpen && (
          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-white text-lg font-bold mb-4">Inventory</h3>
            <div className="grid grid-cols-4 gap-2">
              {gameState.player.inventory.map((item, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setGameState((prev) => {
                      const newInventory = prev.player.inventory.filter(
                        (invItem) => invItem !== item
                      );

                      if (item.includes("Potion")) {
                        const newHealth = Math.min(
                          prev.player.maxHealth,
                          prev.player.health + 20
                        );
                        return {
                          ...prev,
                          player: {
                            ...prev.player,
                            health: newHealth,
                            inventory: newInventory,
                          },
                          message: `Used ${item}! Restored 20 health.`,
                        };
                      }

                      return {
                        ...prev,
                        player: {
                          ...prev.player,
                          inventory: newInventory,
                        },
                        message: `Used ${item}!`,
                      };
                    });
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-sm"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 游戏说明 */}
        <div className="mt-6 text-center text-white/70 text-sm">
          <p>
            Use WASD or arrow keys to move. Press I for inventory, P to pause.
          </p>
        </div>
      </Card>
    </div>
  );
}
