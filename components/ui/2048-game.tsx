"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface GameState {
  board: number[][];
  score: number;
  gameOver: boolean;
  gameWon: boolean;
  isPaused: boolean;
}

const BOARD_SIZE = 4;

export function Game2048() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(0)),
    score: 0,
    gameOver: false,
    gameWon: false,
    isPaused: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);
  const [highScore, setHighScore] = useState(0);

  // 获取随机空位置
  const getRandomEmptyPosition = useCallback((board: number[][]) => {
    const emptyPositions: { row: number; col: number }[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === 0) {
          emptyPositions.push({ row, col });
        }
      }
    }
    return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
  }, []);

  // 添加新数字
  const addRandomNumber = useCallback(
    (board: number[][]) => {
      const newBoard = board.map((row) => [...row]);
      const emptyPos = getRandomEmptyPosition(newBoard);
      if (emptyPos) {
        newBoard[emptyPos.row][emptyPos.col] = Math.random() < 0.9 ? 2 : 4;
      }
      return newBoard;
    },
    [getRandomEmptyPosition]
  );

  // 移动数字
  const moveNumbers = useCallback(
    (board: number[][], direction: "left" | "right" | "up" | "down") => {
      const newBoard = board.map((row) => [...row]);
      let moved = false;
      let scoreIncrease = 0;

      // 移动和合并逻辑
      if (direction === "left") {
        for (let row = 0; row < BOARD_SIZE; row++) {
          const nonZeroNumbers = newBoard[row].filter((num) => num !== 0);
          const merged: number[] = [];

          for (let i = 0; i < nonZeroNumbers.length; i++) {
            if (
              i < nonZeroNumbers.length - 1 &&
              nonZeroNumbers[i] === nonZeroNumbers[i + 1]
            ) {
              const mergedValue = nonZeroNumbers[i] * 2;
              merged.push(mergedValue);
              scoreIncrease += mergedValue;
              i++; // 跳过下一个数字
            } else {
              merged.push(nonZeroNumbers[i]);
            }
          }

          // 填充剩余位置为0
          while (merged.length < BOARD_SIZE) {
            merged.push(0);
          }

          if (JSON.stringify(newBoard[row]) !== JSON.stringify(merged)) {
            moved = true;
          }
          newBoard[row] = merged;
        }
      } else if (direction === "right") {
        for (let row = 0; row < BOARD_SIZE; row++) {
          const nonZeroNumbers = newBoard[row].filter((num) => num !== 0);
          const merged: number[] = [];

          for (let i = nonZeroNumbers.length - 1; i >= 0; i--) {
            if (i > 0 && nonZeroNumbers[i] === nonZeroNumbers[i - 1]) {
              const mergedValue = nonZeroNumbers[i] * 2;
              merged.unshift(mergedValue);
              scoreIncrease += mergedValue;
              i--; // 跳过下一个数字
            } else {
              merged.unshift(nonZeroNumbers[i]);
            }
          }

          // 填充前面位置为0
          while (merged.length < BOARD_SIZE) {
            merged.unshift(0);
          }

          if (JSON.stringify(newBoard[row]) !== JSON.stringify(merged)) {
            moved = true;
          }
          newBoard[row] = merged;
        }
      } else if (direction === "up") {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const column = newBoard.map((row) => row[col]);
          const nonZeroNumbers = column.filter((num) => num !== 0);
          const merged: number[] = [];

          for (let i = 0; i < nonZeroNumbers.length; i++) {
            if (
              i < nonZeroNumbers.length - 1 &&
              nonZeroNumbers[i] === nonZeroNumbers[i + 1]
            ) {
              const mergedValue = nonZeroNumbers[i] * 2;
              merged.push(mergedValue);
              scoreIncrease += mergedValue;
              i++; // 跳过下一个数字
            } else {
              merged.push(nonZeroNumbers[i]);
            }
          }

          // 填充剩余位置为0
          while (merged.length < BOARD_SIZE) {
            merged.push(0);
          }

          if (JSON.stringify(column) !== JSON.stringify(merged)) {
            moved = true;
          }

          // 更新列
          for (let row = 0; row < BOARD_SIZE; row++) {
            newBoard[row][col] = merged[row];
          }
        }
      } else if (direction === "down") {
        for (let col = 0; col < BOARD_SIZE; col++) {
          const column = newBoard.map((row) => row[col]);
          const nonZeroNumbers = column.filter((num) => num !== 0);
          const merged: number[] = [];

          for (let i = nonZeroNumbers.length - 1; i >= 0; i--) {
            if (i > 0 && nonZeroNumbers[i] === nonZeroNumbers[i - 1]) {
              const mergedValue = nonZeroNumbers[i] * 2;
              merged.unshift(mergedValue);
              scoreIncrease += mergedValue;
              i--; // 跳过下一个数字
            } else {
              merged.unshift(nonZeroNumbers[i]);
            }
          }

          // 填充前面位置为0
          while (merged.length < BOARD_SIZE) {
            merged.unshift(0);
          }

          if (JSON.stringify(column) !== JSON.stringify(merged)) {
            moved = true;
          }

          // 更新列
          for (let row = 0; row < BOARD_SIZE; row++) {
            newBoard[row][col] = merged[row];
          }
        }
      }

      return { newBoard, moved, scoreIncrease };
    },
    []
  );

  // 检查游戏是否结束
  const checkGameOver = useCallback((board: number[][]) => {
    // 检查是否有空位置
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === 0) return false;
      }
    }

    // 检查是否可以合并
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const current = board[row][col];
        if (
          (row < BOARD_SIZE - 1 && board[row + 1][col] === current) ||
          (col < BOARD_SIZE - 1 && board[row][col + 1] === current)
        ) {
          return false;
        }
      }
    }

    return true;
  }, []);

  // 键盘控制
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

      const directions: { [key: string]: "left" | "right" | "up" | "down" } = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
        a: "left",
        d: "right",
        w: "up",
        s: "down",
      };

      const direction = directions[e.key];
      if (!direction) return;

      e.preventDefault();

      setGameState((prevState) => {
        const { newBoard, moved, scoreIncrease } = moveNumbers(
          prevState.board,
          direction
        );

        if (!moved) return prevState;

        let updatedBoard = newBoard;
        const newScore = prevState.score + scoreIncrease;

        // 添加新数字
        updatedBoard = addRandomNumber(updatedBoard);

        // 检查是否获胜（达到2048）
        const hasWon = updatedBoard.some((row) =>
          row.some((cell) => cell === 2048)
        );

        // 检查游戏是否结束
        const gameOver = checkGameOver(updatedBoard);

        // 更新自动记录器中的分数
        if (gameRecorder) {
          gameRecorder.updateScore(newScore);
        }

        if (gameOver) {
          setHighScore(Math.max(highScore, newScore));
          if (gameRecorder) {
            gameRecorder.endGame(newScore);
            setGameRecorder(null);
          }
        }

        return {
          ...prevState,
          board: updatedBoard,
          score: newScore,
          gameOver,
          gameWon: hasWon || prevState.gameWon,
        };
      });
    },
    [
      isPlaying,
      gameState.gameOver,
      gameState.isPaused,
      moveNumbers,
      addRandomNumber,
      checkGameOver,
      gameRecorder,
      highScore,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const startGame = () => {
    const initialBoard = addRandomNumber(
      addRandomNumber(
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => Array(BOARD_SIZE).fill(0))
      )
    );

    setGameState({
      board: initialBoard,
      score: 0,
      gameOver: false,
      gameWon: false,
      isPaused: false,
    });
    setIsPlaying(true);

    // 开始自动记录
    const recorder = integrateGameWithAutoRecorder("2048", "2048-game");
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
      setGameRecorder(null);
    }
  };

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetGame = () => {
    setGameState({
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(0)),
      score: 0,
      gameOver: false,
      gameWon: false,
      isPaused: false,
    });
    setIsPlaying(false);
  };

  const getCellColor = (value: number) => {
    const colors: { [key: number]: string } = {
      0: "bg-gray-800",
      2: "bg-gray-700",
      4: "bg-gray-600",
      8: "bg-orange-500",
      16: "bg-orange-400",
      32: "bg-red-500",
      64: "bg-red-400",
      128: "bg-yellow-500",
      256: "bg-yellow-400",
      512: "bg-green-500",
      1024: "bg-green-400",
      2048: "bg-blue-500",
    };
    return colors[value] || "bg-purple-500";
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🔢 2048</h2>
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
          {/* 游戏板 */}
          <div className="lg:col-span-3">
            <div className="bg-black/50 rounded-lg p-4 border border-white/20">
              <div className="flex justify-center">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
                >
                  {gameState.board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg border border-gray-600 ${getCellColor(
                          cell
                        )}`}
                      >
                        {cell !== 0 ? cell : ""}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 游戏信息 */}
          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                游戏信息
              </h3>
              <div className="space-y-2 text-white/80">
                <div>
                  分数:{" "}
                  <span className="text-yellow-400 font-bold">
                    {gameState.score}
                  </span>
                </div>
                <div>
                  最高分数:{" "}
                  <span className="text-green-400 font-bold">{highScore}</span>
                </div>
                {gameState.gameWon && (
                  <div className="text-blue-400 font-bold">🎉 达到2048!</div>
                )}
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                控制说明
              </h3>
              <div className="space-y-1 text-sm text-white/70">
                <div>← → ↑ ↓ 移动数字</div>
                <div>WASD 也可以移动</div>
                <div>🎯 目标: 合并数字达到2048</div>
                <div>🔢 相同数字会合并翻倍</div>
              </div>
            </div>

            {gameState.gameOver && (
              <div className="bg-red-900/50 rounded-lg p-4 border border-red-500/50">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  游戏结束!
                </h3>
                <p className="text-white/80">最终分数: {gameState.score}</p>
                <Button
                  onClick={resetGame}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  重新开始
                </Button>
              </div>
            )}

            {gameState.gameWon && !gameState.gameOver && (
              <div className="bg-blue-900/50 rounded-lg p-4 border border-blue-500/50">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  恭喜!
                </h3>
                <p className="text-white/80">你达到了2048!</p>
                <p className="text-white/80">继续游戏挑战更高分数</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
