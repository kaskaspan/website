"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface GameState {
  board: (string | null)[][];
  currentPlayer: "X" | "O";
  winner: string | null;
  gameOver: boolean;
  moves: number;
  score: { X: number; O: number };
  gameMode: "human" | "ai";
  difficulty: "easy" | "medium" | "hard";
}

const BOARD_SIZE = 3;
const WINNING_COMBINATIONS = [
  // Rows
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  // Columns
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  // Diagonals
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
];

export function TicTacToeGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array(BOARD_SIZE).fill(null)),
    currentPlayer: "X",
    winner: null,
    gameOver: false,
    moves: 0,
    score: { X: 0, O: 0 },
    gameMode: "human",
    difficulty: "medium",
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 检查获胜者
  const checkWinner = useCallback(
    (board: (string | null)[][]): string | null => {
      for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        const [ax, ay] = a;
        const [bx, by] = b;
        const [cx, cy] = c;

        if (
          board[ay][ax] &&
          board[ay][ax] === board[by][bx] &&
          board[ay][ax] === board[cy][cx]
        ) {
          return board[ay][ax];
        }
      }
      return null;
    },
    []
  );

  // 检查平局
  const checkDraw = useCallback((board: (string | null)[][]): boolean => {
    return board.every((row) => row.every((cell) => cell !== null));
  }, []);

  // AI 移动
  const getAIMove = useCallback(
    (
      board: (string | null)[][],
      difficulty: "easy" | "medium" | "hard"
    ): Position | null => {
      const availableMoves: Position[] = [];

      for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
          if (board[y][x] === null) {
            availableMoves.push({ x, y });
          }
        }
      }

      if (availableMoves.length === 0) return null;

      if (difficulty === "easy") {
        // 随机移动
        return availableMoves[
          Math.floor(Math.random() * availableMoves.length)
        ];
      }

      if (difficulty === "medium") {
        // 50% 概率使用智能移动，50% 随机移动
        if (Math.random() < 0.5) {
          return availableMoves[
            Math.floor(Math.random() * availableMoves.length)
          ];
        }
      }

      // 智能移动 (hard 模式或 medium 的智能部分)
      // 1. 检查是否能获胜
      for (const move of availableMoves) {
        const testBoard = board.map((row) => [...row]);
        testBoard[move.y][move.x] = "O";
        if (checkWinner(testBoard) === "O") {
          return move;
        }
      }

      // 2. 检查是否需要阻止对手获胜
      for (const move of availableMoves) {
        const testBoard = board.map((row) => [...row]);
        testBoard[move.y][move.x] = "X";
        if (checkWinner(testBoard) === "X") {
          return move;
        }
      }

      // 3. 优先选择中心
      const center = { x: 1, y: 1 };
      if (
        availableMoves.some(
          (move) => move.x === center.x && move.y === center.y
        )
      ) {
        return center;
      }

      // 4. 优先选择角落
      const corners = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 2 },
        { x: 2, y: 2 },
      ];
      for (const corner of corners) {
        if (
          availableMoves.some(
            (move) => move.x === corner.x && move.y === corner.y
          )
        ) {
          return corner;
        }
      }

      // 5. 随机选择
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    },
    [checkWinner]
  );

  // 处理单元格点击
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      setGameState((prevState) => {
        if (prevState.gameOver || prevState.board[y][x] !== null)
          return prevState;
        if (prevState.gameMode === "ai" && prevState.currentPlayer === "O")
          return prevState;

        const newBoard = prevState.board.map((row) => [...row]);
        newBoard[y][x] = prevState.currentPlayer;

        const winner = checkWinner(newBoard);
        const isDraw = checkDraw(newBoard);
        const gameOver = winner !== null || isDraw;

        const newScore = { ...prevState.score };
        if (winner) {
          newScore[winner as "X" | "O"] += 1;
        }

        const newState: GameState = {
          ...prevState,
          board: newBoard,
          currentPlayer: prevState.currentPlayer === "X" ? "O" : "X",
          winner,
          gameOver,
          moves: prevState.moves + 1,
          score: newScore,
        };

        // 更新自动记录器
        if (gameRecorder && winner) {
          gameRecorder.updateScore(newScore[winner as "X" | "O"] * 10);
        }

        return newState;
      });
    },
    [checkWinner, checkDraw, gameRecorder]
  );

  // AI 移动
  useEffect(() => {
    if (
      gameState.gameMode === "ai" &&
      gameState.currentPlayer === "O" &&
      !gameState.gameOver &&
      isPlaying
    ) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(gameState.board, gameState.difficulty);
        if (aiMove) {
          handleCellClick(aiMove.x, aiMove.y);
        }
      }, 500); // 延迟 500ms 让玩家看到 AI 的"思考"

      return () => clearTimeout(timer);
    }
  }, [
    gameState.currentPlayer,
    gameState.gameMode,
    gameState.board,
    gameState.gameOver,
    gameState.difficulty,
    isPlaying,
    getAIMove,
    handleCellClick,
  ]);

  const startGame = (mode: "human" | "ai") => {
    setGameState({
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null)),
      currentPlayer: "X",
      winner: null,
      gameOver: false,
      moves: 0,
      score: { X: 0, O: 0 },
      gameMode: mode,
      difficulty: "medium",
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Tic Tac Toe",
      "tic-tac-toe-game"
    );
    setGameRecorder(recorder);
  };

  const resetGame = () => {
    setGameState((prevState) => ({
      ...prevState,
      board: Array(BOARD_SIZE)
        .fill(null)
        .map(() => Array(BOARD_SIZE).fill(null)),
      currentPlayer: "X",
      winner: null,
      gameOver: false,
      moves: 0,
    }));
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score.X + gameState.score.O);
      setGameRecorder(null);
    }
  };

  const resetScore = () => {
    setGameState((prevState) => ({
      ...prevState,
      score: { X: 0, O: 0 },
    }));
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            ⭕❌ Tic Tac Toe
          </h2>
          <p className="text-white/70">
            {gameState.gameMode === "human" ? "Two players" : "Play against AI"}
          </p>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">
              X Score: {gameState.score.X}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              O Score: {gameState.score.O}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Moves: {gameState.moves}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Current: {gameState.currentPlayer}
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-3 gap-2 border-2 border-white/30 rounded-lg p-4 bg-gray-800">
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
              const x = index % BOARD_SIZE;
              const y = Math.floor(index / BOARD_SIZE);
              const cell = gameState.board[y][x];

              return (
                <button
                  key={index}
                  onClick={() => handleCellClick(x, y)}
                  disabled={gameState.gameOver || cell !== null}
                  className={`w-16 h-16 flex items-center justify-center text-2xl font-bold border-2 border-white/30 rounded-lg transition-all duration-200 ${
                    cell
                      ? cell === "X"
                        ? "bg-red-500 text-white"
                        : "bg-blue-500 text-white"
                      : "bg-gray-600 hover:bg-gray-500 text-white"
                  } ${
                    gameState.gameOver || cell !== null
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:scale-105"
                  }`}
                >
                  {cell}
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Status */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            {gameState.winner ? (
              <p className="text-2xl font-bold text-green-400 mb-2">
                🎉 {gameState.winner} Wins!
              </p>
            ) : (
              <p className="text-2xl font-bold text-yellow-400 mb-2">
                🤝 It&apos;s a Draw!
              </p>
            )}
          </div>
        )}

        {/* Game Mode Selection */}
        {!isPlaying && (
          <div className="mb-4">
            <div className="text-white text-center mb-2">Select Game Mode:</div>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => startGame("human")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                👥 Two Players
              </Button>
              <Button
                onClick={() => startGame("ai")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🤖 vs AI
              </Button>
            </div>
          </div>
        )}

        {/* AI Difficulty Selection */}
        {gameState.gameMode === "ai" && !isPlaying && (
          <div className="mb-4">
            <div className="text-white text-center mb-2">AI Difficulty:</div>
            <div className="flex justify-center space-x-2">
              {(["easy", "medium", "hard"] as const).map((diff) => (
                <Button
                  key={diff}
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, difficulty: diff }))
                  }
                  className={`px-3 py-1 text-sm ${
                    gameState.difficulty === diff
                      ? "bg-purple-600 text-white"
                      : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                  }`}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {isPlaying && (
            <>
              <Button
                onClick={resetGame}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                New Game
              </Button>
              <Button
                onClick={stopGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Stop
              </Button>
            </>
          )}

          <Button
            onClick={resetScore}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Reset Score
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-white/60 text-sm">
          <p>🎯 Get three in a row to win</p>
          <p>👥 Two players: Take turns clicking</p>
          <p>🤖 vs AI: You are X, AI is O</p>
          <p>🧠 AI gets smarter with higher difficulty</p>
          <p>🏆 First to win gets a point</p>
        </div>
      </Card>
    </div>
  );
}
