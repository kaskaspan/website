"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface GameState {
  cards: Card[];
  flippedCards: number[];
  moves: number;
  matches: number;
  gameOver: boolean;
  isPaused: boolean;
}

const EMOJIS = [
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🙈",
  "🙉",
  "🙊",
  "🐒",
  "🦍",
  "🦧",
  "🐕",
  "🐩",
  "🦮",
];

export function MemoryGame() {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedCards: [],
    moves: 0,
    matches: 0,
    gameOver: false,
    isPaused: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [timeLeft, setTimeLeft] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const DIFFICULTY_LEVELS = {
    easy: { cards: 12, time: 120, name: "Easy" },
    medium: { cards: 16, time: 90, name: "Medium" },
    hard: { cards: 20, time: 60, name: "Hard" },
  };

  // 生成卡片
  const generateCards = useCallback((): Card[] => {
    const cardCount = DIFFICULTY_LEVELS[difficulty].cards;
    const emojis = EMOJIS.slice(0, cardCount / 2);
    const cards: Card[] = [];

    // 创建配对卡片
    emojis.forEach((emoji, index) => {
      cards.push(
        { id: index * 2, emoji, isFlipped: false, isMatched: false },
        { id: index * 2 + 1, emoji, isFlipped: false, isMatched: false }
      );
    });

    // 打乱卡片顺序
    return cards.sort(() => Math.random() - 0.5);
  }, [difficulty]);

  // 翻转卡片
  const flipCard = useCallback(
    (cardId: number) => {
      if (gameState.flippedCards.length >= 2 || gameState.isPaused) return;

      setGameState((prevState) => {
        const newCards = prevState.cards.map((card) =>
          card.id === cardId ? { ...card, isFlipped: true } : card
        );

        const newFlippedCards = [...prevState.flippedCards, cardId];

        // 如果翻开了两张卡片，检查是否匹配
        if (newFlippedCards.length === 2) {
          const [firstId, secondId] = newFlippedCards;
          const firstCard = newCards.find((card) => card.id === firstId);
          const secondCard = newCards.find((card) => card.id === secondId);

          if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
            // 匹配成功
            const updatedCards = newCards.map((card) =>
              card.id === firstId || card.id === secondId
                ? { ...card, isMatched: true }
                : card
            );

            const newMatches = prevState.matches + 1;
            const newMoves = prevState.moves + 1;

            // 检查游戏是否结束
            if (newMatches === DIFFICULTY_LEVELS[difficulty].cards / 2) {
              const score = Math.max(0, 1000 - newMoves * 10 + timeLeft * 5);
              setHighScore(Math.max(highScore, score));

              if (gameRecorder) {
                gameRecorder.endGame(score);
                setGameRecorder(null);
              }

              return {
                ...prevState,
                cards: updatedCards,
                flippedCards: [],
                moves: newMoves,
                matches: newMatches,
                gameOver: true,
              };
            }

            return {
              ...prevState,
              cards: updatedCards,
              flippedCards: [],
              moves: newMoves,
              matches: newMatches,
            };
          } else {
            // 匹配失败，延迟翻转回去
            setTimeout(() => {
              setGameState((prevState) => ({
                ...prevState,
                cards: prevState.cards.map((card) =>
                  card.id === firstId || card.id === secondId
                    ? { ...card, isFlipped: false }
                    : card
                ),
                flippedCards: [],
                moves: prevState.moves + 1,
              }));
            }, 1000);

            return {
              ...prevState,
              cards: newCards,
              flippedCards: newFlippedCards,
            };
          }
        }

        return {
          ...prevState,
          cards: newCards,
          flippedCards: newFlippedCards,
        };
      });
    },
    [
      gameState.flippedCards.length,
      gameState.isPaused,
      difficulty,
      gameRecorder,
      highScore,
      timeLeft,
    ]
  );

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (
      isPlaying &&
      timeLeft > 0 &&
      !gameState.gameOver &&
      !gameState.isPaused
    ) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 时间到，游戏结束
            if (gameRecorder) {
              gameRecorder.endGame(gameState.moves);
              setGameRecorder(null);
            }
            setGameState((prevState) => ({ ...prevState, gameOver: true }));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [
    isPlaying,
    timeLeft,
    gameState.gameOver,
    gameState.isPaused,
    gameRecorder,
    gameState.moves,
  ]);

  const startGame = () => {
    const cards = generateCards();
    const timeLimit = DIFFICULTY_LEVELS[difficulty].time;

    setGameState({
      cards,
      flippedCards: [],
      moves: 0,
      matches: 0,
      gameOver: false,
      isPaused: false,
    });
    setTimeLeft(timeLimit);
    setIsPlaying(true);

    // 开始自动记录
    const recorder = integrateGameWithAutoRecorder("Memory", "memory-game");
    setGameRecorder(recorder);
  };

  const stopGame = () => {
    setIsPlaying(false);
    if (gameRecorder) {
      gameRecorder.endGame(gameState.moves);
      setGameRecorder(null);
    }
  };

  const togglePause = () => {
    setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetGame = () => {
    setGameState({
      cards: [],
      flippedCards: [],
      moves: 0,
      matches: 0,
      gameOver: false,
      isPaused: false,
    });
    setTimeLeft(0);
    setIsPlaying(false);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">🧠 Memory Game</h2>
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
                className="grid gap-2 justify-center"
                style={{
                  gridTemplateColumns: `repeat(${Math.sqrt(
                    DIFFICULTY_LEVELS[difficulty].cards
                  )}, 1fr)`,
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
              >
                {gameState.cards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => flipCard(card.id)}
                    disabled={
                      gameState.gameOver || gameState.isPaused || card.isMatched
                    }
                    className={`w-16 h-16 rounded-lg border-2 text-2xl font-bold transition-all duration-300 transform hover:scale-105 ${
                      card.isFlipped || card.isMatched
                        ? "bg-white text-black border-gray-300"
                        : "bg-gray-700 text-white border-gray-500 hover:bg-gray-600"
                    } ${card.isMatched ? "opacity-50" : ""}`}
                  >
                    {card.isFlipped || card.isMatched ? card.emoji : "?"}
                  </button>
                ))}
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
                  移动次数:{" "}
                  <span className="text-blue-400 font-bold">
                    {gameState.moves}
                  </span>
                </div>
                <div>
                  匹配数:{" "}
                  <span className="text-green-400 font-bold">
                    {gameState.matches}
                  </span>
                </div>
                <div>
                  剩余时间:{" "}
                  <span
                    className={`font-bold ${
                      timeLeft <= 10 ? "text-red-400" : "text-yellow-400"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
                <div>
                  最高分数:{" "}
                  <span className="text-purple-400 font-bold">{highScore}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                控制说明
              </h3>
              <div className="space-y-1 text-sm text-white/70">
                <div>🖱️ 点击卡片翻开</div>
                <div>🎯 找到相同的卡片配对</div>
                <div>⏰ 在时间内完成所有配对</div>
                <div>🏆 用最少的移动次数获胜</div>
              </div>
            </div>

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
                        setDifficulty(key as keyof typeof DIFFICULTY_LEVELS)
                      }
                      className={`w-full text-sm ${
                        difficulty === key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      {level.name} ({level.cards} 卡片, {level.time}s)
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {gameState.gameOver && (
              <div className="bg-red-900/50 rounded-lg p-4 border border-red-500/50">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  {gameState.matches === DIFFICULTY_LEVELS[difficulty].cards / 2
                    ? "恭喜通关!"
                    : "游戏结束!"}
                </h3>
                <p className="text-white/80">移动次数: {gameState.moves}</p>
                <p className="text-white/80">匹配数: {gameState.matches}</p>
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
