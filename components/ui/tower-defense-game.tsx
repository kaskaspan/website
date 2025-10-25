"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const MAP_WIDTH = 400;
const MAP_HEIGHT = 300;
const TILE_SIZE = 20;
const TOWER_SIZE = 16;
const ENEMY_SIZE = 12;

interface Position {
  x: number;
  y: number;
}

interface Tower {
  id: number;
  position: Position;
  type: "basic" | "fire" | "ice" | "lightning";
  level: number;
  damage: number;
  range: number;
  fireRate: number;
  lastShot: number;
  cost: number;
}

interface Enemy {
  id: number;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  type: "basic" | "fast" | "heavy";
  pathIndex: number;
  gold: number;
}

interface Projectile {
  id: number;
  position: Position;
  target: Position;
  damage: number;
  speed: number;
  type: "basic" | "fire" | "ice" | "lightning";
}

interface GameState {
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  wave: number;
  enemiesSpawned: number;
  enemiesToSpawn: number;
  enemiesAlive: number;
  health: number;
  gold: number;
  score: number;
  gameOver: boolean;
  isPaused: boolean;
  selectedTower: Tower["type"] | null;
  path: Position[];
}

const TOWER_TYPES = {
  basic: { damage: 10, range: 80, fireRate: 1000, cost: 50 },
  fire: { damage: 15, range: 70, fireRate: 800, cost: 100 },
  ice: { damage: 8, range: 90, fireRate: 1200, cost: 150 },
  lightning: { damage: 25, range: 100, fireRate: 1500, cost: 200 },
};

const ENEMY_TYPES = {
  basic: { health: 50, speed: 1, gold: 10 },
  fast: { health: 30, speed: 2, gold: 15 },
  heavy: { health: 100, speed: 0.5, gold: 25 },
};

const PATH = [
  { x: 0, y: 150 },
  { x: 100, y: 150 },
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 200 },
  { x: 300, y: 200 },
  { x: 300, y: 50 },
  { x: 400, y: 50 },
];

export function TowerDefenseGame() {
  const [gameState, setGameState] = useState<GameState>({
    towers: [],
    enemies: [],
    projectiles: [],
    wave: 1,
    enemiesSpawned: 0,
    enemiesToSpawn: 5,
    enemiesAlive: 0,
    health: 20,
    gold: 100,
    score: 0,
    gameOver: false,
    isPaused: false,
    selectedTower: null,
    path: PATH,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 计算距离
  const getDistance = useCallback((pos1: Position, pos2: Position): number => {
    return Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
    );
  }, []);

  // 生成敌人
  const generateEnemy = useCallback((wave: number): Enemy => {
    const types: Enemy["type"][] = ["basic", "fast", "heavy"];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = ENEMY_TYPES[type];

    return {
      id: Date.now() + Math.random(),
      position: { x: PATH[0].x, y: PATH[0].y },
      health: config.health + wave * 10,
      maxHealth: config.health + wave * 10,
      speed: config.speed,
      type,
      pathIndex: 0,
      gold: config.gold,
    };
  }, []);

  // 创建塔
  const createTower = useCallback(
    (position: Position, type: Tower["type"]): Tower => {
      const config = TOWER_TYPES[type];
      return {
        id: Date.now() + Math.random(),
        position,
        type,
        level: 1,
        damage: config.damage,
        range: config.range,
        fireRate: config.fireRate,
        lastShot: 0,
        cost: config.cost,
      };
    },
    []
  );

  // 创建投射物
  const createProjectile = useCallback(
    (tower: Tower, target: Enemy): Projectile => {
      return {
        id: Date.now() + Math.random(),
        position: { ...tower.position },
        target: { ...target.position },
        damage: tower.damage,
        speed: 5,
        type: tower.type,
      };
    },
    []
  );

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        const now = Date.now();
        const newTowers = [...prev.towers];
        let newEnemies = [...prev.enemies];
        let newProjectiles = [...prev.projectiles];
        let newGold = prev.gold;
        let newScore = prev.score;
        let newHealth = prev.health;
        let newWave = prev.wave;
        let newEnemiesSpawned = prev.enemiesSpawned;
        let newEnemiesToSpawn = prev.enemiesToSpawn;
        let newEnemiesAlive = prev.enemiesAlive;

        // 生成敌人
        if (newEnemiesSpawned < newEnemiesToSpawn && Math.random() < 0.02) {
          newEnemies.push(generateEnemy(newWave));
          newEnemiesSpawned++;
          newEnemiesAlive++;
        }

        // 移动敌人
        newEnemies = newEnemies
          .map((enemy) => {
            if (enemy.pathIndex >= PATH.length - 1) {
              // 敌人到达终点
              newHealth -= 1;
              newEnemiesAlive--;
              return null;
            }

            const nextPoint = PATH[enemy.pathIndex + 1];
            const dx = nextPoint.x - enemy.position.x;
            const dy = nextPoint.y - enemy.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < enemy.speed) {
              return {
                ...enemy,
                position: nextPoint,
                pathIndex: enemy.pathIndex + 1,
              };
            } else {
              const moveX = (dx / distance) * enemy.speed;
              const moveY = (dy / distance) * enemy.speed;
              return {
                ...enemy,
                position: {
                  x: enemy.position.x + moveX,
                  y: enemy.position.y + moveY,
                },
              };
            }
          })
          .filter((enemy) => enemy !== null) as Enemy[];

        // 塔攻击
        newTowers.forEach((tower) => {
          if (now - tower.lastShot < tower.fireRate) return;

          const target = newEnemies.find(
            (enemy) =>
              getDistance(tower.position, enemy.position) <= tower.range
          );

          if (target) {
            newProjectiles.push(createProjectile(tower, target));
            tower.lastShot = now;
          }
        });

        // 移动投射物
        newProjectiles = newProjectiles
          .map((projectile) => {
            const dx = projectile.target.x - projectile.position.x;
            const dy = projectile.target.y - projectile.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < projectile.speed) {
              // 投射物命中目标
              const target = newEnemies.find(
                (enemy) => getDistance(projectile.position, enemy.position) < 20
              );

              if (target) {
                target.health -= projectile.damage;
                if (target.health <= 0) {
                  newGold += target.gold;
                  newScore += target.gold * 2;
                  newEnemiesAlive--;
                }
              }
              return null;
            } else {
              const moveX = (dx / distance) * projectile.speed;
              const moveY = (dy / distance) * projectile.speed;
              return {
                ...projectile,
                position: {
                  x: projectile.position.x + moveX,
                  y: projectile.position.y + moveY,
                },
              };
            }
          })
          .filter((projectile) => projectile !== null) as Projectile[];

        // 检查波次结束
        if (newEnemiesAlive === 0 && newEnemiesSpawned >= newEnemiesToSpawn) {
          newWave++;
          newEnemiesToSpawn = 5 + newWave * 2;
          newEnemiesSpawned = 0;
          newGold += 50;
        }

        // 检查游戏结束
        let gameOver = false;
        if (newHealth <= 0) {
          gameOver = true;
        }

        // 更新自动记录器
        if (gameRecorder) {
          gameRecorder.updateScore(newScore);
        }

        return {
          ...prev,
          towers: newTowers,
          enemies: newEnemies,
          projectiles: newProjectiles,
          gold: newGold,
          score: newScore,
          health: newHealth,
          wave: newWave,
          enemiesSpawned: newEnemiesSpawned,
          enemiesToSpawn: newEnemiesToSpawn,
          enemiesAlive: newEnemiesAlive,
          gameOver,
        };
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    getDistance,
    generateEnemy,
    createProjectile,
    gameRecorder,
  ]);

  // 处理点击
  const handleMapClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!gameState.selectedTower || gameState.gameOver) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const tileX = Math.floor(x / TILE_SIZE);
      const tileY = Math.floor(y / TILE_SIZE);
      const position = {
        x: tileX * TILE_SIZE + TILE_SIZE / 2,
        y: tileY * TILE_SIZE + TILE_SIZE / 2,
      };

      const towerType = gameState.selectedTower;
      const cost = TOWER_TYPES[towerType].cost;

      if (gameState.gold >= cost) {
        setGameState((prev) => ({
          ...prev,
          towers: [...prev.towers, createTower(position, towerType)],
          gold: prev.gold - cost,
          selectedTower: null,
        }));
      }
    },
    [gameState.selectedTower, gameState.gameOver, gameState.gold, createTower]
  );

  const startGame = () => {
    setGameState({
      towers: [],
      enemies: [],
      projectiles: [],
      wave: 1,
      enemiesSpawned: 0,
      enemiesToSpawn: 5,
      enemiesAlive: 0,
      health: 20,
      gold: 100,
      score: 0,
      gameOver: false,
      isPaused: false,
      selectedTower: null,
      path: PATH,
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Tower Defense",
      "tower-defense-game"
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
      <Card className="p-6 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🏰 Tower Defense
          </h2>
          <p className="text-white/70">
            Build towers to defend against waves of enemies!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Wave: {gameState.wave}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Health: {gameState.health}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Gold: {gameState.gold}</div>
          </div>
        </div>

        {/* 游戏区域 */}
        <div
          className="relative mx-auto mb-6 bg-gray-800 border-2 border-white/30 cursor-crosshair"
          style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
          onClick={handleMapClick}
        >
          {/* 路径 */}
          {PATH.map((point, index) => (
            <div
              key={index}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full"
              style={{ left: point.x - 6, top: point.y - 6 }}
            />
          ))}

          {/* 塔 */}
          {gameState.towers.map((tower) => (
            <div
              key={tower.id}
              className={`absolute w-4 h-4 rounded ${
                tower.type === "basic"
                  ? "bg-gray-600"
                  : tower.type === "fire"
                  ? "bg-red-600"
                  : tower.type === "ice"
                  ? "bg-blue-600"
                  : "bg-yellow-600"
              }`}
              style={{
                left: tower.position.x - TOWER_SIZE / 2,
                top: tower.position.y - TOWER_SIZE / 2,
              }}
            />
          ))}

          {/* 敌人 */}
          {gameState.enemies.map((enemy) => (
            <div
              key={enemy.id}
              className={`absolute w-3 h-3 rounded ${
                enemy.type === "basic"
                  ? "bg-red-500"
                  : enemy.type === "fast"
                  ? "bg-orange-500"
                  : "bg-purple-500"
              }`}
              style={{
                left: enemy.position.x - ENEMY_SIZE / 2,
                top: enemy.position.y - ENEMY_SIZE / 2,
              }}
            />
          ))}

          {/* 投射物 */}
          {gameState.projectiles.map((projectile) => (
            <div
              key={projectile.id}
              className={`absolute w-2 h-2 rounded ${
                projectile.type === "basic"
                  ? "bg-gray-400"
                  : projectile.type === "fire"
                  ? "bg-red-400"
                  : projectile.type === "ice"
                  ? "bg-blue-400"
                  : "bg-yellow-400"
              }`}
              style={{
                left: projectile.position.x - 4,
                top: projectile.position.y - 4,
              }}
            />
          ))}
        </div>

        {/* 塔选择 */}
        <div className="flex justify-center space-x-2 mb-4">
          {Object.entries(TOWER_TYPES).map(([type, config]) => (
            <Button
              key={type}
              onClick={() =>
                setGameState((prev) => ({
                  ...prev,
                  selectedTower: type as Tower["type"],
                }))
              }
              disabled={gameState.gold < config.cost}
              className={`px-3 py-1 text-sm ${
                gameState.selectedTower === type
                  ? "bg-blue-600 text-white"
                  : gameState.gold >= config.cost
                  ? "bg-gray-600 text-white hover:bg-gray-500"
                  : "bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} (${config.cost})
            </Button>
          ))}
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              💀 Game Over!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">
              Waves Survived: {gameState.wave - 1}
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
          <p>🎮 Click on the map to place towers</p>
          <p>⏸️ Press P to pause</p>
          <p>🏰 Build towers to defend against enemies</p>
          <p>💰 Earn gold by defeating enemies</p>
          <p>🔥 Different tower types have different abilities</p>
        </div>
      </Card>
    </div>
  );
}
