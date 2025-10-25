"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

// 游戏常量
const BOARD_SIZE = 8;
const GEM_SIZE = 60;
const GEM_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#feca57",
  "#ff9ff3",
  "#54a0ff",
  "#5f27cd",
];
const ANIMATION_DURATION = 300;

// 宝石类型
interface Gem {
  id: string;
  color: string;
  x: number;
  y: number;
  isSelected: boolean;
  isAnimating: boolean;
  isMatched: boolean;
}

// 游戏状态
interface GameState {
  board: Gem[][];
  selectedGem: Gem | null;
  score: number;
  moves: number;
  targetScore: number;
  timeLeft: number;
  gameOver: boolean;
  isPaused: boolean;
  isAnimating: boolean;
  combo: number;
  maxCombo: number;
}

export function MatchThreeGame() {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    selectedGem: null,
    score: 0,
    moves: 0,
    targetScore: 1000,
    timeLeft: 300, // 5分钟
    gameOver: false,
    isPaused: false,
    isAnimating: false,
    combo: 0,
    maxCombo: 0,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (score: number) => void;
  } | null>(null);

  // 生成随机颜色
  const getRandomColor = useCallback((): string => {
    return GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];
  }, []);

  // 创建宝石
  const createGem = useCallback(
    (x: number, y: number): Gem => {
      return {
        id: `gem-${x}-${y}-${Date.now()}`,
        color: getRandomColor(),
        x,
        y,
        isSelected: false,
        isAnimating: false,
        isMatched: false,
      };
    },
    [getRandomColor]
  );

  // 初始化游戏板
  const initializeBoard = useCallback((): Gem[][] => {
    const board: Gem[][] = [];

    for (let x = 0; x < BOARD_SIZE; x++) {
      board[x] = [];
      for (let y = 0; y < BOARD_SIZE; y++) {
        board[x][y] = createGem(x, y);
      }
    }

    return board;
  }, [createGem]);

  // 检查三个连续
  const checkMatch = useCallback(
    (board: Gem[][], x: number, y: number): boolean => {
      const gem = board[x][y];
      if (!gem) return false;

      // 检查水平方向
      let horizontalCount = 1;
      for (let i = x - 1; i >= 0 && board[i][y]?.color === gem.color; i--) {
        horizontalCount++;
      }
      for (
        let i = x + 1;
        i < BOARD_SIZE && board[i][y]?.color === gem.color;
        i++
      ) {
        horizontalCount++;
      }

      // 检查垂直方向
      let verticalCount = 1;
      for (let i = y - 1; i >= 0 && board[x][i]?.color === gem.color; i--) {
        verticalCount++;
      }
      for (
        let i = y + 1;
        i < BOARD_SIZE && board[x][i]?.color === gem.color;
        i++
      ) {
        verticalCount++;
      }

      return horizontalCount >= 3 || verticalCount >= 3;
    },
    []
  );

  // 找到所有匹配的宝石
  const findMatches = useCallback(
    (board: Gem[][]): Gem[] => {
      const matches: Gem[] = [];

      for (let x = 0; x < BOARD_SIZE; x++) {
        for (let y = 0; y < BOARD_SIZE; y++) {
          if (checkMatch(board, x, y)) {
            matches.push(board[x][y]);
          }
        }
      }

      return matches;
    },
    [checkMatch]
  );

  // 移除匹配的宝石
  const removeMatches = useCallback(
    (board: Gem[][]): Gem[][] => {
      const matches = findMatches(board);
      const newBoard = board.map((row) => row.map((gem) => ({ ...gem })));

      matches.forEach((match) => {
        newBoard[match.x][match.y].isMatched = true;
      });

      return newBoard;
    },
    [findMatches]
  );

  // 掉落宝石
  const dropGems = useCallback(
    (board: Gem[][]): Gem[][] => {
      const newBoard = board.map((row) => row.map((gem) => ({ ...gem })));

      for (let x = 0; x < BOARD_SIZE; x++) {
        let writeIndex = BOARD_SIZE - 1;

        for (let y = BOARD_SIZE - 1; y >= 0; y--) {
          if (!newBoard[x][y].isMatched) {
            if (writeIndex !== y) {
              newBoard[x][writeIndex] = { ...newBoard[x][y], y: writeIndex };
            }
            writeIndex--;
          }
        }

        // 填充空位
        for (let y = writeIndex; y >= 0; y--) {
          newBoard[x][y] = createGem(x, y);
        }
      }

      return newBoard;
    },
    [createGem]
  );

  // 处理宝石点击
  const handleGemClick = useCallback(
    (gem: Gem) => {
      if (gameState.gameOver || gameState.isPaused || gameState.isAnimating)
        return;

      setGameState((prev) => {
        if (prev.selectedGem) {
          // 检查是否可以交换
          const dx = Math.abs(gem.x - prev.selectedGem.x);
          const dy = Math.abs(gem.y - prev.selectedGem.y);

          if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            // 交换宝石
            const newBoard = prev.board.map((row) =>
              row.map((g) => ({ ...g }))
            );
            const temp = newBoard[gem.x][gem.y];
            newBoard[gem.x][gem.y] = {
              ...newBoard[prev.selectedGem.x][prev.selectedGem.y],
              x: gem.x,
              y: gem.y,
            };
            newBoard[prev.selectedGem.x][prev.selectedGem.y] = {
              ...temp,
              x: prev.selectedGem.x,
              y: prev.selectedGem.y,
            };

            // 检查是否有匹配
            const matches = findMatches(newBoard);
            if (matches.length > 0) {
              // 有匹配，执行消除
              return {
                ...prev,
                board: newBoard,
                selectedGem: null,
                isAnimating: true,
                moves: prev.moves + 1,
              };
            } else {
              // 没有匹配，交换回来
              const swapBack = prev.board.map((row) =>
                row.map((g) => ({ ...g }))
              );
              const temp2 = swapBack[gem.x][gem.y];
              swapBack[gem.x][gem.y] = {
                ...swapBack[prev.selectedGem.x][prev.selectedGem.y],
                x: gem.x,
                y: gem.y,
              };
              swapBack[prev.selectedGem.x][prev.selectedGem.y] = {
                ...temp2,
                x: prev.selectedGem.x,
                y: prev.selectedGem.y,
              };

              return {
                ...prev,
                board: swapBack,
                selectedGem: null,
              };
            }
          } else {
            // 选择新的宝石
            return {
              ...prev,
              selectedGem: gem,
              board: prev.board.map((row) =>
                row.map((g) => ({ ...g, isSelected: g.id === gem.id }))
              ),
            };
          }
        } else {
          // 选择宝石
          return {
            ...prev,
            selectedGem: gem,
            board: prev.board.map((row) =>
              row.map((g) => ({ ...g, isSelected: g.id === gem.id }))
            ),
          };
        }
      });
    },
    [gameState, findMatches]
  );

  // 执行消除动画
  useEffect(() => {
    if (!gameState.isAnimating) return;

    const timer = setTimeout(() => {
      setGameState((prev) => {
        let newBoard = removeMatches(prev.board);
        let newScore = prev.score;
        let newCombo = prev.combo;
        let newMaxCombo = prev.maxCombo;

        // 计算分数
        const matches = findMatches(newBoard);
        if (matches.length > 0) {
          newScore += matches.length * 10 * (1 + newCombo * 0.1);
          newCombo += 1;
          newMaxCombo = Math.max(newMaxCombo, newCombo);

          // 更新自动记录器
          if (gameRecorder) {
            gameRecorder.updateScore(newScore);
          }
        } else {
          newCombo = 0;
        }

        // 掉落宝石
        newBoard = dropGems(newBoard);

        // 检查是否还有匹配
        const newMatches = findMatches(newBoard);
        if (newMatches.length > 0) {
          // 继续消除
          return {
            ...prev,
            board: newBoard,
            score: newScore,
            combo: newCombo,
            maxCombo: newMaxCombo,
            isAnimating: true,
          };
        } else {
          // 消除结束
          return {
            ...prev,
            board: newBoard,
            score: newScore,
            combo: newCombo,
            maxCombo: newMaxCombo,
            isAnimating: false,
            gameOver: newScore >= prev.targetScore,
          };
        }
      });
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [
    gameState.isAnimating,
    removeMatches,
    findMatches,
    dropGems,
    gameRecorder,
  ]);

  // 初始化游戏
  const initializeGame = useCallback(() => {
    return {
      board: initializeBoard(),
      selectedGem: null,
      score: 0,
      moves: 0,
      targetScore: 1000,
      timeLeft: 300,
      gameOver: false,
      isPaused: false,
      isAnimating: false,
      combo: 0,
      maxCombo: 0,
    };
  }, [initializeBoard]);

  // 重置游戏
  const resetGame = useCallback(() => {
    const newGameState = initializeGame();
    setGameState(newGameState);
    setIsPlaying(false);
  }, [initializeGame]);

  // 开始游戏
  const startGame = useCallback(() => {
    const newGameState = initializeGame();
    setGameState(newGameState);
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Match Three",
      "match-three-game"
    );
    setGameRecorder(recorder);
  }, [initializeGame]);

  // 结束游戏
  const endGame = useCallback(() => {
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
    setIsPlaying(false);
  }, [gameRecorder, gameState.score]);

  // 计时器
  useEffect(() => {
    if (!isPlaying || gameState.gameOver || gameState.isPaused) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft <= 0) {
          return {
            ...prev,
            gameOver: true,
          };
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, gameState.gameOver, gameState.isPaused]);

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameOver || !isPlaying) return;

      switch (e.key.toLowerCase()) {
        case "p":
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState.gameOver, isPlaying]);

  // 渲染宝石
  const renderGem = useCallback(
    (gem: Gem) => {
      return (
        <div
          key={gem.id}
          className={`w-15 h-15 rounded-lg cursor-pointer transition-all duration-200 ${
            gem.isSelected ? "ring-4 ring-yellow-400 scale-110" : ""
          } ${gem.isMatched ? "opacity-50" : ""}`}
          style={{
            width: GEM_SIZE,
            height: GEM_SIZE,
            backgroundColor: gem.color,
            transform: gem.isAnimating ? "scale(0.8)" : "scale(1)",
          }}
          onClick={() => handleGemClick(gem)}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-2xl">💎</div>
          </div>
        </div>
      );
    },
    [handleGemClick]
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">💎 Match Three</h2>
          <p className="text-white/70">
            Match three or more gems to clear them and score points!
          </p>
        </div>

        {/* 游戏信息 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Score: {gameState.score}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Target: {gameState.targetScore}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Moves: {gameState.moves}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Time: {Math.floor(gameState.timeLeft / 60)}:
              {(gameState.timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* 连击信息 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Combo: {gameState.combo}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Max Combo: {gameState.maxCombo}
            </div>
          </div>
        </div>

        {/* 游戏板 */}
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-8 gap-1 p-4 bg-gray-800 rounded-lg">
            {gameState.board.map((row, _x) =>
              row.map((gem, _y) => <div key={gem.id}>{renderGem(gem)}</div>)
            )}
          </div>
        </div>

        {/* 游戏结束 */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            {gameState.score >= gameState.targetScore ? (
              <>
                <p className="text-2xl font-bold text-green-400 mb-2">
                  🎉 You Win!
                </p>
                <p className="text-white/70">Final Score: {gameState.score}</p>
                <p className="text-white/70">Moves: {gameState.moves}</p>
                <p className="text-white/70">Max Combo: {gameState.maxCombo}</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-red-400 mb-2">
                  ⏰ Time&apos;s Up!
                </p>
                <p className="text-white/70">Final Score: {gameState.score}</p>
                <p className="text-white/70">Target: {gameState.targetScore}</p>
              </>
            )}
          </div>
        )}

        {/* 控制按钮 */}
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
                onClick={resetGame}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reset
              </Button>
              <Button
                onClick={endGame}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                End Game
              </Button>
            </>
          )}
        </div>

        {/* 游戏说明 */}
        <div className="mt-6 text-center text-white/70 text-sm">
          <p>
            Click adjacent gems to swap them. Match 3+ gems to clear them and
            score points!
          </p>
        </div>
      </Card>
    </div>
  );
}
