"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Position {
  x: number;
  y: number;
}

interface Food {
  position: Position;
  type: "normal" | "bonus" | "speed" | "slow" | "invincible";
  points: number;
  color: string;
}

interface GameState {
  snake: Position[];
  foods: Food[];
  direction: Position;
  gameOver: boolean;
  score: number;
  highScore: number;
  level: number;
  speed: number;
  isPaused: boolean;
  specialEffects: {
    invincible: boolean;
    speedBoost: boolean;
    slowMotion: boolean;
  };
}

const GRID_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

const INITIAL_DIRECTION: Position = { x: 1, y: 0 };

const DIFFICULTY_LEVELS = {
  easy: { speed: 200, name: "Easy" },
  medium: { speed: 150, name: "Medium" },
  hard: { speed: 100, name: "Hard" },
  expert: { speed: 80, name: "Expert" },
};

export function SnakeGame() {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    foods: [],
    direction: INITIAL_DIRECTION,
    gameOver: false,
    score: 0,
    highScore: 0,
    level: 1,
    speed: 150,
    isPaused: false,
    specialEffects: {
      invincible: false,
      speedBoost: false,
      slowMotion: false,
    },
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [difficulty, setDifficulty] =
    useState<keyof typeof DIFFICULTY_LEVELS>("medium");

  // Generate random food with different types
  const generateFood = useCallback((): Food => {
    let newPosition: Position;
    do {
      newPosition = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      gameState.snake.some(
        (segment) => segment.x === newPosition.x && segment.y === newPosition.y
      )
    );

    const foodTypes: Food["type"][] = [
      "normal",
      "normal",
      "normal",
      "bonus",
      "speed",
      "slow",
      "invincible",
    ];
    const randomType = foodTypes[Math.floor(Math.random() * foodTypes.length)];

    const foodConfig = {
      normal: { points: 10, color: "bg-red-500" },
      bonus: { points: 50, color: "bg-yellow-500" },
      speed: { points: 20, color: "bg-blue-500" },
      slow: { points: 15, color: "bg-purple-500" },
      invincible: { points: 30, color: "bg-orange-500" },
    };

    return {
      position: newPosition,
      type: randomType,
      points: foodConfig[randomType as keyof typeof foodConfig].points,
      color: foodConfig[randomType as keyof typeof foodConfig].color,
    };
  }, [gameState.snake]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const currentSpeed = gameState.specialEffects.speedBoost
      ? gameState.speed * 0.5
      : gameState.specialEffects.slowMotion
      ? gameState.speed * 1.5
      : gameState.speed;

    const gameLoop = setInterval(() => {
      setGameState((prevState) => {
        const newSnake = [...prevState.snake];
        const head = { ...newSnake[0] };

        // Move head
        head.x += prevState.direction.x;
        head.y += prevState.direction.y;

        // Check wall collision (with invincibility)
        if (
          !prevState.specialEffects.invincible &&
          (head.x < 0 ||
            head.x >= GRID_SIZE ||
            head.y < 0 ||
            head.y >= GRID_SIZE)
        ) {
          return { ...prevState, gameOver: true };
        }

        // Wrap around if invincible
        if (prevState.specialEffects.invincible) {
          if (head.x < 0) head.x = GRID_SIZE - 1;
          if (head.x >= GRID_SIZE) head.x = 0;
          if (head.y < 0) head.y = GRID_SIZE - 1;
          if (head.y >= GRID_SIZE) head.y = 0;
        }

        // Check self collision
        if (
          !prevState.specialEffects.invincible &&
          newSnake.some(
            (segment) => segment.x === head.x && segment.y === head.y
          )
        ) {
          return { ...prevState, gameOver: true };
        }

        newSnake.unshift(head);

        // Check food collision
        const eatenFoodIndex = prevState.foods.findIndex(
          (food) => food.position.x === head.x && food.position.y === head.y
        );

        if (eatenFoodIndex !== -1) {
          const eatenFood = prevState.foods[eatenFoodIndex];
          const newFoods = prevState.foods.filter(
            (_, index) => index !== eatenFoodIndex
          );

          // Apply special effects based on food type
          let newSpecialEffects = { ...prevState.specialEffects };
          if (eatenFood.type === "speed") {
            newSpecialEffects.speedBoost = true;
            setTimeout(() => {
              setGameState((prev) => ({
                ...prev,
                specialEffects: { ...prev.specialEffects, speedBoost: false },
              }));
            }, 5000);
          } else if (eatenFood.type === "slow") {
            newSpecialEffects.slowMotion = true;
            setTimeout(() => {
              setGameState((prev) => ({
                ...prev,
                specialEffects: { ...prev.specialEffects, slowMotion: false },
              }));
            }, 3000);
          } else if (eatenFood.type === "invincible") {
            newSpecialEffects.invincible = true;
            setTimeout(() => {
              setGameState((prev) => ({
                ...prev,
                specialEffects: { ...prev.specialEffects, invincible: false },
              }));
            }, 10000);
          }

          // Add new food if needed
          const updatedFoods =
            newFoods.length === 0 ? [generateFood()] : newFoods;

          return {
            ...prevState,
            snake: newSnake,
            foods: updatedFoods,
            score: prevState.score + eatenFood.points,
            level: Math.floor((prevState.score + eatenFood.points) / 100) + 1,
            specialEffects: newSpecialEffects,
          };
        } else {
          newSnake.pop();
        }

        return { ...prevState, snake: newSnake };
      });
    }, currentSpeed);

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    gameState.speed,
    gameState.specialEffects,
    generateFood,
  ]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver) return;

      const key = e.key.toLowerCase();

      // Handle pause/resume with spacebar
      if (key === " ") {
        e.preventDefault();
        setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
        return;
      }

      setGameState((prevState) => {
        let newDirection = { ...prevState.direction };

        switch (key) {
          case "arrowup":
          case "w":
            if (prevState.direction.y !== 1) {
              newDirection = { x: 0, y: -1 };
            }
            break;
          case "arrowdown":
          case "s":
            if (prevState.direction.y !== -1) {
              newDirection = { x: 0, y: 1 };
            }
            break;
          case "arrowleft":
          case "a":
            if (prevState.direction.x !== 1) {
              newDirection = { x: -1, y: 0 };
            }
            break;
          case "arrowright":
          case "d":
            if (prevState.direction.x !== -1) {
              newDirection = { x: 1, y: 0 };
            }
            break;
        }

        return { ...prevState, direction: newDirection };
      });
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, gameState.gameOver]);

  const startGame = () => {
    setGameState({
      snake: INITIAL_SNAKE,
      foods: [generateFood()],
      direction: INITIAL_DIRECTION,
      gameOver: false,
      score: 0,
      highScore: Math.max(gameState.highScore, gameState.score),
      level: 1,
      speed: DIFFICULTY_LEVELS[difficulty].speed,
      isPaused: false,
      specialEffects: {
        invincible: false,
        speedBoost: false,
        slowMotion: false,
      },
    });
    setIsPlaying(true);
  };

  const stopGame = () => {
    setIsPlaying(false);
  };

  const resetGame = () => {
    setGameState({
      snake: INITIAL_SNAKE,
      foods: [generateFood()],
      direction: INITIAL_DIRECTION,
      gameOver: false,
      score: 0,
      highScore: Math.max(gameState.highScore, gameState.score),
      level: 1,
      speed: DIFFICULTY_LEVELS[difficulty].speed,
      isPaused: false,
      specialEffects: {
        invincible: false,
        speedBoost: false,
        slowMotion: false,
      },
    });
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🐍 Snake Game</h2>
          <p className="text-white/70">
            Use arrow keys or WASD to control the snake
          </p>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              High Score: {gameState.highScore}
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
              const isSnake = gameState.snake.some(
                (segment) => segment.x === x && segment.y === y
              );
              const foodAtPosition = gameState.foods.find(
                (food) => food.position.x === x && food.position.y === y
              );
              const isHead =
                gameState.snake[0]?.x === x && gameState.snake[0]?.y === y;

              return (
                <div
                  key={index}
                  className={`w-5 h-5 ${
                    isHead
                      ? "bg-yellow-400"
                      : isSnake
                      ? "bg-green-500"
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
            <p className="text-2xl font-bold text-red-400 mb-2">Game Over!</p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
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
        <div className="mt-4 text-center text-white/60 text-sm">
          <p>🎮 Use Arrow Keys or WASD to move</p>
          <p>🍎 Red food: +10 points</p>
          <p>⭐ Yellow food: +50 points (bonus)</p>
          <p>⚡ Blue food: Speed boost for 5s</p>
          <p>🐌 Purple food: Slow motion for 3s</p>
          <p>🛡️ Orange food: Invincible for 10s</p>
          <p>💀 Don't hit the walls or yourself!</p>
          <p>⏸️ Press SPACE to pause/resume</p>
        </div>
      </Card>
    </div>
  );
}
