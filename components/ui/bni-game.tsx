"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Robot {
  id: string;
  x: number;
  y: number;
  battery: number;
  maxBattery: number;
  type: "worker" | "defender" | "charger";
  isActive: boolean;
}

interface Virus {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: "ice" | "fire" | "slime" | "metal" | "spirit";
  target: "generator" | "robot";
  speed: number;
}

interface Resource {
  id: string;
  x: number;
  y: number;
  type: "spring" | "metal" | "scrap" | "energy";
  amount: number;
}

interface GameState {
  robots: Robot[];
  viruses: Virus[];
  resources: Resource[];
  generator: {
    health: number;
    maxHealth: number;
    position: { x: number; y: number };
  };
  batteries: number;
  springs: number;
  metal: number;
  scrap: number;
  energy: number;
  score: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const ROBOT_SIZE = 20;
const VIRUS_SIZE = 15;
const RESOURCE_SIZE = 10;

const VIRUS_COLORS = {
  ice: "#87CEEB",
  fire: "#FF4500",
  slime: "#32CD32",
  metal: "#708090",
  spirit: "#9370DB"
};

const ROBOT_TYPES = {
  worker: { color: "#4169E1", speed: 2, batteryDrain: 0.5 },
  defender: { color: "#DC143C", speed: 1.5, batteryDrain: 1 },
  charger: { color: "#FFD700", speed: 1, batteryDrain: 0.2 }
};

export function BNIGame() {
  const [gameState, setGameState] = useState<GameState>({
    robots: [
      { id: "1", x: 100, y: 300, battery: 100, maxBattery: 100, type: "worker", isActive: true },
      { id: "2", x: 150, y: 300, battery: 100, maxBattery: 100, type: "defender", isActive: true },
      { id: "3", x: 200, y: 300, battery: 100, maxBattery: 100, type: "charger", isActive: true }
    ],
    viruses: [],
    resources: [
      { id: "1", x: 300, y: 200, type: "spring", amount: 5 },
      { id: "2", x: 400, y: 300, type: "metal", amount: 3 },
      { id: "3", x: 500, y: 400, type: "energy", amount: 10 }
    ],
    generator: {
      health: 100,
      maxHealth: 100,
      position: { x: 50, y: 300 }
    },
    batteries: 5,
    springs: 10,
    metal: 5,
    scrap: 0,
    energy: 20,
    score: 0,
    level: 1,
    gameOver: false,
    isPaused: false
  });

  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<"craft" | "charge" | "repair" | null>(null);

  // 游戏循环
  useEffect(() => {
    if (gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      setGameState(prev => {
        // 更新机器人电池
        const updatedRobots = prev.robots.map(robot => {
          if (robot.isActive) {
            const drain = ROBOT_TYPES[robot.type].batteryDrain;
            const newBattery = Math.max(0, robot.battery - drain);
            return { ...robot, battery: newBattery, isActive: newBattery > 0 };
          }
          return robot;
        });

        // 更新病毒移动
        const updatedViruses = prev.viruses.map(virus => {
          const target = virus.target === "generator" ? prev.generator.position : 
                        updatedRobots.find(r => r.id === virus.target) || { x: virus.x, y: virus.y };
          
          const dx = target.x - virus.x;
          const dy = target.y - virus.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 5) {
            const moveX = (dx / distance) * virus.speed;
            const moveY = (dy / distance) * virus.speed;
            return {
              ...virus,
              x: Math.max(0, Math.min(GAME_WIDTH, virus.x + moveX)),
              y: Math.max(0, Math.min(GAME_HEIGHT, virus.y + moveY))
            };
          }
          return virus;
        });

        // 检查碰撞
        let newGeneratorHealth = prev.generator.health;
        let newScore = prev.score;
        let newScrap = prev.scrap;

        const remainingViruses = updatedViruses.filter(virus => {
          // 检查与发电机的碰撞
          const distToGen = Math.sqrt(
            Math.pow(virus.x - prev.generator.position.x, 2) + 
            Math.pow(virus.y - prev.generator.position.y, 2)
          );
          
          if (distToGen < 30) {
            newGeneratorHealth = Math.max(0, newGeneratorHealth - 5);
            newScrap += 1;
            return false; // 移除病毒
          }

          // 检查与机器人的碰撞
          const hitRobot = updatedRobots.find(robot => {
            const dist = Math.sqrt(
              Math.pow(virus.x - robot.x, 2) + Math.pow(virus.y - robot.y, 2)
            );
            return dist < 25 && robot.isActive;
          });

          if (hitRobot) {
            newScore += 10;
            newScrap += 1;
            return false; // 移除病毒
          }

          return true;
        });

        // 生成新病毒
        const shouldSpawnVirus = Math.random() < 0.02 + (prev.level * 0.005);
        const newViruses = [...remainingViruses];
        
        if (shouldSpawnVirus) {
          const virusTypes: Array<keyof typeof VIRUS_COLORS> = ["ice", "fire", "slime", "metal", "spirit"];
          const type = virusTypes[Math.floor(Math.random() * virusTypes.length)];
          
          newViruses.push({
            id: Date.now().toString(),
            x: GAME_WIDTH - 50,
            y: Math.random() * (GAME_HEIGHT - 100) + 50,
            health: 20 + prev.level,
            maxHealth: 20 + prev.level,
            type,
            target: Math.random() < 0.7 ? "generator" : "robot",
            speed: 1 + Math.random()
          });
        }

        // 生成新资源
        const shouldSpawnResource = Math.random() < 0.01;
        const newResources = [...prev.resources];
        
        if (shouldSpawnResource) {
          const resourceTypes: Array<Resource["type"]> = ["spring", "metal", "energy"];
          const type = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
          
          newResources.push({
            id: Date.now().toString(),
            x: Math.random() * (GAME_WIDTH - 100) + 50,
            y: Math.random() * (GAME_HEIGHT - 100) + 50,
            type,
            amount: 1 + Math.floor(Math.random() * 3)
          });
        }

        // 检查游戏结束
        const gameOver = newGeneratorHealth <= 0;

        return {
          ...prev,
          robots: updatedRobots,
          viruses: newViruses,
          resources: newResources,
          generator: { ...prev.generator, health: newGeneratorHealth },
          scrap: newScrap,
          score: newScore,
          gameOver
        };
      });
    }, 100);

    return () => clearInterval(gameLoop);
  }, [gameState.gameOver, gameState.isPaused]);

  // 处理机器人移动
  const handleRobotMove = useCallback((robotId: string, targetX: number, targetY: number) => {
    setGameState(prev => ({
      ...prev,
      robots: prev.robots.map(robot => 
        robot.id === robotId 
          ? { ...robot, x: Math.max(0, Math.min(GAME_WIDTH - ROBOT_SIZE, targetX)), 
                     y: Math.max(0, Math.min(GAME_HEIGHT - ROBOT_SIZE, targetY)) }
          : robot
      )
    }));
  }, []);

  // 处理工具使用
  const handleToolUse = useCallback((tool: "craft" | "charge" | "repair") => {
    setGameState(prev => {
      switch (tool) {
        case "craft":
          if (prev.springs >= 2 && prev.metal >= 1) {
            return {
            ...prev,
            springs: prev.springs - 2,
            metal: prev.metal - 1,
            batteries: prev.batteries + 1
          };
          break;
        case "charge":
          if (prev.batteries > 0) {
            return {
              ...prev,
              batteries: prev.batteries - 1,
              robots: prev.robots.map(robot => 
                robot.id === selectedRobot 
                  ? { ...robot, battery: robot.maxBattery }
                  : robot
              )
            };
          }
          break;
        case "repair":
          if (prev.scrap >= 3) {
            return {
              ...prev,
              scrap: prev.scrap - 3,
              generator: { ...prev.generator, health: Math.min(prev.generator.maxHealth, prev.generator.health + 20) }
            };
          }
          break;
      }
      return prev;
    });
  }, [selectedRobot]);

  // 收集资源
  const collectResource = useCallback((resourceId: string) => {
    setGameState(prev => {
      const resource = prev.resources.find(r => r.id === resourceId);
      if (!resource) return prev;

      const updates: Partial<GameState> = {};
      switch (resource.type) {
        case "spring":
          updates.springs = prev.springs + resource.amount;
          break;
        case "metal":
          updates.metal = prev.metal + resource.amount;
          break;
        case "energy":
          updates.energy = prev.energy + resource.amount;
          break;
      }

      return {
        ...prev,
        ...updates,
        resources: prev.resources.filter(r => r.id !== resourceId)
      };
    });
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">🔋 Batteries Not Included</h2>
        <p className="text-white/70">Manage robots, defend your generator, and collect resources!</p>
      </div>

      {/* 游戏状态栏 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card className="p-3 bg-blue-900/50 border-blue-500/30">
          <div className="text-blue-300 text-sm font-medium">Generator Health</div>
          <div className="text-white text-lg font-bold">
            {gameState.generator.health}/{gameState.generator.maxHealth}
          </div>
        </Card>
        <Card className="p-3 bg-green-900/50 border-green-500/30">
          <div className="text-green-300 text-sm font-medium">Score</div>
          <div className="text-white text-lg font-bold">{gameState.score}</div>
        </Card>
        <Card className="p-3 bg-yellow-900/50 border-yellow-500/30">
          <div className="text-yellow-300 text-sm font-medium">Batteries</div>
          <div className="text-white text-lg font-bold">{gameState.batteries}</div>
        </Card>
        <Card className="p-3 bg-purple-900/50 border-purple-500/30">
          <div className="text-purple-300 text-sm font-medium">Level</div>
          <div className="text-white text-lg font-bold">{gameState.level}</div>
        </Card>
      </div>

      {/* 资源栏 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-spring-500/20 rounded-full border border-spring-500/30">
          <span>🔧</span>
          <span className="text-spring-300">{gameState.springs}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 rounded-full border border-gray-500/30">
          <span>⚙️</span>
          <span className="text-gray-300">{gameState.metal}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
          <span>⚡</span>
          <span className="text-yellow-300">{gameState.energy}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
          <span>🗑️</span>
          <span className="text-red-300">{gameState.scrap}</span>
        </div>
      </div>

      {/* 游戏区域 */}
      <Card className="relative bg-gray-900/50 border-gray-700/50 overflow-hidden" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
        {/* 发电机 */}
        <div
          className="absolute bg-gradient-to-r from-red-500 to-orange-500 rounded-lg border-2 border-red-400"
          style={{
            left: gameState.generator.position.x - 15,
            top: gameState.generator.position.y - 15,
            width: 30,
            height: 30
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
            ⚡
          </div>
        </div>

        {/* 机器人 */}
        {gameState.robots.map(robot => (
          <div
            key={robot.id}
            className={`absolute rounded-full border-2 cursor-pointer transition-all ${
              robot.isActive 
                ? `bg-${ROBOT_TYPES[robot.type].color} border-${ROBOT_TYPES[robot.type].color} hover:scale-110` 
                : 'bg-gray-500 border-gray-500 opacity-50'
            } ${selectedRobot === robot.id ? 'ring-2 ring-yellow-400' : ''}`}
            style={{
              left: robot.x - ROBOT_SIZE/2,
              top: robot.y - ROBOT_SIZE/2,
              width: ROBOT_SIZE,
              height: ROBOT_SIZE
            }}
            onClick={() => setSelectedRobot(robot.id)}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-white">
              {Math.round(robot.battery)}%
            </div>
          </div>
        ))}

        {/* 病毒 */}
        {gameState.viruses.map(virus => (
          <div
            key={virus.id}
            className="absolute rounded-full border-2 animate-pulse"
            style={{
              left: virus.x - VIRUS_SIZE/2,
              top: virus.y - VIRUS_SIZE/2,
              width: VIRUS_SIZE,
              height: VIRUS_SIZE,
              backgroundColor: VIRUS_COLORS[virus.type],
              borderColor: VIRUS_COLORS[virus.type]
            }}
          />
        ))}

        {/* 资源 */}
        {gameState.resources.map(resource => (
          <div
            key={resource.id}
            className="absolute rounded-full border-2 cursor-pointer hover:scale-110 transition-transform"
            style={{
              left: resource.x - RESOURCE_SIZE/2,
              top: resource.y - RESOURCE_SIZE/2,
              width: RESOURCE_SIZE,
              height: RESOURCE_SIZE,
              backgroundColor: resource.type === 'spring' ? '#8B4513' : 
                            resource.type === 'metal' ? '#708090' : '#FFD700'
            }}
            onClick={() => collectResource(resource.id)}
          >
            <div className="absolute inset-0 flex items-center justify-center text-xs">
              {resource.type === 'spring' ? '🔧' : 
               resource.type === 'metal' ? '⚙️' : '⚡'}
            </div>
          </div>
        ))}

        {/* 游戏结束覆盖层 */}
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-4">Game Over!</h3>
              <p className="mb-4">Final Score: {gameState.score}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Restart Game
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 控制面板 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-900/30 border-blue-500/30">
          <h3 className="text-white font-bold mb-2">🤖 Robot Control</h3>
          <div className="space-y-2">
            {gameState.robots.map(robot => (
              <div key={robot.id} className="flex items-center justify-between">
                <span className="text-white text-sm">
                  {robot.type} {robot.id}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-600 rounded">
                    <div 
                      className="h-full bg-green-500 rounded"
                      style={{ width: `${(robot.battery / robot.maxBattery) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-xs">{Math.round(robot.battery)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 bg-green-900/30 border-green-500/30">
          <h3 className="text-white font-bold mb-2">🔧 Crafting</h3>
          <div className="space-y-2">
            <Button
              onClick={() => handleToolUse("craft")}
              disabled={gameState.springs < 2 || gameState.metal < 1}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Craft Battery (2🔧 + 1⚙️)
            </Button>
            <Button
              onClick={() => handleToolUse("charge")}
              disabled={gameState.batteries < 1 || !selectedRobot}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              Charge Robot (1🔋)
            </Button>
            <Button
              onClick={() => handleToolUse("repair")}
              disabled={gameState.scrap < 3}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Repair Generator (3🗑️)
            </Button>
          </div>
        </Card>

        <Card className="p-4 bg-purple-900/30 border-purple-500/30">
          <h3 className="text-white font-bold mb-2">🎮 Instructions</h3>
          <div className="text-white/70 text-sm space-y-1">
            <p>• Click robots to select them</p>
            <p>• Collect resources (🔧⚙️⚡)</p>
            <p>• Craft batteries to power robots</p>
            <p>• Defend generator from viruses</p>
            <p>• Use scrap to repair generator</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
