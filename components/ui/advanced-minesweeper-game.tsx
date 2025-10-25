"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
  isExploded: boolean;
}

interface GameState {
  grid: Cell[][];
  gameStatus: "playing" | "won" | "lost";
  minesLeft: number;
  flagsUsed: number;
  startTime: number;
  endTime?: number;
  score: number;
  difficulty: "beginner" | "intermediate" | "expert" | "custom";
  width: number;
  height: number;
  mineCount: number;
  hintsUsed: number;
  maxHints: number;
}

const DIFFICULTY_LEVELS = {
  beginner: { width: 9, height: 9, mines: 10, name: "Beginner" },
  intermediate: { width: 16, height: 16, mines: 40, name: "Intermediate" },
  expert: { width: 30, height: 16, mines: 99, name: "Expert" },
  custom: { width: 20, height: 20, mines: 60, name: "Custom" },
};

export function AdvancedMinesweeperGame() {
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    gameStatus: "playing",
    minesLeft: 0,
    flagsUsed: 0,
    startTime: 0,
    score: 0,
    difficulty: "beginner",
    width: 9,
    height: 9,
    mineCount: 10,
    hintsUsed: 0,
    maxHints: 3,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);
  const [highScore, setHighScore] = useState(0);

  // 生成地雷位置
  const generateMines = useCallback(
    (
      excludePosition: Position,
      width: number,
      height: number,
      mineCount: number
    ): Position[] => {
      const mines: Position[] = [];
      const totalCells = width * height;

      while (mines.length < mineCount) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);

        // 确保第一个点击位置不是地雷
        if (x === excludePosition.x && y === excludePosition.y) continue;

        const position = { x, y };
        if (!mines.some((mine) => mine.x === x && mine.y === y)) {
          mines.push(position);
        }
      }

      return mines;
    },
    []
  );

  // 计算相邻地雷数量
  const countNeighborMines = useCallback(
    (grid: Cell[][], x: number, y: number): number => {
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
            if (grid[ny][nx].isMine) count++;
          }
        }
      }
      return count;
    },
    []
  );

  // 初始化游戏
  const initializeGame = useCallback(
    (difficulty: keyof typeof DIFFICULTY_LEVELS, firstClick?: Position) => {
      const level = DIFFICULTY_LEVELS[difficulty];
      const mines = firstClick
        ? generateMines(firstClick, level.width, level.height, level.mines)
        : [];

      const grid: Cell[][] = Array(level.height)
        .fill(null)
        .map(() =>
          Array(level.width)
            .fill(null)
            .map(() => ({
              isMine: false,
              isRevealed: false,
              isFlagged: false,
              neighborMines: 0,
              isExploded: false,
            }))
        );

      // 放置地雷
      mines.forEach((mine) => {
        grid[mine.y][mine.x].isMine = true;
      });

      // 计算相邻地雷数量
      for (let y = 0; y < level.height; y++) {
        for (let x = 0; x < level.width; x++) {
          grid[y][x].neighborMines = countNeighborMines(grid, x, y);
        }
      }

      setGameState({
        grid,
        gameStatus: "playing",
        minesLeft: level.mines,
        flagsUsed: 0,
        startTime: Date.now(),
        score: 0,
        difficulty,
        width: level.width,
        height: level.height,
        mineCount: level.mines,
        hintsUsed: 0,
        maxHints: 3,
      });
    },
    [generateMines, countNeighborMines]
  );

  // 揭示单元格
  const revealCell = useCallback(
    (x: number, y: number) => {
      setGameState((prevState) => {
        if (prevState.gameStatus !== "playing") return prevState;
        if (prevState.grid[y][x].isRevealed || prevState.grid[y][x].isFlagged)
          return prevState;

        const newGrid = prevState.grid.map((row) =>
          row.map((cell) => ({ ...cell }))
        );
        const cell = newGrid[y][x];

        if (cell.isMine) {
          // 游戏结束
          cell.isExploded = true;
          // 揭示所有地雷
          for (let gy = 0; gy < prevState.height; gy++) {
            for (let gx = 0; gx < prevState.width; gx++) {
              if (newGrid[gy][gx].isMine) {
                newGrid[gy][gx].isRevealed = true;
              }
            }
          }

          const endTime = Date.now();
          const timeSpent = Math.floor((endTime - prevState.startTime) / 1000);
          const finalScore = Math.max(
            0,
            1000 - timeSpent - prevState.hintsUsed * 100
          );

          if (gameRecorder) {
            gameRecorder.endGame(finalScore);
            setGameRecorder(null);
          }

          return {
            ...prevState,
            grid: newGrid,
            gameStatus: "lost",
            endTime,
            score: finalScore,
          };
        }

        // 揭示单元格
        cell.isRevealed = true;

        // 如果是空白单元格，自动揭示相邻单元格
        if (cell.neighborMines === 0) {
          const revealAdjacent = (cx: number, cy: number) => {
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (
                  nx >= 0 &&
                  nx < prevState.width &&
                  ny >= 0 &&
                  ny < prevState.height
                ) {
                  const adjacentCell = newGrid[ny][nx];
                  if (!adjacentCell.isRevealed && !adjacentCell.isFlagged) {
                    adjacentCell.isRevealed = true;
                    if (adjacentCell.neighborMines === 0) {
                      revealAdjacent(nx, ny);
                    }
                  }
                }
              }
            }
          };
          revealAdjacent(x, y);
        }

        // 检查是否获胜
        let revealedCount = 0;
        for (let gy = 0; gy < prevState.height; gy++) {
          for (let gx = 0; gx < prevState.width; gx++) {
            if (newGrid[gy][gx].isRevealed && !newGrid[gy][gx].isMine) {
              revealedCount++;
            }
          }
        }

        const totalSafeCells =
          prevState.width * prevState.height - prevState.mineCount;
        if (revealedCount === totalSafeCells) {
          const endTime = Date.now();
          const timeSpent = Math.floor((endTime - prevState.startTime) / 1000);
          const bonus = Math.max(0, 1000 - timeSpent);
          const hintPenalty = prevState.hintsUsed * 100;
          const finalScore = Math.max(0, 1000 + bonus - hintPenalty);

          if (gameRecorder) {
            gameRecorder.endGame(finalScore);
            setGameRecorder(null);
          }

          return {
            ...prevState,
            grid: newGrid,
            gameStatus: "won",
            endTime,
            score: finalScore,
          };
        }

        return { ...prevState, grid: newGrid };
      });
    },
    [gameRecorder]
  );

  // 切换标记
  const toggleFlag = useCallback((x: number, y: number) => {
    setGameState((prevState) => {
      if (prevState.gameStatus !== "playing") return prevState;
      if (prevState.grid[y][x].isRevealed) return prevState;

      const newGrid = prevState.grid.map((row) =>
        row.map((cell) => ({ ...cell }))
      );
      const cell = newGrid[y][x];

      if (cell.isFlagged) {
        cell.isFlagged = false;
        return {
          ...prevState,
          grid: newGrid,
          minesLeft: prevState.minesLeft + 1,
          flagsUsed: prevState.flagsUsed - 1,
        };
      } else if (prevState.flagsUsed < prevState.mineCount) {
        cell.isFlagged = true;
        return {
          ...prevState,
          grid: newGrid,
          minesLeft: prevState.minesLeft - 1,
          flagsUsed: prevState.flagsUsed + 1,
        };
      }

      return prevState;
    });
  }, []);

  // 使用提示
  const useHint = useCallback(() => {
    setGameState((prevState) => {
      if (
        prevState.gameStatus !== "playing" ||
        prevState.hintsUsed >= prevState.maxHints
      )
        return prevState;

      // 找到所有未揭示且未标记的单元格
      const candidates: Position[] = [];
      for (let y = 0; y < prevState.height; y++) {
        for (let x = 0; x < prevState.width; x++) {
          const cell = prevState.grid[y][x];
          if (!cell.isRevealed && !cell.isFlagged && !cell.isMine) {
            candidates.push({ x, y });
          }
        }
      }

      if (candidates.length > 0) {
        const randomCell =
          candidates[Math.floor(Math.random() * candidates.length)];
        revealCell(randomCell.x, randomCell.y);

        return {
          ...prevState,
          hintsUsed: prevState.hintsUsed + 1,
        };
      }

      return prevState;
    });
  }, [revealCell]);

  // 处理单元格点击
  const handleCellClick = (x: number, y: number, isRightClick = false) => {
    if (gameState.gameStatus !== "playing") return;

    if (isRightClick) {
      toggleFlag(x, y);
    } else {
      // 如果是第一次点击，初始化游戏
      if (gameState.minesLeft === gameState.mineCount) {
        initializeGame(gameState.difficulty, { x, y });
        return;
      }
      revealCell(x, y);
    }
  };

  const startGame = (difficulty: keyof typeof DIFFICULTY_LEVELS) => {
    initializeGame(difficulty);
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Advanced Minesweeper",
      "advanced-minesweeper-game"
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
      grid: [],
      gameStatus: "playing",
      minesLeft: 0,
      flagsUsed: 0,
      startTime: 0,
      score: 0,
      difficulty: "beginner",
      width: 9,
      height: 9,
      mineCount: 10,
      hintsUsed: 0,
      maxHints: 3,
    });
    setIsPlaying(false);
  };

  // 获取单元格显示内容
  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged) return "🚩";
    if (!cell.isRevealed) return "";
    if (cell.isMine) return cell.isExploded ? "💥" : "💣";
    if (cell.neighborMines === 0) return "";
    return cell.neighborMines.toString();
  };

  // 获取单元格颜色
  const getCellColor = (cell: Cell) => {
    if (cell.isFlagged) return "bg-blue-500";
    if (!cell.isRevealed) return "bg-gray-600 hover:bg-gray-500";
    if (cell.isMine) return cell.isExploded ? "bg-red-600" : "bg-red-500";
    if (cell.neighborMines === 0) return "bg-gray-300";

    const colors = [
      "", // 0
      "bg-blue-100", // 1
      "bg-green-100", // 2
      "bg-red-100", // 3
      "bg-purple-100", // 4
      "bg-yellow-100", // 5
      "bg-pink-100", // 6
      "bg-indigo-100", // 7
      "bg-gray-100", // 8
    ];
    return colors[cell.neighborMines] || "bg-gray-200";
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            💣 Advanced Minesweeper
          </h2>
          <p className="text-white/70">
            Left click to reveal, right click to flag. Find all mines!
          </p>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">
              Mines: {gameState.minesLeft}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Time:{" "}
              {gameState.startTime
                ? Math.floor((Date.now() - gameState.startTime) / 1000)
                : 0}
              s
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Hints: {gameState.maxHints - gameState.hintsUsed}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="flex justify-center mb-6">
          <div
            className="grid gap-1 border-2 border-white/30 rounded-lg p-2 bg-gray-800"
            style={{
              gridTemplateColumns: `repeat(${gameState.width}, 1fr)`,
            }}
          >
            {gameState.grid.map((row, y) =>
              row.map((cell, x) => (
                <button
                  key={`${x}-${y}`}
                  onClick={() => handleCellClick(x, y)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCellClick(x, y, true);
                  }}
                  className={`w-8 h-8 flex items-center justify-center text-sm font-bold border border-gray-400 ${getCellColor(
                    cell
                  )} transition-colors duration-200`}
                  disabled={gameState.gameStatus !== "playing"}
                >
                  {getCellContent(cell)}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Game Status */}
        {gameState.gameStatus === "won" && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-green-400 mb-2">
              🎉 You Won!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">
              Time:{" "}
              {gameState.endTime
                ? Math.floor((gameState.endTime - gameState.startTime) / 1000)
                : 0}
              s
            </p>
          </div>
        )}

        {gameState.gameStatus === "lost" && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-400 mb-2">
              💥 Game Over!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4 mb-4">
          {!isPlaying && (
            <div className="flex space-x-2">
              {Object.entries(DIFFICULTY_LEVELS).map(([key, level]) => (
                <Button
                  key={key}
                  onClick={() =>
                    startGame(key as keyof typeof DIFFICULTY_LEVELS)
                  }
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {level.name}
                </Button>
              ))}
            </div>
          )}

          {isPlaying && gameState.gameStatus === "playing" && (
            <>
              <Button
                onClick={useHint}
                disabled={gameState.hintsUsed >= gameState.maxHints}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600"
              >
                💡 Hint ({gameState.maxHints - gameState.hintsUsed})
              </Button>
              <Button
                onClick={stopGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Stop
              </Button>
            </>
          )}

          {(gameState.gameStatus === "won" ||
            gameState.gameStatus === "lost") && (
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
          <p>🖱️ Left click to reveal cells</p>
          <p>🚩 Right click to flag/unflag mines</p>
          <p>💡 Use hints when stuck</p>
          <p>⏱️ Faster completion = higher score</p>
          <p>🎯 Numbers show nearby mine count</p>
        </div>
      </Card>
    </div>
  );
}
