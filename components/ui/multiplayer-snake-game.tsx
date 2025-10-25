"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface Snake {
  body: Position[];
  direction: Position;
  color: string;
  name: string;
  score: number;
  isAlive: boolean;
}

interface Food {
  position: Position;
  type: "normal" | "bonus" | "speed" | "slow" | "invincible" | "multiplayer";
  points: number;
  color: string;
  size: number;
}

interface GameState {
  snakes: Snake[];
  foods: Food[];
  gameOver: boolean;
  winner: string | null;
  isPaused: boolean;
  level: number;
  speed: number;
  specialEffects: {
    speedBoost: boolean;
    slowMotion: boolean;
    invincible: boolean;
  };
}

const GRID_SIZE = 25;
const INITIAL_SNAKES: Snake[] = [
  {
    body: [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ],
    direction: { x: 1, y: 0 },
    color: "bg-green-500",
    name: "Player 1",
    score: 0,
    isAlive: true,
  },
  {
    body: [
      { x: 19, y: 19 },
      { x: 20, y: 19 },
      { x: 21, y: 19 },
    ],
    direction: { x: -1, y: 0 },
    color: "bg-blue-500",
    name: "Player 2",
    score: 0,
    isAlive: true,
  },
];

const DIFFICULTY_LEVELS = {
  easy: { speed: 200, name: "Easy" },
  medium: { speed: 150, name: "Medium" },
  hard: { speed: 100, name: "Hard" },
  expert: { speed: 80, name: "Expert" },
};

export function MultiplayerSnakeGame() {
  const [gameState, setGameState] = useState<GameState>({
    snakes: INITIAL_SNAKES.map((snake) => ({ ...snake })),
    foods: [],
    gameOver: false,
    winner: null,
    isPaused: false,
    level: 1,
    speed: 150,
    specialEffects: {
      speedBoost: false,
      slowMotion: false,
      invincible: false,
    },
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

  // 生成随机食物
  const generateFood = useCallback((): Food => {
    let newPosition: Position;
    do {
      newPosition = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      gameState.snakes.some((snake) =>
        snake.body.some(
          (segment) =>
            segment.x === newPosition.x && segment.y === newPosition.y
        )
      ) ||
      gameState.foods.some(
        (food) =>
          food.position.x === newPosition.x && food.position.y === newPosition.y
      )
    );

    const foodTypes: Food["type"][] = [
      "normal",
      "normal",
      "normal",
      "normal",
      "bonus",
      "speed",
      "slow",
      "invincible",
      "multiplayer",
    ];
    const randomType = foodTypes[Math.floor(Math.random() * foodTypes.length)];

    const foodConfig = {
      normal: { points: 10, color: "bg-red-500", size: 1 },
      bonus: { points: 50, color: "bg-yellow-500", size: 1 },
      speed: { points: 20, color: "bg-blue-500", size: 1 },
      slow: { points: 15, color: "bg-purple-500", size: 1 },
      invincible: { points: 30, color: "bg-orange-500", size: 1 },
      multiplayer: { points: 100, color: "bg-pink-500", size: 2 },
    };

    return {
      position: newPosition,
      type: randomType,
      points: foodConfig[randomType as keyof typeof foodConfig].points,
      color: foodConfig[randomType as keyof typeof foodConfig].color,
      size: foodConfig[randomType as keyof typeof foodConfig].size,
    };
  }, [gameState.snakes, gameState.foods]);

  // 检查碰撞
  const checkCollision = useCallback(
    (snake: Snake, otherSnakes: Snake[]): boolean => {
      const head = snake.body[0];

      // 检查墙壁碰撞
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        return true;
      }

      // 检查自身碰撞
      for (let i = 1; i < snake.body.length; i++) {
        if (snake.body[i].x === head.x && snake.body[i].y === head.y) {
          return true;
        }
      }

      // 检查与其他蛇的碰撞
      for (const otherSnake of otherSnakes) {
        if (otherSnake === snake) continue;
        for (const segment of otherSnake.body) {
          if (segment.x === head.x && segment.y === head.y) {
            return true;
          }
        }
      }

      return false;
    },
    []
  );

  // 移动蛇
  const moveSnake = useCallback(
    (snake: Snake, otherSnakes: Snake[]): Snake => {
      const newSnake = { ...snake };
      const head = { ...newSnake.body[0] };

      head.x += newSnake.direction.x;
      head.y += newSnake.direction.y;

      newSnake.body.unshift(head);

      // 检查碰撞
      if (checkCollision(newSnake, otherSnakes)) {
        newSnake.isAlive = false;
        return newSnake;
      }

      // 检查食物碰撞
      const eatenFoodIndex = gameState.foods.findIndex(
        (food) => food.position.x === head.x && food.position.y === head.y
      );

      if (eatenFoodIndex !== -1) {
        const eatenFood = gameState.foods[eatenFoodIndex];
        newSnake.score += eatenFood.points;

        // 根据食物类型应用特殊效果
        if (eatenFood.type === "speed") {
          // 加速效果
          setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              specialEffects: { ...prev.specialEffects, speedBoost: false },
            }));
          }, 5000);
        } else if (eatenFood.type === "slow") {
          // 减速效果
          setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              specialEffects: { ...prev.specialEffects, slowMotion: false },
            }));
          }, 3000);
        } else if (eatenFood.type === "invincible") {
          // 无敌效果
          setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              specialEffects: { ...prev.specialEffects, invincible: false },
            }));
          }, 10000);
        } else if (eatenFood.type === "multiplayer") {
          // 多人模式特殊效果 - 所有蛇都获得分数
          setGameState((prev) => ({
            ...prev,
            snakes: prev.snakes.map((s) => ({
              ...s,
              score: s.score + eatenFood.points / 2,
            })),
          }));
        }

        // 移除被吃的食物
        setGameState((prev) => ({
          ...prev,
          foods: prev.foods.filter((_, index) => index !== eatenFoodIndex),
        }));
      } else {
        // 没有吃到食物，移除尾巴
        newSnake.body.pop();
      }

      return newSnake;
    },
    [gameState.foods, checkCollision]
  );

  // 游戏循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const currentSpeed = gameState.specialEffects.speedBoost
      ? gameState.speed * 0.5
      : gameState.specialEffects.slowMotion
      ? gameState.speed * 1.5
      : gameState.speed;

    const gameLoop = setInterval(() => {
      setGameState((prevState) => {
        const aliveSnakes = prevState.snakes.filter((snake) => snake.isAlive);
        if (aliveSnakes.length <= 1) {
          const winner =
            aliveSnakes.length === 1 ? aliveSnakes[0].name : "Draw";
          return { ...prevState, gameOver: true, winner };
        }

        // 移动所有活着的蛇
        const newSnakes = prevState.snakes.map((snake) => {
          if (!snake.isAlive) return snake;
          return moveSnake(snake, prevState.snakes);
        });

        // 检查游戏结束
        const stillAlive = newSnakes.filter((snake) => snake.isAlive);
        if (stillAlive.length <= 1) {
          const winner = stillAlive.length === 1 ? stillAlive[0].name : "Draw";
          return { ...prevState, snakes: newSnakes, gameOver: true, winner };
        }

        // 添加新食物
        const newFoods =
          prevState.foods.length === 0 ? [generateFood()] : prevState.foods;

        return { ...prevState, snakes: newSnakes, foods: newFoods };
      });
    }, currentSpeed);

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    gameState.speed,
    gameState.specialEffects,
    moveSnake,
    generateFood,
  ]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver) return;

      const key = e.key.toLowerCase();

      // 暂停/恢复
      if (key === " ") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
        return;
      }

      setGameState((prevState) => {
        const newSnakes = [...prevState.snakes];

        // Player 1 控制 (WASD)
        if (newSnakes[0] && newSnakes[0].isAlive) {
          let newDirection = { ...newSnakes[0].direction };
          switch (key) {
            case "w":
              if (newSnakes[0].direction.y !== 1)
                newDirection = { x: 0, y: -1 };
              break;
            case "s":
              if (newSnakes[0].direction.y !== -1)
                newDirection = { x: 0, y: 1 };
              break;
            case "a":
              if (newSnakes[0].direction.x !== 1)
                newDirection = { x: -1, y: 0 };
              break;
            case "d":
              if (newSnakes[0].direction.x !== -1)
                newDirection = { x: 1, y: 0 };
              break;
          }
          newSnakes[0].direction = newDirection;
        }

        // Player 2 控制 (Arrow Keys)
        if (newSnakes[1] && newSnakes[1].isAlive) {
          let newDirection = { ...newSnakes[1].direction };
          switch (key) {
            case "arrowup":
              if (newSnakes[1].direction.y !== 1)
                newDirection = { x: 0, y: -1 };
              break;
            case "arrowdown":
              if (newSnakes[1].direction.y !== -1)
                newDirection = { x: 0, y: 1 };
              break;
            case "arrowleft":
              if (newSnakes[1].direction.x !== 1)
                newDirection = { x: -1, y: 0 };
              break;
            case "arrowright":
              if (newSnakes[1].direction.x !== -1)
                newDirection = { x: 1, y: 0 };
              break;
          }
          newSnakes[1].direction = newDirection;
        }

        return { ...prevState, snakes: newSnakes };
      });
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, gameState.gameOver]);

  const startGame = () => {
    setGameState({
      snakes: INITIAL_SNAKES.map((snake) => ({ ...snake })),
      foods: [generateFood()],
      gameOver: false,
      winner: null,
      isPaused: false,
      level: 1,
      speed: DIFFICULTY_LEVELS[difficulty].speed,
      specialEffects: {
        speedBoost: false,
        slowMotion: false,
        invincible: false,
      },
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Multiplayer Snake",
      "multiplayer-snake-game"
    );
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(
        gameState.snakes.reduce((total, snake) => total + snake.score, 0)
      );
      setGameRecorder(null);
    }
  };

  const resetGame = () => {
    setGameState({
      snakes: INITIAL_SNAKES.map((snake) => ({ ...snake })),
      foods: [generateFood()],
      gameOver: false,
      winner: null,
      isPaused: false,
      level: 1,
      speed: DIFFICULTY_LEVELS[difficulty].speed,
      specialEffects: {
        speedBoost: false,
        slowMotion: false,
        invincible: false,
      },
    });
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🐍🐍 Multiplayer Snake
          </h2>
          <p className="text-white/70">Player 1: WASD | Player 2: Arrow Keys</p>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">
              P1 Score: {gameState.snakes[0]?.score || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              P2 Score: {gameState.snakes[1]?.score || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Level: {gameState.level}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Speed: {DIFFICULTY_LEVELS[difficulty].name}
            </div>
          </div>
        </div>

        {/* Special Effects Display */}
        {Object.values(gameState.specialEffects).some((effect) => effect) && (
          <div className="mb-4 text-center">
            <div className="text-sm text-yellow-400">
              {gameState.specialEffects.speedBoost && "⚡ Speed Boost! "}
              {gameState.specialEffects.slowMotion && "🐌 Slow Motion! "}
              {gameState.specialEffects.invincible && "🛡️ Invincible! "}
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className="relative mx-auto mb-6">
          <div
            className="grid gap-0 border-2 border-white/30 rounded-lg overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              width: `${GRID_SIZE * 20}px`,
              height: `${GRID_SIZE * 20}px`,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);

              // 检查蛇身
              let snakeInfo = null;
              for (const snake of gameState.snakes) {
                const segmentIndex = snake.body.findIndex(
                  (segment) => segment.x === x && segment.y === y
                );
                if (segmentIndex !== -1) {
                  snakeInfo = { snake, segmentIndex };
                  break;
                }
              }

              const foodAtPosition = gameState.foods.find(
                (food) => food.position.x === x && food.position.y === y
              );

              return (
                <div
                  key={index}
                  className={`w-5 h-5 ${
                    snakeInfo
                      ? snakeInfo.segmentIndex === 0
                        ? `${snakeInfo.snake.color} ring-2 ring-white`
                        : snakeInfo.snake.color
                      : foodAtPosition
                      ? `${foodAtPosition.color} rounded-full animate-pulse`
                      : "bg-gray-800"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Game Over Message */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-green-400 mb-2">
              🎉 {gameState.winner} Wins!
            </p>
            <p className="text-white/70">
              Final Scores - P1: {gameState.snakes[0]?.score || 0} | P2:{" "}
              {gameState.snakes[1]?.score || 0}
            </p>
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
          <p>🎮 Player 1: WASD keys</p>
          <p>🎮 Player 2: Arrow keys</p>
          <p>🍎 Red food: +10 points</p>
          <p>⭐ Yellow food: +50 points (bonus)</p>
          <p>⚡ Blue food: Speed boost for 5s</p>
          <p>🐌 Purple food: Slow motion for 3s</p>
          <p>🛡️ Orange food: Invincible for 10s</p>
          <p>💖 Pink food: Both players get points!</p>
          <p>⏸️ Press SPACE to pause/resume</p>
          <p>💀 Don&apos;t hit walls, yourself, or other snakes!</p>
        </div>
      </Card>
    </div>
  );
}
