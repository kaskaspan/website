"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Lane {
  id: string;
  y: number;
  type: "road" | "water" | "grass";
  direction: "left" | "right" | "none";
  speed: number;
  obstacles: Obstacle[];
}

interface Obstacle {
  id: string;
  x: number;
  type: "car" | "log" | "turtle";
}

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const LANE_HEIGHT = 60;
const PLAYER_SIZE = 40;

export function CrossyRoadGame() {
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2);
  const [playerY, setPlayerY] = useState(GAME_HEIGHT - LANE_HEIGHT);
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("crossyRoadHighScore");
    if (stored) setHighScore(parseInt(stored, 10));

    // 初始化车道
    const initialLanes: Lane[] = [];
    for (let i = 0; i < 15; i++) {
      const y = GAME_HEIGHT - i * LANE_HEIGHT;
      const laneType = i % 3 === 0 ? "grass" : i % 3 === 1 ? "road" : "water";
      initialLanes.push({
        id: `lane-${i}`,
        y,
        type: laneType,
        direction:
          laneType === "grass" ? "none" : i % 2 === 0 ? "left" : "right",
        speed: 1 + Math.random() * 2,
        obstacles: [],
      });
    }
    setLanes(initialLanes);
  }, []);

  // 生成障碍物
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const interval = setInterval(() => {
      setLanes((ls) =>
        ls.map((lane) => {
          if (lane.type === "grass" || lane.obstacles.length > 0) return lane;

          if (Math.random() < 0.3) {
            const obstacle: Obstacle = {
              id: Date.now().toString() + Math.random(),
              x: lane.direction === "left" ? GAME_WIDTH : -40,
              type:
                lane.type === "water"
                  ? Math.random() < 0.5
                    ? "log"
                    : "turtle"
                  : "car",
            };
            return { ...lane, obstacles: [...lane.obstacles, obstacle] };
          }
          return lane;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, gameOver]);

  // 游戏循环
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      setLanes((ls) =>
        ls.map((lane) => ({
          ...lane,
          obstacles: lane.obstacles
            .map((obs) => ({
              ...obs,
              x:
                lane.direction === "left"
                  ? obs.x - lane.speed
                  : obs.x + lane.speed,
            }))
            .filter((obs) => {
              // 检查碰撞
              const obsLeft = obs.x;
              const obsRight = obs.x + 60;
              const obsTop = lane.y;
              const obsBottom = lane.y + LANE_HEIGHT;
              const playerLeft = playerX;
              const playerRight = playerX + PLAYER_SIZE;
              const playerTop = playerY;
              const playerBottom = playerY + PLAYER_SIZE;

              if (
                playerRight > obsLeft &&
                playerLeft < obsRight &&
                playerBottom > obsTop &&
                playerTop < obsBottom
              ) {
                if (lane.type === "water") {
                  // 在水中，检查是否在木头上
                  if (obs.type === "log" || obs.type === "turtle") {
                    return true; // 安全，在木头上
                  }
                }
                // 碰撞！
                setGameOver(true);
                setHighScore((hs) => {
                  const newHigh = Math.max(hs, score);
                  localStorage.setItem(
                    "crossyRoadHighScore",
                    newHigh.toString()
                  );
                  return newHigh;
                });
              }

              return obs.x > -100 && obs.x < GAME_WIDTH + 100;
            }),
        }))
      );

      // 更新玩家在水中时的位置（如果在木头上）
      lanes.forEach((lane) => {
        if (
          lane.type === "water" &&
          playerY >= lane.y &&
          playerY < lane.y + LANE_HEIGHT
        ) {
          const onObstacle = lane.obstacles.some((obs) => {
            return (
              playerX + PLAYER_SIZE / 2 >= obs.x &&
              playerX + PLAYER_SIZE / 2 <= obs.x + 60 &&
              (obs.type === "log" || obs.type === "turtle")
            );
          });

          if (onObstacle) {
            const obstacle = lane.obstacles.find(
              (obs) =>
                playerX + PLAYER_SIZE / 2 >= obs.x &&
                playerX + PLAYER_SIZE / 2 <= obs.x + 60
            );
            if (obstacle) {
              setPlayerX((px) =>
                lane.direction === "left" ? px - lane.speed : px + lane.speed
              );
            }
          } else {
            // 不在木头上，掉入水中
            setTimeout(() => {
              setGameOver(true);
              setHighScore((hs) => {
                const newHigh = Math.max(hs, score);
                localStorage.setItem("crossyRoadHighScore", newHigh.toString());
                return newHigh;
              });
            }, 100);
          }
        }
      });

      // 检查是否掉出屏幕
      if (
        playerY < 0 ||
        playerY > GAME_HEIGHT ||
        playerX < -20 ||
        playerX > GAME_WIDTH
      ) {
        setGameOver(true);
      }
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isStarted, gameOver, playerX, playerY, lanes, score]);

  const move = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (gameOver || !isStarted) return;

      setPlayerY((y) => {
        const newY =
          direction === "up"
            ? Math.max(0, y - LANE_HEIGHT)
            : direction === "down"
            ? Math.min(GAME_HEIGHT - LANE_HEIGHT, y + LANE_HEIGHT)
            : y;

        // 检查是否前进（得分）
        if (direction === "up" && newY < y) {
          setScore((s) => s + 1);
        }

        return newY;
      });

      setPlayerX((x) => {
        if (direction === "left") {
          return Math.max(0, x - LANE_HEIGHT);
        } else if (direction === "right") {
          return Math.min(GAME_WIDTH - PLAYER_SIZE, x + LANE_HEIGHT);
        }
        return x;
      });
    },
    [gameOver, isStarted]
  );

  const start = () => {
    setIsStarted(true);
  };

  const reset = () => {
    setPlayerX(GAME_WIDTH / 2);
    setPlayerY(GAME_HEIGHT - LANE_HEIGHT);
    setScore(0);
    setGameOver(false);
    setIsStarted(false);

    const initialLanes: Lane[] = [];
    for (let i = 0; i < 15; i++) {
      const y = GAME_HEIGHT - i * LANE_HEIGHT;
      const laneType = i % 3 === 0 ? "grass" : i % 3 === 1 ? "road" : "water";
      initialLanes.push({
        id: `lane-${i}`,
        y,
        type: laneType,
        direction:
          laneType === "grass" ? "none" : i % 2 === 0 ? "left" : "right",
        speed: 1 + Math.random() * 2,
        obstacles: [],
      });
    }
    setLanes(initialLanes);
  };

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          e.preventDefault();
          move("up");
          break;
        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          move("down");
          break;
        case "ArrowLeft":
        case "KeyA":
          e.preventDefault();
          move("left");
          break;
        case "ArrowRight":
        case "KeyD":
          e.preventDefault();
          move("right");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [move]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-2">🦘 Crossy Road</h2>
        <div className="flex justify-center gap-4 text-white">
          <div>Score: {score}</div>
          <div>Best: {highScore}</div>
        </div>
      </div>

      <Card
        className="relative overflow-hidden border-2 border-green-500"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* 车道 */}
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className={`absolute left-0 right-0 ${
              lane.type === "grass"
                ? "bg-green-400"
                : lane.type === "water"
                ? "bg-blue-400"
                : "bg-gray-600"
            }`}
            style={{
              top: lane.y,
              height: LANE_HEIGHT,
            }}
          >
            {/* 道路标线 */}
            {lane.type === "road" && (
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 border-t border-b border-yellow-500" />
            )}
          </div>
        ))}

        {/* 障碍物 */}
        {lanes.map((lane) =>
          lane.obstacles.map((obs) => (
            <div
              key={obs.id}
              className={`absolute ${
                obs.type === "car"
                  ? "bg-red-500"
                  : obs.type === "log"
                  ? "bg-yellow-800"
                  : "bg-green-600"
              } rounded`}
              style={{
                left: obs.x,
                top: lane.y + 10,
                width: 60,
                height: LANE_HEIGHT - 20,
              }}
            >
              {obs.type === "car" && (
                <>
                  <div className="absolute top-2 left-2 w-4 h-4 bg-black rounded" />
                  <div className="absolute top-2 right-2 w-4 h-4 bg-black rounded" />
                </>
              )}
              {obs.type === "turtle" && (
                <div className="absolute inset-2 bg-green-700 rounded-full" />
              )}
            </div>
          ))
        )}

        {/* 玩家 */}
        <div
          className="absolute bg-yellow-400 rounded-full border-2 border-yellow-600 transition-all"
          style={{
            left: playerX,
            top: playerY,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE,
          }}
        >
          <div className="absolute top-2 left-2 w-3 h-3 bg-black rounded-full" />
          <div className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full" />
        </div>

        {/* 游戏开始/结束覆盖层 */}
        {!isStarted && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Crossy Road</h3>
              <p className="mb-4">Use arrow keys or WASD to move!</p>
              <Button
                onClick={start}
                className="bg-green-600 hover:bg-green-700"
              >
                Start
              </Button>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-3xl font-bold mb-4">Game Over!</h3>
              <p className="text-xl mb-2">Score: {score}</p>
              {score === highScore && score > 0 && (
                <p className="text-yellow-400 mb-4">🎉 New High Score!</p>
              )}
              <Button
                onClick={reset}
                className="bg-green-600 hover:bg-green-700 mt-4"
              >
                Play Again
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 text-center text-white/70 text-sm">
        Use arrow keys or WASD to move
      </div>
    </div>
  );
}
