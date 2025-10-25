"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 6;
const CELL_SIZE = 40;

interface Position {
  x: number;
  y: number;
}

interface GameState {
  board: (string | null)[][];
  currentPlayer: "red" | "yellow";
  gameOver: boolean;
  winner: "red" | "yellow" | "draw" | null;
  moves: number;
  score: { red: number; yellow: number };
}

export function ConnectFourGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null)),
    currentPlayer: "red",
    gameOver: false,
    winner: null,
    moves: 0,
    score: { red: 0, yellow: 0 },
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 检查胜利条件
  const checkWin = useCallback(
    (
      board: (string | null)[][],
      row: number,
      col: number,
      player: string
    ): boolean => {
      const directions = [
        [0, 1], // 水平
        [1, 0], // 垂直
        [1, 1], // 对角线
        [1, -1], // 反对角线
      ];

      for (const [dx, dy] of directions) {
        let count = 1;

        // 向一个方向检查
        for (let i = 1; i < 4; i++) {
          const newRow = row + dx * i;
          const newCol = col + dy * i;
          if (
            newRow >= 0 &&
            newRow < BOARD_HEIGHT &&
            newCol >= 0 &&
            newCol < BOARD_WIDTH &&
            board[newRow][newCol] === player
          ) {
            count++;
          } else {
            break;
          }
        }

        // 向相反方向检查
        for (let i = 1; i < 4; i++) {
          const newRow = row - dx * i;
          const newCol = col - dy * i;
          if (
            newRow >= 0 &&
            newRow < BOARD_HEIGHT &&
            newCol >= 0 &&
            newCol < BOARD_WIDTH &&
            board[newRow][newCol] === player
          ) {
            count++;
          } else {
            break;
          }
        }

        if (count >= 4) {
          return true;
        }
      }

      return false;
    },
    []
  );

  // 检查列是否已满
  const isColumnFull = useCallback(
    (board: (string | null)[][], col: number): boolean => {
      return board[0][col] !== null;
    },
    []
  );

  // 获取列中下一个空位置
  const getNextEmptyRow = useCallback(
    (board: (string | null)[][], col: number): number => {
      for (let row = BOARD_HEIGHT - 1; row >= 0; row--) {
        if (board[row][col] === null) {
          return row;
        }
      }
      return -1;
    },
    []
  );

  // 放置棋子
  const makeMove = useCallback(
    (col: number) => {
      if (gameState.gameOver || isColumnFull(gameState.board, col)) return;

      setGameState((prev) => {
        const newBoard = prev.board.map((row) => [...row]);
        const row = getNextEmptyRow(newBoard, col);

        if (row === -1) return prev;

        newBoard[row][col] = prev.currentPlayer;
        const newMoves = prev.moves + 1;

        // 检查胜利
        const isWin = checkWin(newBoard, row, col, prev.currentPlayer);
        let gameOver = isWin;
        let winner = isWin ? prev.currentPlayer : null;

        // 检查平局
        if (!isWin && newMoves === BOARD_WIDTH * BOARD_HEIGHT) {
          gameOver = true;
          winner = "draw";
        }

        // 更新分数
        const newScore = { ...prev.score };
        if (isWin) {
          newScore[prev.currentPlayer as "red" | "yellow"] += 1;
        }

        // 更新自动记录器
        if (gameRecorder && isWin) {
          gameRecorder.updateScore(
            newScore[prev.currentPlayer as "red" | "yellow"] * 10
          );
        }

        return {
          ...prev,
          board: newBoard,
          currentPlayer: prev.currentPlayer === "red" ? "yellow" : "red",
          gameOver,
          winner,
          moves: newMoves,
          score: newScore,
        };
      });
    },
    [
      gameState.gameOver,
      gameState.board,
      isColumnFull,
      getNextEmptyRow,
      checkWin,
      gameRecorder,
    ]
  );

  // 重置游戏
  const resetGame = useCallback(() => {
    setGameState({
      board: Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null)),
      currentPlayer: "red",
      gameOver: false,
      winner: null,
      moves: 0,
      score: gameState.score,
    });
  }, [gameState.score]);

  // 处理列点击
  const handleColumnClick = useCallback(
    (col: number) => {
      makeMove(col);
    },
    [makeMove]
  );

  const startGame = () => {
    resetGame();
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Connect Four",
      "connect-four-game"
    );
    setGameRecorder(recorder);
  };

  const endGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score.red + gameState.score.yellow);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-6 bg-gradient-to-br from-blue-900 via-purple-900 to-red-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            🔴🟡 Connect Four
          </h2>
          <p className="text-white/70">
            Get four in a row to win! Click on a column to drop your piece.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Red: {gameState.score.red}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Yellow: {gameState.score.yellow}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Moves: {gameState.moves}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">High Score: {highScore}</div>
          </div>
        </div>

        {/* 当前玩家指示器 */}
        <div className="text-center mb-4">
          <div
            className={`text-xl font-bold ${
              gameState.currentPlayer === "red"
                ? "text-red-400"
                : "text-yellow-400"
            }`}
          >
            Current Player:{" "}
            {gameState.currentPlayer === "red" ? "🔴 Red" : "🟡 Yellow"}
          </div>
        </div>

        {/* 游戏板 */}
        <div
          className="relative mx-auto mb-6 bg-blue-600 border-4 border-blue-800 rounded-lg p-2"
          style={{
            width: BOARD_WIDTH * CELL_SIZE + 8,
            height: BOARD_HEIGHT * CELL_SIZE + 8,
          }}
        >
          {/* 列点击区域 */}
          {Array.from({ length: BOARD_WIDTH }, (_, col) => (
            <div
              key={col}
              className="absolute top-0 cursor-pointer hover:bg-blue-500/30 rounded"
              style={{
                left: col * CELL_SIZE + 4,
                top: 4,
                width: CELL_SIZE,
                height: BOARD_HEIGHT * CELL_SIZE,
              }}
              onClick={() => handleColumnClick(col)}
            />
          ))}

          {/* 棋子 */}
          {gameState.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="absolute rounded-full border-2 border-white"
                style={{
                  left: colIndex * CELL_SIZE + 4,
                  top: rowIndex * CELL_SIZE + 4,
                  width: CELL_SIZE - 4,
                  height: CELL_SIZE - 4,
                  backgroundColor:
                    cell === "red"
                      ? "#ef4444"
                      : cell === "yellow"
                      ? "#eab308"
                      : "#374151",
                }}
              >
                {cell && (
                  <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {cell === "red" ? "🔴" : "🟡"}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 游戏状态 */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            {gameState.winner === "draw" ? (
              <p className="text-2xl font-bold text-gray-400 mb-2">
                🤝 It&apos;s a Draw!
              </p>
            ) : (
              <p className="text-2xl font-bold text-green-400 mb-2">
                🎉 {gameState.winner === "red" ? "🔴 Red" : "🟡 Yellow"} Wins!
              </p>
            )}
            <p className="text-white/70">
              Game completed in {gameState.moves} moves
            </p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          {!isPlaying ? (
            <Button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Start Game
            </Button>
          ) : (
            <>
              <Button
                onClick={resetGame}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                New Game
              </Button>
              <Button
                onClick={endGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                End Game
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-white/70 text-sm">
          <p>🎮 Click on a column to drop your piece</p>
          <p>🏆 Get four in a row to win</p>
          <p>🔴 Red goes first, then Yellow</p>
          <p>📊 Score is tracked across games</p>
        </div>
      </Card>
    </div>
  );
}
