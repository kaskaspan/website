"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Cell {
  value: number | null;
  isGiven: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isError: boolean;
}

interface GameState {
  grid: Cell[][];
  selectedCell: { row: number; col: number } | null;
  difficulty: "easy" | "medium" | "hard";
  mistakes: number;
  hints: number;
  timeElapsed: number;
  gameOver: boolean;
  gameWon: boolean;
  isPaused: boolean;
}

const BOARD_SIZE = 9;

export function SudokuGame() {
  const [gameState, setGameState] = useState<GameState>({
    grid: Array(BOARD_SIZE)
      .fill(null)
      .map(() =>
        Array(BOARD_SIZE)
          .fill(null)
          .map(() => ({
            value: null,
            isGiven: false,
            isSelected: false,
            isHighlighted: false,
            isError: false,
          }))
      ),
    selectedCell: null,
    difficulty: "medium",
    mistakes: 0,
    hints: 3,
    timeElapsed: 0,
    gameOver: false,
    gameWon: false,
    isPaused: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<any>(null);

  const DIFFICULTY_LEVELS = {
    easy: { givenCells: 45, name: "Easy" },
    medium: { givenCells: 35, name: "Medium" },
    hard: { givenCells: 25, name: "Hard" },
  };

  // 检查数字是否有效
  const isValidNumber = useCallback(
    (grid: Cell[][], row: number, col: number, num: number) => {
      // 检查行
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (c !== col && grid[row][c].value === num) return false;
      }

      // 检查列
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (r !== row && grid[r][col].value === num) return false;
      }

      // 检查3x3方格
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          if ((r !== row || c !== col) && grid[r][c].value === num)
            return false;
        }
      }

      return true;
    },
    []
  );

  // 生成数独谜题
  const generatePuzzle = useCallback(
    (difficulty: "easy" | "medium" | "hard") => {
      const grid: Cell[][] = Array(BOARD_SIZE)
        .fill(null)
        .map(() =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => ({
              value: null,
              isGiven: false,
              isSelected: false,
              isHighlighted: false,
              isError: false,
            }))
        );

      // 填充一些数字作为给定数字
      const givenCells = DIFFICULTY_LEVELS[difficulty].givenCells;
      let filledCells = 0;

      while (filledCells < givenCells) {
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        const num = Math.floor(Math.random() * 9) + 1;

        if (
          grid[row][col].value === null &&
          isValidNumber(grid, row, col, num)
        ) {
          grid[row][col].value = num;
          grid[row][col].isGiven = true;
          filledCells++;
        }
      }

      return grid;
    },
    [isValidNumber]
  );

  // 检查游戏是否完成
  const checkGameComplete = useCallback(
    (grid: Cell[][]) => {
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (grid[row][col].value === null) return false;
        }
      }

      // 检查所有数字是否正确
      for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
          if (!isValidNumber(grid, row, col, grid[row][col].value!)) {
            return false;
          }
        }
      }

      return true;
    },
    [isValidNumber]
  );

  // 选择单元格
  const selectCell = useCallback(
    (row: number, col: number) => {
      if (gameState.gameOver || gameState.gameWon || gameState.isPaused) return;

      setGameState((prevState) => {
        const newGrid = prevState.grid.map((gridRow, r) =>
          gridRow.map((cell, c) => ({
            ...cell,
            isSelected: r === row && c === col,
            isHighlighted:
              r === row ||
              c === col ||
              (Math.floor(r / 3) === Math.floor(row / 3) &&
                Math.floor(c / 3) === Math.floor(col / 3)),
          }))
        );

        return {
          ...prevState,
          grid: newGrid,
          selectedCell: { row, col },
        };
      });
    },
    [gameState.gameOver, gameState.gameWon, gameState.isPaused]
  );

  // 输入数字
  const inputNumber = useCallback(
    (num: number) => {
      if (
        !gameState.selectedCell ||
        gameState.gameOver ||
        gameState.gameWon ||
        gameState.isPaused
      )
        return;

      const { row, col } = gameState.selectedCell;
      if (gameState.grid[row][col].isGiven) return;

      setGameState((prevState) => {
        const newGrid = prevState.grid.map((gridRow, r) =>
          gridRow.map((cell, c) => {
            if (r === row && c === col) {
              const isValid = isValidNumber(prevState.grid, r, c, num);
              return {
                ...cell,
                value: num,
                isError: !isValid,
              };
            }
            return cell;
          })
        );

        // 检查是否有错误
        let newMistakes = prevState.mistakes;
        if (!isValidNumber(prevState.grid, row, col, num)) {
          newMistakes++;
        }

        // 检查游戏是否完成
        const isComplete = checkGameComplete(newGrid);

        if (isComplete) {
          const score = Math.max(
            0,
            1000 - newMistakes * 50 - prevState.timeElapsed * 2
          );
          if (gameRecorder) {
            gameRecorder.endGame(score);
            setGameRecorder(null);
          }
          return {
            ...prevState,
            grid: newGrid,
            mistakes: newMistakes,
            gameWon: true,
          };
        }

        // 更新自动记录器中的分数
        if (gameRecorder) {
          const currentScore = Math.max(
            0,
            1000 - newMistakes * 50 - prevState.timeElapsed * 2
          );
          gameRecorder.updateScore(currentScore);
        }

        return {
          ...prevState,
          grid: newGrid,
          mistakes: newMistakes,
        };
      });
    },
    [
      gameState.selectedCell,
      gameState.gameOver,
      gameState.gameWon,
      gameState.isPaused,
      isValidNumber,
      checkGameComplete,
      gameRecorder,
    ]
  );

  // 清除单元格
  const clearCell = useCallback(() => {
    if (
      !gameState.selectedCell ||
      gameState.gameOver ||
      gameState.gameWon ||
      gameState.isPaused
    )
      return;

    const { row, col } = gameState.selectedCell;
    if (gameState.grid[row][col].isGiven) return;

    setGameState((prevState) => {
      const newGrid = prevState.grid.map((gridRow, r) =>
        gridRow.map((cell, c) => {
          if (r === row && c === col) {
            return {
              ...cell,
              value: null,
              isError: false,
            };
          }
          return cell;
        })
      );

      return {
        ...prevState,
        grid: newGrid,
      };
    });
  }, [
    gameState.selectedCell,
    gameState.gameOver,
    gameState.gameWon,
    gameState.isPaused,
  ]);

  // 使用提示
  const useHint = useCallback(() => {
    if (
      gameState.hints <= 0 ||
      gameState.gameOver ||
      gameState.gameWon ||
      gameState.isPaused
    )
      return;

    // 找到第一个空单元格
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (gameState.grid[row][col].value === null) {
          // 找到这个位置应该填入的数字（简化版本，实际应该解数独）
          for (let num = 1; num <= 9; num++) {
            if (isValidNumber(gameState.grid, row, col, num)) {
              setGameState((prevState) => {
                const newGrid = prevState.grid.map((gridRow, r) =>
                  gridRow.map((cell, c) => {
                    if (r === row && c === col) {
                      return {
                        ...cell,
                        value: num,
                        isError: false,
                      };
                    }
                    return cell;
                  })
                );

                return {
                  ...prevState,
                  grid: newGrid,
                  hints: prevState.hints - 1,
                };
              });
              return;
            }
          }
        }
      }
    }
  }, [
    gameState.hints,
    gameState.gameOver,
    gameState.gameWon,
    gameState.isPaused,
    gameState.grid,
    isValidNumber,
  ]);

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      isPlaying &&
      !gameState.gameOver &&
      !gameState.gameWon &&
      !gameState.isPaused
    ) {
      interval = setInterval(() => {
        setGameState((prevState) => ({
          ...prevState,
          timeElapsed: prevState.timeElapsed + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameState.gameOver, gameState.gameWon, gameState.isPaused]);

  const startGame = () => {
    const grid = generatePuzzle(gameState.difficulty);
    setGameState((prevState) => ({
      ...prevState,
      grid,
      selectedCell: null,
      mistakes: 0,
      hints: 3,
      timeElapsed: 0,
      gameOver: false,
      gameWon: false,
      isPaused: false,
    }));
    setIsPlaying(true);

    // 开始自动记录
    const recorder = integrateGameWithAutoRecorder("Sudoku", "sudoku-game");
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.mistakes);
      setGameRecorder(null);
    }
  };

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetGame = () => {
    setGameState((prevState) => ({
      ...prevState,
      grid: Array(BOARD_SIZE)
        .fill(null)
        .map(() =>
          Array(BOARD_SIZE)
            .fill(null)
            .map(() => ({
              value: null,
              isGiven: false,
              isSelected: false,
              isHighlighted: false,
              isError: false,
            }))
        ),
      selectedCell: null,
      mistakes: 0,
      hints: 3,
      timeElapsed: 0,
      gameOver: false,
      gameWon: false,
      isPaused: false,
    }));
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🔢 Sudoku</h2>
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
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
                >
                  {gameState.grid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={() => selectCell(rowIndex, colIndex)}
                        className={`w-10 h-10 text-sm font-bold border transition-all duration-200 ${
                          cell.isSelected
                            ? "bg-blue-500 text-white border-blue-400"
                            : cell.isHighlighted
                            ? "bg-blue-900/50 text-white border-blue-600"
                            : cell.isGiven
                            ? "bg-gray-700 text-white border-gray-500"
                            : cell.isError
                            ? "bg-red-500 text-white border-red-400"
                            : "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                        } ${
                          (rowIndex + 1) % 3 === 0
                            ? "border-b-2 border-gray-400"
                            : ""
                        } ${
                          (colIndex + 1) % 3 === 0
                            ? "border-r-2 border-gray-400"
                            : ""
                        }`}
                      >
                        {cell.value || ""}
                      </button>
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
                  时间:{" "}
                  <span className="text-blue-400 font-bold">
                    {formatTime(gameState.timeElapsed)}
                  </span>
                </div>
                <div>
                  错误次数:{" "}
                  <span className="text-red-400 font-bold">
                    {gameState.mistakes}
                  </span>
                </div>
                <div>
                  提示次数:{" "}
                  <span className="text-yellow-400 font-bold">
                    {gameState.hints}
                  </span>
                </div>
                <div>
                  难度:{" "}
                  <span className="text-green-400 font-bold">
                    {DIFFICULTY_LEVELS[gameState.difficulty].name}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                控制说明
              </h3>
              <div className="space-y-1 text-sm text-white/70">
                <div>🖱️ 点击选择格子</div>
                <div>🔢 点击数字按钮输入</div>
                <div>🗑️ 点击清除按钮删除</div>
                <div>💡 使用提示功能</div>
                <div>🎯 每行、列、3x3方格都要有1-9</div>
              </div>
            </div>

            {/* 数字输入按钮 */}
            {isPlaying && !gameState.gameOver && !gameState.gameWon && (
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  数字输入
                </h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button
                      key={num}
                      onClick={() => inputNumber(num)}
                      className="bg-gray-600 hover:bg-gray-500 text-white font-bold"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={clearCell}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    清除
                  </Button>
                  <Button
                    onClick={useHint}
                    disabled={gameState.hints <= 0}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white disabled:bg-gray-600"
                  >
                    提示 ({gameState.hints})
                  </Button>
                </div>
              </div>
            )}

            {!isPlaying && !gameState.gameOver && (
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  选择难度
                </h3>
                <div className="space-y-2">
                  {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                    <Button
                      key={key}
                      onClick={() =>
                        setGameState((prev) => ({
                          ...prev,
                          difficulty: key as "easy" | "medium" | "hard",
                        }))
                      }
                      className={`w-full text-sm ${
                        gameState.difficulty === key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      {level.name} ({level.givenCells} 给定数字)
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {gameState.gameWon && (
              <div className="bg-green-900/50 rounded-lg p-4 border border-green-500/50">
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  恭喜通关!
                </h3>
                <p className="text-white/80">
                  完成时间: {formatTime(gameState.timeElapsed)}
                </p>
                <p className="text-white/80">错误次数: {gameState.mistakes}</p>
                <Button
                  onClick={resetGame}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  重新开始
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
