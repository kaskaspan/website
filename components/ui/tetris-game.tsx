"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Position {
  x: number;
  y: number;
}

interface TetrisPiece {
  shape: number[][];
  color: string;
  position: Position;
}

interface GameState {
  board: string[][];
  currentPiece: TetrisPiece | null;
  nextPiece: TetrisPiece | null;
  score: number;
  lines: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETRIS_PIECES = [
  {
    shape: [[1, 1, 1, 1]],
    color: "#00f0f0",
    name: "I",
  },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "#f0f000",
    name: "O",
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "#a000f0",
    name: "T",
  },
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "#00f000",
    name: "S",
  },
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "#f00000",
    name: "Z",
  },
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "#f0a000",
    name: "L",
  },
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "#0000f0",
    name: "J",
  },
];

export function TetrisGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill("")),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    isPaused: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<any>(null);

  // 生成随机方块
  const generatePiece = useCallback((): TetrisPiece => {
    const piece =
      TETRIS_PIECES[Math.floor(Math.random() * TETRIS_PIECES.length)];
    return {
      shape: piece.shape,
      color: piece.color,
      position: {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2),
        y: 0,
      },
    };
  }, []);

  // 检查碰撞
  const checkCollision = useCallback(
    (piece: TetrisPiece, board: string[][], dx: number = 0, dy: number = 0) => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.position.x + x + dx;
            const newY = piece.position.y + y + dy;

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return true;
            }

            if (newY >= 0 && board[newY][newX]) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  // 放置方块
  const placePiece = useCallback((piece: TetrisPiece, board: string[][]) => {
    const newBoard = board.map((row) => [...row]);

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }

    return newBoard;
  }, []);

  // 清除完整的行
  const clearLines = useCallback((board: string[][]) => {
    const newBoard = board.filter((row) => row.some((cell) => !cell));
    const linesCleared = BOARD_HEIGHT - newBoard.length;

    // 添加新的空行到顶部
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(""));
    }

    return { board: newBoard, linesCleared };
  }, []);

  // 游戏循环
  const gameLoop = useCallback(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    setGameState((prevState) => {
      if (!prevState.currentPiece) {
        const newPiece = generatePiece();
        if (checkCollision(newPiece, prevState.board)) {
          // 游戏结束
          if (gameRecorder) {
            gameRecorder.endGame(prevState.score);
            setGameRecorder(null);
          }
          return { ...prevState, gameOver: true };
        }
        return { ...prevState, currentPiece: newPiece };
      }

      // 移动方块向下
      const newPosition = {
        x: prevState.currentPiece.position.x,
        y: prevState.currentPiece.position.y + 1,
      };

      if (
        checkCollision(
          { ...prevState.currentPiece, position: newPosition },
          prevState.board
        )
      ) {
        // 方块无法继续下降，放置方块
        const newBoard = placePiece(prevState.currentPiece, prevState.board);
        const { board: clearedBoard, linesCleared } = clearLines(newBoard);

        const newScore = prevState.score + linesCleared * 100 * prevState.level;
        const newLines = prevState.lines + linesCleared;
        const newLevel = Math.floor(newLines / 10) + 1;

        // 更新自动记录器中的分数
        if (gameRecorder) {
          gameRecorder.updateScore(newScore);
        }

        return {
          ...prevState,
          board: clearedBoard,
          currentPiece: null,
          score: newScore,
          lines: newLines,
          level: newLevel,
        };
      } else {
        // 继续下降
        return {
          ...prevState,
          currentPiece: { ...prevState.currentPiece, position: newPosition },
        };
      }
    });
  }, [
    isPlaying,
    gameState.gameOver,
    gameState.isPaused,
    gameRecorder,
    generatePiece,
    checkCollision,
    placePiece,
    clearLines,
  ]);

  // 键盘控制
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!isPlaying || gameState.gameOver) return;

      // 阻止默认行为，防止页面滚动
      if (
        ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)
      ) {
        e.preventDefault();
      }

      setGameState((prevState) => {
        if (!prevState.currentPiece) return prevState;

        let newPosition = { ...prevState.currentPiece.position };

        switch (e.key) {
          case "ArrowLeft":
            newPosition.x -= 1;
            break;
          case "ArrowRight":
            newPosition.x += 1;
            break;
          case "ArrowDown":
            newPosition.y += 1;
            break;
          case "ArrowUp":
            // 旋转方块（简化版本，可以后续添加）
            break;
          case " ":
            // 硬降
            while (
              !checkCollision(
                { ...prevState.currentPiece, position: newPosition },
                prevState.board
              )
            ) {
              newPosition.y += 1;
            }
            newPosition.y -= 1;
            break;
          default:
            return prevState;
        }

        if (
          !checkCollision(
            { ...prevState.currentPiece, position: newPosition },
            prevState.board
          )
        ) {
          return {
            ...prevState,
            currentPiece: { ...prevState.currentPiece, position: newPosition },
          };
        }

        return prevState;
      });
    },
    [isPlaying, gameState.gameOver, checkCollision]
  );

  useEffect(() => {
    if (isPlaying) {
      // 减慢下降速度，基础速度改为1500ms，每级增加100ms间隔
      const interval = setInterval(
        gameLoop,
        Math.max(800, 1500 - (gameState.level - 1) * 100)
      );
      return () => clearInterval(interval);
    }
  }, [isPlaying, gameLoop, gameState.level]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const startGame = () => {
    setGameState({
      board: Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill("")),
      currentPiece: null,
      nextPiece: null,
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      isPaused: false,
    });
    setIsPlaying(true);

    // 开始自动记录
    const recorder = integrateGameWithAutoRecorder("Tetris", "tetris-game");
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

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🧩 Tetris</h2>
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
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)` }}
              >
                {gameState.board.map((row, y) =>
                  row.map((cell, x) => (
                    <div
                      key={`${y}-${x}`}
                      className="aspect-square border border-gray-600"
                      style={{
                        backgroundColor: cell || "#1a1a1a",
                        borderColor: cell ? cell : "#333",
                      }}
                    />
                  ))
                )}
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
                  行数:{" "}
                  <span className="text-blue-400 font-bold">
                    {gameState.lines}
                  </span>
                </div>
                <div>
                  等级:{" "}
                  <span className="text-green-400 font-bold">
                    {gameState.level}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                控制说明
              </h3>
              <div className="space-y-1 text-sm text-white/70">
                <div>← → 移动</div>
                <div>↓ 软降</div>
                <div>空格 硬降</div>
              </div>
            </div>

            {gameState.gameOver && (
              <div className="bg-red-900/50 rounded-lg p-4 border border-red-500/50">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  游戏结束!
                </h3>
                <p className="text-white/80">最终分数: {gameState.score}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
