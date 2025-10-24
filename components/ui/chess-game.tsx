"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface Piece {
  type: "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
  color: "white" | "black";
  hasMoved?: boolean;
}

interface GameState {
  board: (Piece | null)[][];
  currentPlayer: "white" | "black";
  selectedPiece: Position | null;
  possibleMoves: Position[];
  gameStatus: "playing" | "check" | "checkmate" | "stalemate";
  capturedPieces: { white: Piece[]; black: Piece[] };
  moveHistory: string[];
  isInCheck: boolean;
  winner: "white" | "black" | null;
}

const INITIAL_BOARD: (Piece | null)[][] = [
  [
    { type: "rook", color: "black" },
    { type: "knight", color: "black" },
    { type: "bishop", color: "black" },
    { type: "queen", color: "black" },
    { type: "king", color: "black" },
    { type: "bishop", color: "black" },
    { type: "knight", color: "black" },
    { type: "rook", color: "black" },
  ],
  Array(8).fill({ type: "pawn", color: "black" }),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill({ type: "pawn", color: "white" }),
  [
    { type: "rook", color: "white" },
    { type: "knight", color: "white" },
    { type: "bishop", color: "white" },
    { type: "queen", color: "white" },
    { type: "king", color: "white" },
    { type: "bishop", color: "white" },
    { type: "knight", color: "white" },
    { type: "rook", color: "white" },
  ],
];

const PIECE_SYMBOLS = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙",
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  },
};

export function ChessGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: INITIAL_BOARD.map((row) => [...row]),
    currentPlayer: "white",
    selectedPiece: null,
    possibleMoves: [],
    gameStatus: "playing",
    capturedPieces: { white: [], black: [] },
    moveHistory: [],
    isInCheck: false,
    winner: null,
  });

  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 检查位置是否在棋盘内
  const isValidPosition = (pos: Position): boolean => {
    return pos.x >= 0 && pos.x < 8 && pos.y >= 0 && pos.y < 8;
  };

  // 获取棋子的可能移动位置
  const getPossibleMoves = useCallback(
    (
      piece: Piece,
      position: Position,
      board: (Piece | null)[][]
    ): Position[] => {
      const moves: Position[] = [];
      const { type, color } = piece;
      const { x, y } = position;

      const isEnemy = (pos: Position) => {
        const piece = board[pos.y]?.[pos.x];
        return piece && piece.color !== color;
      };

      const isEmpty = (pos: Position) => {
        return !board[pos.y]?.[pos.x];
      };

      const isOwnPiece = (pos: Position) => {
        const piece = board[pos.y]?.[pos.x];
        return piece && piece.color === color;
      };

      const addMove = (pos: Position) => {
        if (isValidPosition(pos) && !isOwnPiece(pos)) {
          moves.push(pos);
        }
      };

      const addDirectionalMoves = (
        dx: number,
        dy: number,
        maxDistance: number = 7
      ) => {
        for (let i = 1; i <= maxDistance; i++) {
          const newPos = { x: x + dx * i, y: y + dy * i };
          if (!isValidPosition(newPos)) break;

          if (isEmpty(newPos)) {
            moves.push(newPos);
          } else if (isEnemy(newPos)) {
            moves.push(newPos);
            break;
          } else {
            break;
          }
        }
      };

      switch (type) {
        case "pawn":
          const direction = color === "white" ? -1 : 1;
          const startRow = color === "white" ? 6 : 1;

          // 向前移动
          const forward1 = { x, y: y + direction };
          if (isValidPosition(forward1) && isEmpty(forward1)) {
            moves.push(forward1);

            // 初始位置可以向前移动两格
            const forward2 = { x, y: y + direction * 2 };
            if (
              y === startRow &&
              isValidPosition(forward2) &&
              isEmpty(forward2)
            ) {
              moves.push(forward2);
            }
          }

          // 吃子（斜向）
          const captureLeft = { x: x - 1, y: y + direction };
          const captureRight = { x: x + 1, y: y + direction };
          if (isValidPosition(captureLeft) && isEnemy(captureLeft)) {
            moves.push(captureLeft);
          }
          if (isValidPosition(captureRight) && isEnemy(captureRight)) {
            moves.push(captureRight);
          }
          break;

        case "rook":
          addDirectionalMoves(0, 1);
          addDirectionalMoves(0, -1);
          addDirectionalMoves(1, 0);
          addDirectionalMoves(-1, 0);
          break;

        case "bishop":
          addDirectionalMoves(1, 1);
          addDirectionalMoves(1, -1);
          addDirectionalMoves(-1, 1);
          addDirectionalMoves(-1, -1);
          break;

        case "queen":
          addDirectionalMoves(0, 1);
          addDirectionalMoves(0, -1);
          addDirectionalMoves(1, 0);
          addDirectionalMoves(-1, 0);
          addDirectionalMoves(1, 1);
          addDirectionalMoves(1, -1);
          addDirectionalMoves(-1, 1);
          addDirectionalMoves(-1, -1);
          break;

        case "king":
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              if (dx === 0 && dy === 0) continue;
              addMove({ x: x + dx, y: y + dy });
            }
          }
          break;

        case "knight":
          const knightMoves = [
            { dx: 2, dy: 1 },
            { dx: 2, dy: -1 },
            { dx: -2, dy: 1 },
            { dx: -2, dy: -1 },
            { dx: 1, dy: 2 },
            { dx: -1, dy: 2 },
            { dx: 1, dy: -2 },
            { dx: -1, dy: -2 },
          ];
          knightMoves.forEach(({ dx, dy }) => {
            addMove({ x: x + dx, y: y + dy });
          });
          break;
      }

      return moves;
    },
    []
  );

  // 检查是否将军
  const isInCheck = useCallback(
    (board: (Piece | null)[][], player: "white" | "black"): boolean => {
      // 找到国王位置
      let kingPos: Position | null = null;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const piece = board[y][x];
          if (piece && piece.type === "king" && piece.color === player) {
            kingPos = { x, y };
            break;
          }
        }
        if (kingPos) break;
      }

      if (!kingPos) return false;

      // 检查是否有敌方棋子可以攻击国王
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const piece = board[y][x];
          if (piece && piece.color !== player) {
            const moves = getPossibleMoves(piece, { x, y }, board);
            if (
              moves.some(
                (move) => move.x === kingPos!.x && move.y === kingPos!.y
              )
            ) {
              return true;
            }
          }
        }
      }

      return false;
    },
    [getPossibleMoves]
  );

  // 检查移动是否合法（不会导致自己被将军）
  const isValidMove = useCallback(
    (from: Position, to: Position, board: (Piece | null)[][]): boolean => {
      const newBoard = board.map((row) => [...row]);
      const piece = newBoard[from.y][from.x];
      if (!piece) return false;

      // 执行移动
      newBoard[to.y][to.x] = piece;
      newBoard[from.y][from.x] = null;

      // 检查移动后是否会被将军
      return !isInCheck(newBoard, piece.color);
    },
    [isInCheck]
  );

  // 处理格子点击
  const handleSquareClick = (x: number, y: number) => {
    const position = { x, y };
    const piece = gameState.board[y][x];

    // 如果点击的是己方棋子，选择它
    if (piece && piece.color === gameState.currentPlayer) {
      const moves = getPossibleMoves(piece, position, gameState.board).filter(
        (move) => isValidMove(position, move, gameState.board)
      );

      setGameState((prev) => ({
        ...prev,
        selectedPiece: position,
        possibleMoves: moves,
      }));
    }
    // 如果已选择棋子且点击的是可能移动位置，执行移动
    else if (
      gameState.selectedPiece &&
      gameState.possibleMoves.some((move) => move.x === x && move.y === y)
    ) {
      makeMove(gameState.selectedPiece, position);
    }
    // 否则取消选择
    else {
      setGameState((prev) => ({
        ...prev,
        selectedPiece: null,
        possibleMoves: [],
      }));
    }
  };

  // 执行移动
  const makeMove = (from: Position, to: Position) => {
    const newBoard = gameState.board.map((row) => [...row]);
    const piece = newBoard[from.y][from.x];
    const capturedPiece = newBoard[to.y][to.x];

    if (!piece) return;

    // 记录移动
    const moveNotation = `${piece.type}${String.fromCharCode(97 + from.x)}${
      8 - from.y
    } → ${String.fromCharCode(97 + to.x)}${8 - to.y}`;

    // 执行移动
    newBoard[to.y][to.x] = { ...piece, hasMoved: true };
    newBoard[from.y][from.x] = null;

    // 处理吃子
    const newCapturedPieces = { ...gameState.capturedPieces };
    if (capturedPiece) {
      newCapturedPieces[capturedPiece.color].push(capturedPiece);
    }

    // 检查将军
    const newIsInCheck = isInCheck(
      newBoard,
      gameState.currentPlayer === "white" ? "black" : "white"
    );

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      currentPlayer: prev.currentPlayer === "white" ? "black" : "white",
      selectedPiece: null,
      possibleMoves: [],
      capturedPieces: newCapturedPieces,
      moveHistory: [...prev.moveHistory, moveNotation],
      isInCheck: newIsInCheck,
    }));

    // 更新自动记录器
    if (gameRecorder) {
      const currentScore = gameRecorder.getCurrentScore();
      gameRecorder.updateScore(currentScore + (capturedPiece ? 10 : 1));
    }
  };

  // 重置游戏
  const resetGame = () => {
    setGameState({
      board: INITIAL_BOARD.map((row) => [...row]),
      currentPlayer: "white",
      selectedPiece: null,
      possibleMoves: [],
      gameStatus: "playing",
      capturedPieces: { white: [], black: [] },
      moveHistory: [],
      isInCheck: false,
      winner: null,
    });
    setIsPlaying(false);
  };

  const [isPlaying, setIsPlaying] = useState(false);

  const startGame = () => {
    setIsPlaying(true);
    const recorder = integrateGameWithAutoRecorder("Chess", "chess-game");
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.moveHistory.length);
      setGameRecorder(null);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">♟️ Chess Game</h2>
          <p className="text-white/70">
            Click on a piece to select it, then click on a valid move
          </p>
        </div>

        {/* Game Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">
              Current Player:{" "}
              {gameState.currentPlayer === "white" ? "⚪ White" : "⚫ Black"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Moves: {gameState.moveHistory.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Status: {gameState.isInCheck ? "⚠️ Check!" : "✅ Safe"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Captured:{" "}
              {gameState.capturedPieces.white.length +
                gameState.capturedPieces.black.length}
            </div>
          </div>
        </div>

        {/* Chess Board */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-8 gap-0 border-2 border-white/30 rounded-lg overflow-hidden">
            {Array.from({ length: 64 }, (_, index) => {
              const x = index % 8;
              const y = Math.floor(index / 8);
              const piece = gameState.board[y][x];
              const isLight = (x + y) % 2 === 0;
              const isSelected =
                gameState.selectedPiece?.x === x &&
                gameState.selectedPiece?.y === y;
              const isPossibleMove = gameState.possibleMoves.some(
                (move) => move.x === x && move.y === y
              );

              return (
                <button
                  key={index}
                  onClick={() => handleSquareClick(x, y)}
                  className={`w-12 h-12 flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
                    isLight ? "bg-amber-100" : "bg-amber-800"
                  } ${
                    isSelected
                      ? "bg-yellow-400 ring-2 ring-yellow-300"
                      : isPossibleMove
                      ? "bg-green-400 ring-2 ring-green-300"
                      : "hover:bg-opacity-80"
                  }`}
                >
                  {piece && (
                    <span
                      className={
                        piece.color === "white" ? "text-white" : "text-black"
                      }
                    >
                      {PIECE_SYMBOLS[piece.color][piece.type]}
                    </span>
                  )}
                  {isPossibleMove && !piece && (
                    <div className="w-3 h-3 bg-green-500 rounded-full opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Captured Pieces */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <h3 className="text-white font-bold mb-2">Captured White Pieces</h3>
            <div className="flex flex-wrap gap-1 justify-center">
              {gameState.capturedPieces.white.map((piece, index) => (
                <span key={index} className="text-white text-lg">
                  {PIECE_SYMBOLS.white[piece.type]}
                </span>
              ))}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-white font-bold mb-2">Captured Black Pieces</h3>
            <div className="flex flex-wrap gap-1 justify-center">
              {gameState.capturedPieces.black.map((piece, index) => (
                <span key={index} className="text-black text-lg">
                  {PIECE_SYMBOLS.black[piece.type]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Move History */}
        {gameState.moveHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-bold mb-2">Move History</h3>
            <div className="bg-black/20 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="text-white/70 text-sm">
                {gameState.moveHistory.slice(-10).map((move, index) => (
                  <div key={index} className="mb-1">
                    {index + 1}. {move}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Controls */}
        <div className="flex justify-center space-x-4">
          {!isPlaying && (
            <Button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Start Game
            </Button>
          )}

          {isPlaying && (
            <Button
              onClick={stopGame}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Stop Game
            </Button>
          )}

          <Button
            onClick={resetGame}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Reset Game
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center text-white/60 text-sm">
          <p>🎯 Click on your piece to select it</p>
          <p>🎯 Click on a highlighted square to move</p>
          <p>♟️ Pawns move forward, capture diagonally</p>
          <p>🏰 Rooks move horizontally and vertically</p>
          <p>⚡ Bishops move diagonally</p>
          <p>👑 Queen combines rook and bishop moves</p>
          <p>♔ King moves one square in any direction</p>
          <p>🐎 Knights move in L-shape</p>
          <p>⚠️ Protect your king from check!</p>
        </div>
      </Card>
    </div>
  );
}
