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
  position: Position;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

interface GameState {
  board: Cell[][];
  mines: Position[];
  gameOver: boolean;
  gameWon: boolean;
  isPaused: boolean;
  firstClick: boolean;
  startTime: number;
  endTime?: number;
  score: number;
}

const BOARD_SIZE = 12;
const MINE_COUNT = 20;
const CELL_SIZE = 35;

export function MinesweeperGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    mines: [],
    gameOver: false,
    gameWon: false,
    isPaused: false,
    firstClick: true,
    startTime: 0,
    score: 0,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 生成地雷位置
  const generateMines = useCallback((excludePosition: Position): Position[] => {
    const mines: Position[] = [];
    while (mines.length < MINE_COUNT) {
      const x = Math.floor(Math.random() * BOARD_SIZE);
      const y = Math.floor(Math.random() * BOARD_SIZE);
      const position = { x, y };

      // 确保第一次点击的位置和周围8个格子没有地雷
      const isExcludePosition =
        position.x === excludePosition.x && position.y === excludePosition.y;
      const isExcludeNeighbor =
        Math.abs(position.x - excludePosition.x) <= 1 &&
        Math.abs(position.y - excludePosition.y) <= 1;

      if (
        !mines.some((mine) => mine.x === x && mine.y === y) &&
        !isExcludePosition &&
        !isExcludeNeighbor
      ) {
        mines.push(position);
      }
    }
    return mines;
  }, []);

  // 计算邻居地雷数量
  const countNeighborMines = useCallback(
    (position: Position, mines: Position[]): number => {
      let count = 0;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const x = position.x + dx;
          const y = position.y + dy;
          if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (mines.some((mine) => mine.x === x && mine.y === y)) {
              count++;
            }
          }
        }
      }
      return count;
    },
    []
  );

  // 初始化游戏板
  const initializeBoard = useCallback(
    (mines: Position[]): Cell[][] => {
      const board: Cell[][] = [];
      for (let y = 0; y < BOARD_SIZE; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < BOARD_SIZE; x++) {
          const position = { x, y };
          row.push({
            position,
            isMine: mines.some((mine) => mine.x === x && mine.y === y),
            isRevealed: false,
            isFlagged: false,
            neighborMines: countNeighborMines(position, mines),
          });
        }
        board.push(row);
      }
      return board;
    },
    [countNeighborMines]
  );

  // 揭示单元格
  const revealCell = useCallback(
    (position: Position) => {
      setGameState((prevState) => {
        if (prevState.gameOver || prevState.gameWon) return prevState;

        const newBoard = prevState.board.map((row) =>
          row.map((cell) => ({ ...cell }))
        );

        const cell = newBoard[position.y][position.x];
        if (cell.isRevealed || cell.isFlagged) return prevState;

        cell.isRevealed = true;

        // 如果点击到地雷，游戏结束
        if (cell.isMine) {
          // 揭示所有地雷
          newBoard.forEach((row) => {
            row.forEach((cell) => {
              if (cell.isMine) {
                cell.isRevealed = true;
              }
            });
          });

          // 结束自动记录
          if (gameRecorder) {
            gameRecorder.endGame(prevState.score);
            setGameRecorder(null);
          }

          return { ...prevState, board: newBoard, gameOver: true };
        }

        // 如果单元格周围没有地雷，自动揭示相邻单元格
        if (cell.neighborMines === 0) {
          const revealNeighbors = (pos: Position) => {
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const x = pos.x + dx;
                const y = pos.y + dy;
                if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
                  const neighbor = newBoard[y][x];
                  if (!neighbor.isRevealed && !neighbor.isFlagged) {
                    neighbor.isRevealed = true;
                    if (neighbor.neighborMines === 0) {
                      revealNeighbors({ x, y });
                    }
                  }
                }
              }
            }
          };
          revealNeighbors(position);
        }

        // 检查是否获胜
        const revealedCells = newBoard
          .flat()
          .filter((cell) => cell.isRevealed).length;
        const totalSafeCells = BOARD_SIZE * BOARD_SIZE - MINE_COUNT;

        if (revealedCells === totalSafeCells) {
          // 游戏胜利
          const endTime = Date.now();
          const gameTime = Math.floor((endTime - prevState.startTime) / 1000);
          const newScore = Math.max(0, 10000 - gameTime * 10); // 基于时间的分数

          if (gameRecorder) {
            gameRecorder.endGame(newScore);
            setGameRecorder(null);
          }

          return {
            ...prevState,
            board: newBoard,
            gameWon: true,
            endTime,
            score: newScore,
          };
        }

        return { ...prevState, board: newBoard };
      });
    },
    [gameRecorder]
  );

  // 标记/取消标记单元格
  const toggleFlag = useCallback((position: Position) => {
    setGameState((prevState) => {
      if (prevState.gameOver || prevState.gameWon) return prevState;

      const newBoard = prevState.board.map((row) =>
        row.map((cell) => ({ ...cell }))
      );

      const cell = newBoard[position.y][position.x];
      if (cell.isRevealed) return prevState;

      cell.isFlagged = !cell.isFlagged;
      return { ...prevState, board: newBoard };
    });
  }, []);

  // 处理单元格点击
  const handleCellClick = useCallback(
    (position: Position, isRightClick: boolean = false) => {
      if (isRightClick) {
        toggleFlag(position);
      } else {
        revealCell(position);
      }
    },
    [revealCell, toggleFlag]
  );

  // 处理触控板点击
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, position: Position) => {
      e.preventDefault();
      // 触控板点击相当于左键点击
      handleCellClick(position);
    },
    [handleCellClick]
  );

  // 处理触控板长按（右键功能）
  const handleTouchLongPress = useCallback(
    (position: Position) => {
      toggleFlag(position);
    },
    [toggleFlag]
  );

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
        setElapsedTime(Math.floor((Date.now() - gameState.startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.gameWon,
    gameState.isPaused,
    gameState.startTime,
  ]);

  const startGame = () => {
    const startTime = Date.now();
    // 创建空的游戏板，显示所有格子但未揭示
    const emptyBoard = Array(BOARD_SIZE)
      .fill(null)
      .map((_, y) =>
        Array(BOARD_SIZE)
          .fill(null)
          .map((_, x) => ({
            position: { x, y },
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
          }))
      );

    setGameState({
      board: emptyBoard,
      mines: [],
      gameOver: false,
      gameWon: false,
      isPaused: false,
      firstClick: true,
      startTime,
      score: 0,
    });
    setElapsedTime(0);
    setIsPlaying(true);

    // 开始自动记录
    const recorder = integrateGameWithAutoRecorder(
      "Minesweeper",
      "minesweeper-game"
    );
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);

    // 结束自动记录
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
      setGameRecorder(null);
    }
  };

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetGame = () => {
    // 创建空的游戏板，显示所有格子但未揭示
    const emptyBoard = Array(BOARD_SIZE)
      .fill(null)
      .map((_, y) =>
        Array(BOARD_SIZE)
          .fill(null)
          .map((_, x) => ({
            position: { x, y },
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0,
          }))
      );

    setGameState({
      board: emptyBoard,
      mines: [],
      gameOver: false,
      gameWon: false,
      isPaused: false,
      firstClick: true,
      startTime: 0,
      score: 0,
    });
    setElapsedTime(0);
    setIsPlaying(false);
  };

  // 首次点击时生成地雷
  const handleFirstClick = (position: Position) => {
    if (gameState.firstClick) {
      const mines = generateMines(position);
      const board = initializeBoard(mines);
      setGameState((prev) => ({
        ...prev,
        board,
        mines,
        firstClick: false,
      }));
    }
  };

  const getCellColor = (cell: Cell) => {
    if (cell.isFlagged) return "bg-yellow-500";
    if (!cell.isRevealed) return "bg-gray-600 hover:bg-gray-500";
    if (cell.isMine) return "bg-red-500";

    const colors = [
      "bg-gray-800", // 0
      "bg-blue-500", // 1
      "bg-green-500", // 2
      "bg-red-500", // 3
      "bg-purple-500", // 4
      "bg-yellow-500", // 5
      "bg-pink-500", // 6
      "bg-orange-500", // 7
      "bg-gray-400", // 8
    ];
    return colors[cell.neighborMines] || "bg-gray-800";
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">💣 Minesweeper</h2>
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
                  style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
                    maxWidth: "400px",
                    maxHeight: "400px",
                  }}
                >
                  {gameState.board.map((row, y) =>
                    row.map((cell, x) => (
                      <button
                        key={`${y}-${x}`}
                        className={`w-8 h-8 border border-gray-500 text-white text-xs font-bold transition-colors ${getCellColor(
                          cell
                        )}`}
                        onClick={() => {
                          if (gameState.firstClick) {
                            handleFirstClick({ x, y });
                          }
                          handleCellClick({ x, y });
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (gameState.firstClick) {
                            handleFirstClick({ x, y });
                          }
                          handleCellClick({ x, y }, true);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          if (gameState.firstClick) {
                            handleFirstClick({ x, y });
                          }
                          handleTouchStart(e, { x, y });
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                        }}
                        disabled={
                          gameState.gameOver ||
                          gameState.gameWon ||
                          gameState.isPaused
                        }
                      >
                        {cell.isFlagged
                          ? "🚩"
                          : cell.isRevealed && cell.isMine
                          ? "💣"
                          : cell.isRevealed && cell.neighborMines > 0
                          ? cell.neighborMines
                          : ""}
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
                    {elapsedTime}s
                  </span>
                </div>
                <div>
                  地雷:{" "}
                  <span className="text-red-400 font-bold">
                    {MINE_COUNT -
                      gameState.board.flat().filter((cell) => cell.isFlagged)
                        .length}
                  </span>
                </div>
                <div>
                  分数:{" "}
                  <span className="text-yellow-400 font-bold">
                    {gameState.score}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                控制说明
              </h3>
              <div className="space-y-1 text-sm text-white/70">
                <div>🖱️ 左键: 揭示格子</div>
                <div>🖱️ 右键: 标记/取消标记</div>
                <div>👆 触控板点击: 揭示格子</div>
                <div>👆 触控板长按: 标记格子</div>
                <div>🎯 目标: 找出所有地雷</div>
                <div>⚡ 数字表示周围地雷数量</div>
              </div>
            </div>

            {gameState.gameOver && (
              <div className="bg-red-900/50 rounded-lg p-4 border border-red-500/50">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  游戏结束!
                </h3>
                <p className="text-white/80">你踩到地雷了!</p>
                <Button
                  onClick={resetGame}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  重新开始
                </Button>
              </div>
            )}

            {gameState.gameWon && (
              <div className="bg-green-900/50 rounded-lg p-4 border border-green-500/50">
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  恭喜通关!
                </h3>
                <p className="text-white/80">用时: {elapsedTime}秒</p>
                <p className="text-white/80">分数: {gameState.score}</p>
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
