"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface PuzzlePiece {
  id: number;
  position: Position;
  correctPosition: Position;
  isCorrect: boolean;
}

interface GameState {
  pieces: PuzzlePiece[];
  emptyPosition: Position;
  moves: number;
  timeElapsed: number;
  isCompleted: boolean;
  difficulty: "easy" | "medium" | "hard";
  size: number;
}

const PUZZLE_SIZES = {
  easy: { size: 3, name: "3x3 Easy" },
  medium: { size: 4, name: "4x4 Medium" },
  hard: { size: 5, name: "5x5 Hard" },
};

export function PuzzleGame() {
  const [gameState, setGameState] = useState<GameState>({
    pieces: [],
    emptyPosition: { x: 0, y: 0 },
    moves: 0,
    timeElapsed: 0,
    isCompleted: false,
    difficulty: "easy",
    size: 3,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);
  const [highScore, setHighScore] = useState(0);

  // 初始化拼图
  const initializePuzzle = useCallback(
    (difficulty: keyof typeof PUZZLE_SIZES) => {
      const size = PUZZLE_SIZES[difficulty].size;
      const pieces: PuzzlePiece[] = [];

      // 创建拼图块
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (x === size - 1 && y === size - 1) continue; // 跳过最后一个位置（空白）

          pieces.push({
            id: y * size + x + 1,
            position: { x, y },
            correctPosition: { x, y },
            isCorrect: false,
          });
        }
      }

      // 打乱拼图块
      const shuffledPieces = [...pieces];
      for (let i = shuffledPieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPieces[i], shuffledPieces[j]] = [
          shuffledPieces[j],
          shuffledPieces[i],
        ];
      }

      // 重新分配位置
      const newPieces = shuffledPieces.map((piece, index) => ({
        ...piece,
        position: { x: index % size, y: Math.floor(index / size) },
      }));

      setGameState({
        pieces: newPieces,
        emptyPosition: { x: size - 1, y: size - 1 },
        moves: 0,
        timeElapsed: 0,
        isCompleted: false,
        difficulty,
        size,
      });
    },
    []
  );

  // 检查是否可以移动
  const canMove = useCallback(
    (piece: PuzzlePiece, emptyPos: Position): boolean => {
      const dx = Math.abs(piece.position.x - emptyPos.x);
      const dy = Math.abs(piece.position.y - emptyPos.y);
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    },
    []
  );

  // 移动拼图块
  const movePiece = useCallback(
    (piece: PuzzlePiece) => {
      if (!canMove(piece, gameState.emptyPosition) || gameState.isCompleted)
        return;

      setGameState((prevState) => {
        const newPieces = prevState.pieces.map((p) => {
          if (p.id === piece.id) {
            return {
              ...p,
              position: prevState.emptyPosition,
              isCorrect:
                prevState.emptyPosition.x === p.correctPosition.x &&
                prevState.emptyPosition.y === p.correctPosition.y,
            };
          }
          return p;
        });

        const newEmptyPosition = piece.position;
        const newMoves = prevState.moves + 1;

        // 检查是否完成
        const isCompleted = newPieces.every((p) => p.isCorrect);

        // 更新自动记录器
        if (gameRecorder && isCompleted) {
          const score = Math.max(
            0,
            1000 - newMoves * 10 - Math.floor(prevState.timeElapsed / 1000) * 5
          );
          gameRecorder.updateScore(score);
        }

        return {
          ...prevState,
          pieces: newPieces,
          emptyPosition: newEmptyPosition,
          moves: newMoves,
          isCompleted,
        };
      });
    },
    [gameState.emptyPosition, gameState.isCompleted, canMove, gameRecorder]
  );

  // 计时器
  useEffect(() => {
    if (!isPlaying || gameState.isCompleted) return;

    const timer = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        timeElapsed: prev.timeElapsed + 100,
      }));
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, gameState.isCompleted]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameState.isCompleted) return;

      const { emptyPosition, pieces } = gameState;
      let targetPiece: PuzzlePiece | undefined = undefined;

      switch (e.key) {
        case "ArrowUp":
          targetPiece = pieces.find(
            (p) =>
              p.position.x === emptyPosition.x &&
              p.position.y === emptyPosition.y + 1
          );
          break;
        case "ArrowDown":
          targetPiece = pieces.find(
            (p) =>
              p.position.x === emptyPosition.x &&
              p.position.y === emptyPosition.y - 1
          );
          break;
        case "ArrowLeft":
          targetPiece = pieces.find(
            (p) =>
              p.position.x === emptyPosition.x + 1 &&
              p.position.y === emptyPosition.y
          );
          break;
        case "ArrowRight":
          targetPiece = pieces.find(
            (p) =>
              p.position.x === emptyPosition.x - 1 &&
              p.position.y === emptyPosition.y
          );
          break;
      }

      if (targetPiece) {
        movePiece(targetPiece);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, gameState, movePiece]);

  const startGame = (difficulty: keyof typeof PUZZLE_SIZES) => {
    initializePuzzle(difficulty);
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Puzzle Game",
      "puzzle-game"
    );
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.moves);
      setGameRecorder(null);
    }
  };

  const resetGame = () => {
    setGameState({
      pieces: [],
      emptyPosition: { x: 0, y: 0 },
      moves: 0,
      timeElapsed: 0,
      isCompleted: false,
      difficulty: "easy",
      size: 3,
    });
    setIsPlaying(false);
  };

  const shufflePuzzle = () => {
    initializePuzzle(gameState.difficulty);
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🧩 Puzzle Game</h2>
          <p className="text-white/70">
            Click pieces to move them. Arrange numbers in order!
          </p>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Moves: {gameState.moves}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Time: {Math.floor(gameState.timeElapsed / 1000)}s
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Difficulty: {PUZZLE_SIZES[gameState.difficulty].name}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">High Score: {highScore}</div>
          </div>
        </div>

        {/* Puzzle Board */}
        <div className="flex justify-center mb-6">
          <div
            className="grid gap-1 border-2 border-white/30 rounded-lg p-4 bg-gray-800"
            style={{
              gridTemplateColumns: `repeat(${gameState.size}, 1fr)`,
            }}
          >
            {Array.from(
              { length: gameState.size * gameState.size },
              (_, index) => {
                const x = index % gameState.size;
                const y = Math.floor(index / gameState.size);
                const piece = gameState.pieces.find(
                  (p) => p.position.x === x && p.position.y === y
                );
                const isEmpty =
                  x === gameState.emptyPosition.x &&
                  y === gameState.emptyPosition.y;

                return (
                  <button
                    key={index}
                    onClick={() => piece && movePiece(piece)}
                    disabled={gameState.isCompleted || !piece}
                    className={`w-12 h-12 flex items-center justify-center text-lg font-bold border-2 border-white/30 rounded-lg transition-all duration-200 ${
                      isEmpty
                        ? "bg-gray-600 cursor-not-allowed"
                        : piece
                        ? `${
                            piece.isCorrect
                              ? "bg-green-500 text-white"
                              : "bg-blue-500 text-white hover:bg-blue-400"
                          } cursor-pointer hover:scale-105`
                        : "bg-gray-600 cursor-not-allowed"
                    } ${
                      gameState.isCompleted || !piece
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    {piece ? piece.id : ""}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Completion Message */}
        {gameState.isCompleted && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-green-400 mb-2">
              🎉 Puzzle Complete!
            </p>
            <p className="text-white/70">
              Completed in {gameState.moves} moves and{" "}
              {Math.floor(gameState.timeElapsed / 1000)} seconds!
            </p>
            <p className="text-white/70">
              Score:{" "}
              {Math.max(
                0,
                1000 -
                  gameState.moves * 10 -
                  Math.floor(gameState.timeElapsed / 1000) * 5
              )}
            </p>
          </div>
        )}

        {/* Difficulty Selection */}
        {!isPlaying && (
          <div className="mb-4">
            <div className="text-white text-center mb-2">
              Select Difficulty:
            </div>
            <div className="flex justify-center space-x-2">
              {Object.entries(PUZZLE_SIZES).map(([key, level]) => (
                <Button
                  key={key}
                  onClick={() => startGame(key as keyof typeof PUZZLE_SIZES)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {level.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {isPlaying && !gameState.isCompleted && (
            <>
              <Button
                onClick={shufflePuzzle}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                🔀 Shuffle
              </Button>
              <Button
                onClick={stopGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Stop
              </Button>
            </>
          )}

          {gameState.isCompleted && (
            <Button
              onClick={resetGame}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              New Puzzle
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-white/60 text-sm">
          <p>🖱️ Click pieces to move them</p>
          <p>⌨️ Use arrow keys to move pieces</p>
          <p>
            🎯 Arrange numbers 1 to {gameState.size * gameState.size - 1} in
            order
          </p>
          <p>⏱️ Faster completion = higher score</p>
          <p>🔀 Use shuffle if you get stuck</p>
        </div>
      </Card>
    </div>
  );
}
