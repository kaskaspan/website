"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface Paddle {
  position: Position;
  size: number;
  speed: number;
}

interface Ball {
  position: Position;
  velocity: Position;
  size: number;
}

interface GameState {
  playerPaddle: Paddle;
  aiPaddle: Paddle;
  ball: Ball;
  playerScore: number;
  aiScore: number;
  gameOver: boolean;
  isPaused: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_HEIGHT = 80;
const PADDLE_WIDTH = 15;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;

const DIFFICULTY_LEVELS = {
  easy: {
    aiSpeed: 3,
    ballSpeed: 3,
    name: "Easy",
    aiReaction: 0.8,
  },
  medium: {
    aiSpeed: 4,
    ballSpeed: 4,
    name: "Medium",
    aiReaction: 0.9,
  },
  hard: {
    aiSpeed: 5,
    ballSpeed: 5,
    name: "Hard",
    aiReaction: 1.0,
  },
  expert: {
    aiSpeed: 6,
    ballSpeed: 6,
    name: "Expert",
    aiReaction: 1.1,
  },
};

export function PongGame() {
  const [gameState, setGameState] = useState<GameState>({
    playerPaddle: {
      position: { x: 20, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      size: PADDLE_HEIGHT,
      speed: PADDLE_SPEED,
    },
    aiPaddle: {
      position: {
        x: CANVAS_WIDTH - 35,
        y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
      },
      size: PADDLE_HEIGHT,
      speed: PADDLE_SPEED,
    },
    ball: {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: { x: BALL_SPEED, y: BALL_SPEED },
      size: BALL_SIZE,
    },
    playerScore: 0,
    aiScore: 0,
    gameOver: false,
    isPaused: false,
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
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // 重置球的位置
  const resetBall = useCallback(() => {
    return {
      position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      velocity: {
        x: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED,
        y: (Math.random() > 0.5 ? 1 : -1) * BALL_SPEED,
      },
      size: BALL_SIZE,
    };
  }, []);

  // 检查碰撞
  const checkCollision = useCallback((ball: Ball, paddle: Paddle) => {
    return (
      ball.position.x < paddle.position.x + PADDLE_WIDTH &&
      ball.position.x + ball.size > paddle.position.x &&
      ball.position.y < paddle.position.y + paddle.size &&
      ball.position.y + ball.size > paddle.position.y
    );
  }, []);

  // AI 控制
  const updateAI = useCallback(
    (ball: Ball, aiPaddle: Paddle) => {
      const paddleCenter = aiPaddle.position.y + aiPaddle.size / 2;
      const ballCenter = ball.position.y + ball.size / 2;
      const currentDifficulty = DIFFICULTY_LEVELS[difficulty];

      // 根据难度调整AI反应速度和精确度
      const reactionThreshold = 10 * currentDifficulty.aiReaction;
      const aiSpeed = currentDifficulty.aiSpeed;

      if (ballCenter < paddleCenter - reactionThreshold) {
        return Math.max(0, aiPaddle.position.y - aiSpeed);
      } else if (ballCenter > paddleCenter + reactionThreshold) {
        return Math.min(
          CANVAS_HEIGHT - aiPaddle.size,
          aiPaddle.position.y + aiSpeed
        );
      }
      return aiPaddle.position.y;
    },
    [difficulty]
  );

  // 游戏循环
  const gameLoop = useCallback(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    setGameState((prevState) => {
      // 更新球的位置
      const newBall = {
        ...prevState.ball,
        position: {
          x: prevState.ball.position.x + prevState.ball.velocity.x,
          y: prevState.ball.position.y + prevState.ball.velocity.y,
        },
      };

      // 检查墙壁碰撞
      if (
        newBall.position.y <= 0 ||
        newBall.position.y >= CANVAS_HEIGHT - newBall.size
      ) {
        newBall.velocity.y = -newBall.velocity.y;
      }

      // 检查球门
      if (newBall.position.x < 0) {
        // AI 得分
        const newAiScore = prevState.aiScore + 1;
        const newScore = Math.max(prevState.playerScore, newAiScore);

        // 更新自动记录器中的分数
        if (gameRecorder) {
          gameRecorder.updateScore(newScore);
        }

        if (newAiScore >= 5) {
          // 游戏结束
          if (gameRecorder) {
            gameRecorder.endGame(prevState.playerScore);
            setGameRecorder(null);
          }
          return { ...prevState, gameOver: true, aiScore: newAiScore };
        }

        return {
          ...prevState,
          ball: resetBall(),
          aiScore: newAiScore,
        };
      }

      if (newBall.position.x > CANVAS_WIDTH) {
        // 玩家得分
        const newPlayerScore = prevState.playerScore + 1;
        const newCombo = combo + 1;
        const comboBonus = Math.floor(newCombo / 3); // 每3次连击获得额外分数
        const difficultyBonus =
          DIFFICULTY_LEVELS[difficulty].name === "Expert"
            ? 10
            : DIFFICULTY_LEVELS[difficulty].name === "Hard"
            ? 5
            : 0;
        const totalScore = newPlayerScore + comboBonus + difficultyBonus;

        setCombo(newCombo);
        setMaxCombo(Math.max(maxCombo, newCombo));

        // 更新自动记录器中的分数
        if (gameRecorder) {
          gameRecorder.updateScore(totalScore);
        }

        if (newPlayerScore >= 5) {
          // 游戏结束
          setHighScore(Math.max(highScore, totalScore));
          if (gameRecorder) {
            gameRecorder.endGame(totalScore);
            setGameRecorder(null);
          }
          return { ...prevState, gameOver: true, playerScore: newPlayerScore };
        }

        return {
          ...prevState,
          ball: resetBall(),
          playerScore: newPlayerScore,
        };
      }

      // 检查球拍碰撞
      if (checkCollision(newBall, prevState.playerPaddle)) {
        newBall.velocity.x = Math.abs(newBall.velocity.x);
        newBall.velocity.y += (Math.random() - 0.5) * 2;
      }

      if (checkCollision(newBall, prevState.aiPaddle)) {
        newBall.velocity.x = -Math.abs(newBall.velocity.x);
        newBall.velocity.y += (Math.random() - 0.5) * 2;
      }

      // 更新AI球拍
      const newAiPaddleY = updateAI(newBall, prevState.aiPaddle);

      return {
        ...prevState,
        ball: newBall,
        aiPaddle: {
          ...prevState.aiPaddle,
          position: { ...prevState.aiPaddle.position, y: newAiPaddleY },
        },
      };
    });
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    gameRecorder,
    checkCollision,
    updateAI,
    resetBall,
  ]);

  // 键盘控制
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver) return;

      setGameState((prevState) => {
        let newY = prevState.playerPaddle.position.y;

        switch (e.key) {
          case "ArrowUp":
            newY = Math.max(
              0,
              prevState.playerPaddle.position.y - prevState.playerPaddle.speed
            );
            break;
          case "ArrowDown":
            newY = Math.min(
              CANVAS_HEIGHT - prevState.playerPaddle.size,
              prevState.playerPaddle.position.y + prevState.playerPaddle.speed
            );
            break;
          default:
            return prevState;
        }

        return {
          ...prevState,
          playerPaddle: {
            ...prevState.playerPaddle,
            position: { ...prevState.playerPaddle.position, y: newY },
          },
        };
      });
    },
    [isPlaying, gameState.gameOver]
  );

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(gameLoop, 16); // 60 FPS
      return () => clearInterval(interval);
    }
  }, [isPlaying, gameLoop]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const startGame = () => {
    setGameState({
      playerPaddle: {
        position: { x: 20, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2 },
        size: PADDLE_HEIGHT,
        speed: PADDLE_SPEED,
      },
      aiPaddle: {
        position: {
          x: CANVAS_WIDTH - 35,
          y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
        },
        size: PADDLE_HEIGHT,
        speed: PADDLE_SPEED,
      },
      ball: resetBall(),
      playerScore: 0,
      aiScore: 0,
      gameOver: false,
      isPaused: false,
    });
    setIsPlaying(true);

    // 开始自动记录
    const recorder = integrateGameWithAutoRecorder("Pong", "pong-game");
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);

    // 结束自动记录
    if (gameRecorder) {
      gameRecorder.endGame(gameState.playerScore);
      setGameRecorder(null);
    }
  };

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🏓 Pong</h2>
          <div className="flex gap-2">
            {!isPlaying ? (
              <Button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                开始游戏
              </Button>
            ) : (
              <>
                <Button
                  onClick={togglePause}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {gameState.isPaused ? "继续" : "暂停"}
                </Button>
                <Button
                  onClick={stopGame}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  结束
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 游戏画布 */}
          <div className="lg:col-span-3">
            <div className="bg-black/50 rounded-lg p-4 border border-white/20">
              <div
                className="relative bg-gradient-to-b from-blue-900 to-purple-900 rounded-lg overflow-hidden"
                style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
              >
                {/* 玩家球拍 */}
                <div
                  className="absolute bg-white rounded"
                  style={{
                    left: gameState.playerPaddle.position.x,
                    top: gameState.playerPaddle.position.y,
                    width: PADDLE_WIDTH,
                    height: gameState.playerPaddle.size,
                  }}
                />

                {/* AI球拍 */}
                <div
                  className="absolute bg-white rounded"
                  style={{
                    left: gameState.aiPaddle.position.x,
                    top: gameState.aiPaddle.position.y,
                    width: PADDLE_WIDTH,
                    height: gameState.aiPaddle.size,
                  }}
                />

                {/* 球 */}
                <div
                  className="absolute bg-yellow-400 rounded-full"
                  style={{
                    left: gameState.ball.position.x,
                    top: gameState.ball.position.y,
                    width: gameState.ball.size,
                    height: gameState.ball.size,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 游戏信息 */}
          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">比分</h3>
              <div className="space-y-2 text-white/80">
                <div>
                  玩家:{" "}
                  <span className="text-blue-400 font-bold">
                    {gameState.playerScore}
                  </span>
                </div>
                <div>
                  AI:{" "}
                  <span className="text-red-400 font-bold">
                    {gameState.aiScore}
                  </span>
                </div>
                <div>
                  连击:{" "}
                  <span className="text-yellow-400 font-bold">{combo}</span>
                </div>
                <div>
                  最高连击:{" "}
                  <span className="text-purple-400 font-bold">{maxCombo}</span>
                </div>
                <div>
                  最高分数:{" "}
                  <span className="text-green-400 font-bold">{highScore}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                控制说明
              </h3>
              <div className="space-y-1 text-sm text-white/70">
                <div>↑ ↓ 移动球拍</div>
                <div>目标: 先得5分获胜</div>
                <div>🔥 连击获得额外分数</div>
                <div>💪 高难度获得更多分数</div>
              </div>
            </div>

            {!isPlaying && !gameState.gameOver && (
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  选择难度
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                    <Button
                      key={key}
                      onClick={() =>
                        setDifficulty(key as keyof typeof DIFFICULTY_LEVELS)
                      }
                      className={`text-xs ${
                        difficulty === key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      {level.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {gameState.gameOver && (
              <div className="bg-red-900/50 rounded-lg p-4 border border-red-500/50">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  游戏结束!
                </h3>
                <p className="text-white/80">
                  {gameState.playerScore > gameState.aiScore
                    ? "你赢了!"
                    : "AI赢了!"}
                </p>
                <p className="text-white/80">
                  最终比分: {gameState.playerScore} - {gameState.aiScore}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
