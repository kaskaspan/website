"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Obstacle {
  id: string;
  rotation: number;
  gapAngle: number;
  color: string;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3"];
const OBSTACLE_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#95E1D3",
  "#A8E6CF",
  "#FFD93D",
];
const GAME_SIZE = 400;
const BALL_SIZE = 20;
const OBSTACLE_SIZE = 300;
const ROTATION_SPEED = 2;
const BALL_SPEED = 3;

export function ColorSwitchGame() {
  const [ballColor, setBallColor] = useState(COLORS[0]);
  const [ballAngle, setBallAngle] = useState(0);
  const [ballRadius, setBallRadius] = useState(GAME_SIZE / 2 - 50);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem("colorSwitchHighScore");
    if (stored) setHighScore(parseInt(stored, 10));
  }, []);

  // 生成障碍物
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const interval = setInterval(() => {
      const newObstacle: Obstacle = {
        id: Date.now().toString(),
        rotation: 0,
        gapAngle: (Math.random() * 60 + 30) * (Math.PI / 180),
        color:
          OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)],
      };
      setObstacles((prev) => [...prev, newObstacle]);
    }, 1500 / gameSpeed);

    return () => clearInterval(interval);
  }, [isStarted, gameOver, gameSpeed]);

  // 游戏循环
  useEffect(() => {
    if (!isStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // 移动障碍物
      setObstacles((obs) =>
        obs
          .map((ob) => ({
            ...ob,
            rotation: ob.rotation + ROTATION_SPEED * (Math.PI / 180),
          }))
          .map((ob) => ({
            ...ob,
            ballRadius: ballRadius,
          }))
          .filter((ob) => {
            // 检查碰撞
            const ballRad = (ballAngle * Math.PI) / 180;
            const obstacleStart = ob.rotation - ob.gapAngle / 2;
            const obstacleEnd = ob.rotation + ob.gapAngle / 2;

            // 检查是否通过障碍物
            const normalizedBall =
              ((ballRad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const normalizedStart =
              ((obstacleStart % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const normalizedEnd =
              ((obstacleEnd % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

            if (
              normalizedBall >= normalizedStart &&
              normalizedBall <= normalizedEnd
            ) {
              return true; // 在间隙中，安全
            }

            // 检查颜色匹配
            if (ballColor !== ob.color) {
              setGameOver(true);
              setHighScore((hs) => {
                const newHigh = Math.max(hs, score);
                localStorage.setItem(
                  "colorSwitchHighScore",
                  newHigh.toString()
                );
                return newHigh;
              });
            }

            return true;
          })
      );

      // 球围绕中心旋转
      setBallAngle((angle) => (angle + BALL_SPEED * gameSpeed) % 360);

      // 检查是否通过障碍物（增加分数）
      obstacles.forEach((ob) => {
        const ballRad = (ballAngle * Math.PI) / 180;
        const obstacleAngle = ob.rotation;
        const diff = Math.abs(ballRad - obstacleAngle);
        if (diff < 0.1 && ballColor === ob.color) {
          setScore((s) => {
            const newScore = s + 1;
            if (newScore % 5 === 0) {
              setGameSpeed((gs) => Math.min(gs + 0.1, 3));
            }
            return newScore;
          });
        }
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [
    isStarted,
    gameOver,
    ballAngle,
    ballColor,
    ballRadius,
    obstacles,
    score,
    gameSpeed,
  ]);

  const switchColor = useCallback(() => {
    if (gameOver) return;
    const currentIndex = COLORS.indexOf(ballColor);
    const nextIndex = (currentIndex + 1) % COLORS.length;
    setBallColor(COLORS[nextIndex]);
  }, [gameOver, ballColor]);

  const start = () => {
    setIsStarted(true);
    setBallColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const reset = () => {
    setBallColor(COLORS[0]);
    setBallAngle(0);
    setBallRadius(GAME_SIZE / 2 - 50);
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setIsStarted(false);
    setGameSpeed(1);
  };

  // 键盘和点击控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        switchColor();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [switchColor]);

  const ballX =
    GAME_SIZE / 2 + ballRadius * Math.cos((ballAngle * Math.PI) / 180);
  const ballY =
    GAME_SIZE / 2 + ballRadius * Math.sin((ballAngle * Math.PI) / 180);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold text-white mb-2">🌈 Color Switch</h2>
        <div className="flex justify-center gap-4 text-white">
          <div>Score: {score}</div>
          <div>Best: {highScore}</div>
        </div>
      </div>

      <Card
        className="relative overflow-hidden border-2 border-purple-400"
        style={{
          width: GAME_SIZE,
          height: GAME_SIZE,
          background: `radial-gradient(circle, ${COLORS.join(", ")})`,
        }}
        onClick={switchColor}
      >
        {/* 障碍物 */}
        {obstacles.map((obstacle) => {
          const centerX = GAME_SIZE / 2;
          const centerY = GAME_SIZE / 2;
          const radius = OBSTACLE_SIZE / 2;

          return (
            <svg
              key={obstacle.id}
              width={GAME_SIZE}
              height={GAME_SIZE}
              className="absolute top-0 left-0 pointer-events-none"
            >
              <g
                transform={`translate(${centerX}, ${centerY}) rotate(${
                  (obstacle.rotation * 180) / Math.PI
                })`}
              >
                <circle
                  cx={0}
                  cy={0}
                  r={radius}
                  fill="none"
                  stroke={obstacle.color}
                  strokeWidth={30}
                  strokeDasharray={`${
                    (obstacle.gapAngle * radius) / (Math.PI / 180)
                  } ${2 * Math.PI * radius}`}
                  strokeDashoffset={0}
                />
              </g>
            </svg>
          );
        })}

        {/* 球 */}
        <div
          className="absolute rounded-full border-2 border-white transition-all"
          style={{
            left: ballX - BALL_SIZE / 2,
            top: ballY - BALL_SIZE / 2,
            width: BALL_SIZE,
            height: BALL_SIZE,
            backgroundColor: ballColor,
            boxShadow: `0 0 20px ${ballColor}`,
          }}
        />

        {/* 中心点 */}
        <div
          className="absolute rounded-full bg-white/50"
          style={{
            left: GAME_SIZE / 2 - 5,
            top: GAME_SIZE / 2 - 5,
            width: 10,
            height: 10,
          }}
        />

        {/* 游戏开始/结束覆盖层 */}
        {!isStarted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white">
              <h3 className="text-2xl font-bold mb-2">Color Switch</h3>
              <p className="mb-4">Click or press Space to change color!</p>
              <Button
                onClick={start}
                className="bg-purple-600 hover:bg-purple-700"
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
                className="bg-purple-600 hover:bg-purple-700 mt-4"
              >
                Play Again
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-4 text-center text-white/70 text-sm">
        Click or press Space to change color
      </div>
    </div>
  );
}
