"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface ColorfulPiece {
  shape: number[][];
  color: string;
  position: Position;
}

interface GameState {
  board: (string | null)[][];
  currentPiece: ColorfulPiece | null;
  nextPiece: ColorfulPiece | null;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  isPaused: boolean;
  combo: number;
  maxCombo: number;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const COLORFUL_PIECES: ColorfulPiece[] = [
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "bg-yellow-400",
    position: { x: 0, y: 0 },
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "bg-purple-400",
    position: { x: 0, y: 0 },
  },
  {
    shape: [[1, 1, 1, 1]],
    color: "bg-cyan-400",
    position: { x: 0, y: 0 },
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "bg-green-400",
    position: { x: 0, y: 0 },
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "bg-red-400",
    position: { x: 0, y: 0 },
  },
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "bg-orange-400",
    position: { x: 0, y: 0 },
  },
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "bg-pink-400",
    position: { x: 0, y: 0 },
  },
];

const DIFFICULTY_LEVELS = {
  easy: { speed: 800, name: "Easy" },
  medium: { speed: 600, name: "Medium" },
  hard: { speed: 400, name: "Hard" },
  expert: { speed: 200, name: "Expert" },
};

export function ColorfulTetrisGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null)),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    isPaused: false,
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

  // 生成随机彩色方块
  const generateColorfulPiece = useCallback((): ColorfulPiece => {
    const piece =
      COLORFUL_PIECES[Math.floor(Math.random() * COLORFUL_PIECES.length)];
    return {
      ...piece,
      position: {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
        y: 0,
      },
    };
  }, []);

  // 检查位置是否有效
  const isValidPosition = useCallback(
    (piece: ColorfulPiece, board: (string | null)[][]): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.position.x + x;
            const newY = piece.position.y + y;

            if (
              newX < 0 ||
              newX >= BOARD_WIDTH ||
              newY >= BOARD_HEIGHT ||
              (newY >= 0 && board[newY][newX] !== null)
            ) {
              return false;
            }
          }
        }
      }
      return true;
    },
    []
  );

  // 放置方块到棋盘
  const placePiece = useCallback(
    (piece: ColorfulPiece, board: (string | null)[][]): (string | null)[][] => {
      const newBoard = board.map((row) => [...row]);

      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardX = piece.position.x + x;
            const boardY = piece.position.y + y;
            if (boardY >= 0 && boardY < BOARD_HEIGHT) {
              newBoard[boardY][boardX] = piece.color;
            }
          }
        }
      }

      return newBoard;
    },
    []
  );

  // 检查并清除完整的行
  const clearLines = useCallback(
    (
      board: (string | null)[][]
    ): { newBoard: (string | null)[][]; linesCleared: number } => {
      const newBoard = board.filter((row) => row.some((cell) => cell === null));
      const linesCleared = BOARD_HEIGHT - newBoard.length;

      // 在顶部添加新的空行
      while (newBoard.length < BOARD_HEIGHT) {
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
      }

      return { newBoard, linesCleared };
    },
    []
  );

  // 移动方块
  const movePiece = useCallback(
    (direction: "left" | "right" | "down" | "rotate") => {
      if (!gameState.currentPiece) return;

      setGameState((prevState) => {
        if (!prevState.currentPiece) return prevState;

        const newPiece = { ...prevState.currentPiece };

        switch (direction) {
          case "left":
            newPiece.position.x -= 1;
            break;
          case "right":
            newPiece.position.x += 1;
            break;
          case "down":
            newPiece.position.y += 1;
            break;
          case "rotate":
            // 旋转方块
            const rotatedShape = newPiece.shape[0].map((_, index) =>
              newPiece.shape.map((row) => row[index]).reverse()
            );
            newPiece.shape = rotatedShape;
            break;
        }

        if (isValidPosition(newPiece, prevState.board)) {
          return { ...prevState, currentPiece: newPiece };
        } else if (direction === "down") {
          // 方块无法继续下降，放置到棋盘上
          const newBoard = placePiece(prevState.currentPiece, prevState.board);
          const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

          let newScore = prevState.score;
          const newLines = prevState.lines + linesCleared;
          const newLevel = Math.floor(newLines / 10) + 1;
          let newCombo = prevState.combo;
          let newMaxCombo = prevState.maxCombo;

          if (linesCleared > 0) {
            // 计算分数
            const baseScore = linesCleared * 100 * newLevel;
            const comboBonus = newCombo * 50;
            newScore += baseScore + comboBonus;
            newCombo += 1;
            newMaxCombo = Math.max(newMaxCombo, newCombo);
          } else {
            newCombo = 0;
          }

          // 更新自动记录器
          if (gameRecorder) {
            gameRecorder.updateScore(newScore);
          }

          // 检查游戏结束
          const gameOver = !isValidPosition(
            prevState.nextPiece || generateColorfulPiece(),
            clearedBoard
          );

          if (gameOver) {
            setHighScore(Math.max(highScore, newScore));
            if (gameRecorder) {
              gameRecorder.endGame(newScore);
              setGameRecorder(null);
            }
          }

          return {
            ...prevState,
            board: clearedBoard,
            currentPiece: prevState.nextPiece || generateColorfulPiece(),
            nextPiece: generateColorfulPiece(),
            score: newScore,
            level: newLevel,
            lines: newLines,
            combo: newCombo,
            maxCombo: newMaxCombo,
            gameOver,
          };
        }

        return prevState;
      });
    },
    [
      gameState.currentPiece,
      isValidPosition,
      placePiece,
      clearLines,
      generateColorfulPiece,
      gameRecorder,
      highScore,
    ]
  );

  // 游戏循环
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const gameLoop = setInterval(() => {
      movePiece("down");
    }, DIFFICULTY_LEVELS[difficulty].speed);

    return () => clearInterval(gameLoop);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    difficulty,
    movePiece,
  ]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver) return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
          e.preventDefault();
          movePiece("left");
          break;
        case "ArrowRight":
        case "d":
          e.preventDefault();
          movePiece("right");
          break;
        case "ArrowDown":
        case "s":
          e.preventDefault();
          movePiece("down");
          break;
        case "ArrowUp":
        case "w":
          e.preventDefault();
          movePiece("rotate");
          break;
        case " ":
          e.preventDefault();
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, gameState.gameOver, movePiece]);

  const startGame = () => {
    const newGameState = {
      board: Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null)),
      currentPiece: generateColorfulPiece(),
      nextPiece: generateColorfulPiece(),
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
      isPaused: false,
      combo: 0,
      maxCombo: 0,
    };

    setGameState(newGameState);
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Colorful Tetris",
      "colorful-tetris-game"
    );
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
      setGameRecorder(null);
    }
  };

  const resetGame = () => {
    setGameState({
      board: Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null)),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      level: 1,
      lines: 0,
      gameOver: false,
      isPaused: false,
      combo: 0,
      maxCombo: 0,
    });
    setIsPlaying(false);
  };

  // 渲染方块
  const renderPiece = (piece: ColorfulPiece, offsetX = 0, offsetY = 0) => {
    return piece.shape.map((row, y) =>
      row.map((cell, x) => {
        if (cell) {
          return (
            <div
              key={`${x}-${y}`}
              className={`w-6 h-6 border border-gray-300 ${piece.color}`}
              style={{
                position: "absolute",
                left: (piece.position.x + x + offsetX) * 24,
                top: (piece.position.y + y + offsetY) * 24,
              }}
            />
          );
        }
        return null;
      })
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🌈 Colorful Tetris
          </h2>
          <p className="text-white/70">
            Use arrow keys or WASD to control the colorful blocks
          </p>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Level: {gameState.level}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Lines: {gameState.lines}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Combo: {gameState.combo}</div>
          </div>
        </div>

        <div className="flex justify-center gap-8 mb-6">
          {/* Game Board */}
          <div className="relative">
            <div
              className="grid gap-0 border-2 border-white/30 rounded-lg overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                width: `${BOARD_WIDTH * 24}px`,
                height: `${BOARD_HEIGHT * 24}px`,
              }}
            >
              {Array.from(
                { length: BOARD_HEIGHT * BOARD_WIDTH },
                (_, index) => {
                  const x = index % BOARD_WIDTH;
                  const y = Math.floor(index / BOARD_WIDTH);
                  const cell = gameState.board[y][x];

                  return (
                    <div
                      key={index}
                      className={`w-6 h-6 border border-gray-300 ${
                        cell || "bg-gray-800"
                      }`}
                    />
                  );
                }
              )}
            </div>

            {/* Current Piece */}
            {gameState.currentPiece && (
              <div className="absolute inset-0 pointer-events-none">
                {renderPiece(gameState.currentPiece)}
              </div>
            )}
          </div>

          {/* Next Piece */}
          <div className="flex flex-col items-center">
            <h3 className="text-white font-bold mb-2">Next</h3>
            <div className="relative w-24 h-24 border border-white/30 rounded-lg bg-gray-800">
              {gameState.nextPiece && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {renderPiece(gameState.nextPiece, 1, 1)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Over Message */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">Game Over!</p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
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
          <p>🎮 Use Arrow Keys or WASD to move and rotate</p>
          <p>🌈 Match colors to create combos</p>
          <p>⚡ Higher combos = more points</p>
          <p>⏸️ Press SPACE to pause/resume</p>
          <p>💥 Clear lines to level up!</p>
        </div>
      </Card>
    </div>
  );
}
