"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

// 游戏常量
const CARD_WIDTH = 60;
const CARD_HEIGHT = 80;
const SUIT_WIDTH = 40;
const SUIT_HEIGHT = 50;
const FOUNDATION_WIDTH = 60;
const FOUNDATION_HEIGHT = 80;
const STOCK_WIDTH = 60;
const STOCK_HEIGHT = 80;

// 花色
const SUITS = ["♠", "♥", "♦", "♣"] as const;
const SUIT_COLORS = {
  "♠": "text-black",
  "♥": "text-red-500",
  "♦": "text-red-500",
  "♣": "text-black",
};

// 牌面值
const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;

// 牌的类型
interface CardType {
  suit: (typeof SUITS)[number];
  rank: (typeof RANKS)[number];
  value: number;
  color: "red" | "black";
  id: string;
  faceUp?: boolean;
}

// 游戏状态
interface GameState {
  stock: CardType[];
  waste: CardType[];
  foundations: {
    [key in (typeof SUITS)[number]]: CardType[];
  };
  tableau: CardType[][];
  selectedCard: CardType | null;
  selectedPile: string | null;
  score: number;
  moves: number;
  gameOver: boolean;
  isPaused: boolean;
}

export function SolitaireGame() {
  const [gameState, setGameState] = useState<GameState>({
    stock: [],
    waste: [],
    foundations: {
      "♠": [],
      "♥": [],
      "♦": [],
      "♣": [],
    },
    tableau: [[], [], [], [], [], [], []],
    selectedCard: null,
    selectedPile: null,
    score: 0,
    moves: 0,
    gameOver: false,
    isPaused: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (score: number) => void;
  } | null>(null);

  // 创建一副牌
  const createDeck = useCallback((): CardType[] => {
    const deck: CardType[] = [];

    for (const suit of SUITS) {
      for (let i = 0; i < RANKS.length; i++) {
        const rank = RANKS[i];
        deck.push({
          suit,
          rank,
          value: i + 1,
          color: suit === "♥" || suit === "♦" ? "red" : "black",
          id: `${suit}-${rank}`,
        });
      }
    }

    return deck;
  }, []);

  // 洗牌
  const shuffleDeck = useCallback((deck: CardType[]): CardType[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // 初始化游戏
  const initializeGame = useCallback(() => {
    const deck = shuffleDeck(createDeck());
    const tableau: CardType[][] = [[], [], [], [], [], [], []];

    // 发牌到tableau
    let cardIndex = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[cardIndex++];
        if (row === col) {
          // 最后一张牌翻开
          card.faceUp = true;
        } else {
          card.faceUp = false;
        }
        tableau[col].push(card);
      }
    }

    // 剩余的牌放入stock
    const stock = deck
      .slice(cardIndex)
      .map((card) => ({ ...card, faceUp: false }));

    return {
      stock,
      waste: [],
      foundations: {
        "♠": [],
        "♥": [],
        "♦": [],
        "♣": [],
      },
      tableau,
      selectedCard: null,
      selectedPile: null,
      score: 0,
      moves: 0,
      gameOver: false,
      isPaused: false,
    };
  }, [createDeck, shuffleDeck]);

  // 检查是否可以移动到foundation
  const canMoveToFoundation = useCallback(
    (card: CardType, suit: (typeof SUITS)[number]): boolean => {
      const foundation = gameState.foundations[suit];
      if (foundation.length === 0) {
        return card.value === 1; // 只能放A
      }
      const topCard = foundation[foundation.length - 1];
      return card.suit === suit && card.value === topCard.value + 1;
    },
    [gameState.foundations]
  );

  // 检查是否可以移动到tableau
  const canMoveToTableau = useCallback(
    (card: CardType, targetCard: CardType | null): boolean => {
      if (!targetCard) {
        return card.value === 13; // 只能放K
      }
      return (
        card.color !== targetCard.color && card.value === targetCard.value - 1
      );
    },
    []
  );

  // 移动牌
  const moveCard = useCallback(
    (fromPile: string, toPile: string, cardIndex?: number) => {
      setGameState((prev) => {
        const newState = { ...prev };

        // 从源堆移除牌
        let card: CardType | null = null;
        if (fromPile === "stock") {
          card = newState.stock.pop()!;
          if (card) {
            newState.waste.push({ ...card, faceUp: true });
          }
        } else if (fromPile === "waste") {
          card = newState.waste.pop()!;
        } else if (fromPile.startsWith("tableau-")) {
          const col = parseInt(fromPile.split("-")[1]);
          card = newState.tableau[col].pop()!;
          // 翻开下一张牌
          if (newState.tableau[col].length > 0) {
            const lastCard =
              newState.tableau[col][newState.tableau[col].length - 1];
            if (!lastCard.faceUp) {
              newState.tableau[col][newState.tableau[col].length - 1] = {
                ...lastCard,
                faceUp: true,
              };
            }
          }
        } else if (fromPile.startsWith("foundation-")) {
          const suit = fromPile.split("-")[1] as (typeof SUITS)[number];
          card = newState.foundations[suit].pop()!;
        }

        // 如果没有牌可移动，返回原状态
        if (!card) {
          return newState;
        }

        // 移动到目标堆
        if (toPile.startsWith("foundation-")) {
          const suit = toPile.split("-")[1] as (typeof SUITS)[number];
          newState.foundations[suit].push(card);
          newState.score += 10;
        } else if (toPile.startsWith("tableau-")) {
          const col = parseInt(toPile.split("-")[1]);
          newState.tableau[col].push(card);
        }

        newState.moves += 1;
        newState.selectedCard = null;
        newState.selectedPile = null;

        // 检查游戏是否结束
        const allFoundationsFull = SUITS.every(
          (suit) => newState.foundations[suit].length === 13
        );
        if (allFoundationsFull) {
          newState.gameOver = true;
          newState.score += 1000; // 完成游戏奖励
        }

        return newState;
      });
    },
    []
  );

  // 自动移动到foundation
  const autoMoveToFoundation = useCallback(() => {
    setGameState((prev) => {
      const newState = { ...prev };
      let moved = false;

      // 检查waste堆
      if (newState.waste.length > 0) {
        const card = newState.waste[newState.waste.length - 1];
        for (const suit of SUITS) {
          if (canMoveToFoundation(card, suit)) {
            newState.waste.pop();
            newState.foundations[suit].push(card);
            newState.score += 10;
            moved = true;
            break;
          }
        }
      }

      // 检查tableau
      if (!moved) {
        for (let col = 0; col < 7; col++) {
          if (newState.tableau[col].length > 0) {
            const card =
              newState.tableau[col][newState.tableau[col].length - 1];
            if (card.faceUp) {
              for (const suit of SUITS) {
                if (canMoveToFoundation(card, suit)) {
                  newState.tableau[col].pop();
                  newState.foundations[suit].push(card);
                  newState.score += 10;
                  moved = true;
                  break;
                }
              }
            }
            if (moved) break;
          }
        }
      }

      return newState;
    });
  }, [canMoveToFoundation]);

  // 处理点击
  const handleCardClick = useCallback(
    (card: CardType, pile: string, index?: number) => {
      if (gameState.gameOver || gameState.isPaused) return;

      if (gameState.selectedCard) {
        // 尝试移动牌
        if (pile.startsWith("foundation-")) {
          const suit = pile.split("-")[1] as (typeof SUITS)[number];
          if (canMoveToFoundation(gameState.selectedCard, suit)) {
            moveCard(gameState.selectedPile!, pile);
          }
        } else if (pile.startsWith("tableau-")) {
          const col = parseInt(pile.split("-")[1]);
          const targetCard =
            gameState.tableau[col].length > 0
              ? gameState.tableau[col][gameState.tableau[col].length - 1]
              : null;
          if (canMoveToTableau(gameState.selectedCard, targetCard)) {
            moveCard(gameState.selectedPile!, pile);
          }
        }
      } else {
        // 选择牌
        if (card.faceUp) {
          setGameState((prev) => ({
            ...prev,
            selectedCard: card,
            selectedPile: pile,
          }));
        }
      }
    },
    [gameState, canMoveToFoundation, canMoveToTableau, moveCard]
  );

  // 从stock发牌
  const dealFromStock = useCallback(() => {
    setGameState((prev) => {
      if (prev.stock.length === 0) {
        // 重新洗牌waste到stock
        const newStock = prev.waste
          .reverse()
          .map((card) => ({ ...card, faceUp: false }));
        return {
          ...prev,
          stock: newStock,
          waste: [],
        };
      } else {
        // 发一张牌到waste
        const card = prev.stock.pop()!;
        return {
          ...prev,
          stock: prev.stock,
          waste: [...prev.waste, { ...card, faceUp: true }],
        };
      }
    });
  }, []);

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
      "Solitaire",
      "solitaire-game"
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

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.gameOver || !isPlaying) return;

      switch (e.key.toLowerCase()) {
        case "d":
          dealFromStock();
          break;
        case "a":
          autoMoveToFoundation();
          break;
        case "p":
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState.gameOver, isPlaying, dealFromStock, autoMoveToFoundation]);

  // 渲染牌
  const renderCard = useCallback(
    (card: CardType, isSelected: boolean = false) => {
      if (!card.faceUp) {
        return (
          <div
            className={`w-15 h-20 bg-blue-600 border-2 border-blue-800 rounded cursor-pointer ${
              isSelected ? "ring-2 ring-yellow-400" : ""
            }`}
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
          >
            <div className="w-full h-full bg-blue-600 rounded flex items-center justify-center">
              <div className="text-white text-xs">🂠</div>
            </div>
          </div>
        );
      }

      return (
        <div
          className={`w-15 h-20 bg-white border-2 border-gray-300 rounded cursor-pointer ${
            isSelected ? "ring-2 ring-yellow-400" : ""
          }`}
          style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        >
          <div className="w-full h-full flex flex-col justify-between p-1">
            <div className="flex flex-col items-start">
              <div className={`text-xs font-bold ${SUIT_COLORS[card.suit]}`}>
                {card.rank}
              </div>
              <div className={`text-xs ${SUIT_COLORS[card.suit]}`}>
                {card.suit}
              </div>
            </div>
            <div className="flex justify-center items-center flex-1">
              <div className={`text-2xl ${SUIT_COLORS[card.suit]}`}>
                {card.suit}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div
                className={`text-xs font-bold ${
                  SUIT_COLORS[card.suit]
                } transform rotate-180`}
              >
                {card.rank}
              </div>
              <div
                className={`text-xs ${
                  SUIT_COLORS[card.suit]
                } transform rotate-180`}
              >
                {card.suit}
              </div>
            </div>
          </div>
        </div>
      );
    },
    []
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="p-6 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🃏 Solitaire</h2>
          <p className="text-white/70">
            Classic card game! Build foundations and clear the tableau.
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
              Moves: {gameState.moves}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Stock: {gameState.stock.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">
              Waste: {gameState.waste.length}
            </div>
          </div>
        </div>

        {/* 游戏区域 */}
        <div className="space-y-6">
          {/* Stock和Waste区域 */}
          <div className="flex justify-between items-start">
            <div className="flex space-x-4">
              {/* Stock */}
              <div className="flex flex-col items-center">
                <div className="text-white text-sm mb-2">Stock</div>
                <div className="cursor-pointer" onClick={dealFromStock}>
                  {gameState.stock.length > 0 ? (
                    <div className="w-15 h-20 bg-blue-600 border-2 border-blue-800 rounded">
                      <div className="w-full h-full bg-blue-600 rounded flex items-center justify-center">
                        <div className="text-white text-xs">🂠</div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-15 h-20 border-2 border-dashed border-gray-400 rounded flex items-center justify-center">
                      <div className="text-gray-400 text-xs">Empty</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Waste */}
              <div className="flex flex-col items-center">
                <div className="text-white text-sm mb-2">Waste</div>
                <div className="flex space-x-1">
                  {gameState.waste.slice(-3).map((card, _index) => (
                    <div
                      key={`waste-${card.id}-${_index}`}
                      className="cursor-pointer"
                      onClick={() => handleCardClick(card, "waste", _index)}
                    >
                      {renderCard(card, gameState.selectedCard?.id === card.id)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Foundations */}
            <div className="flex space-x-2">
              {SUITS.map((suit) => (
                <div key={suit} className="flex flex-col items-center">
                  <div className="text-white text-sm mb-2">{suit}</div>
                  <div
                    className="w-15 h-20 border-2 border-white rounded cursor-pointer flex items-center justify-center"
                    style={{
                      width: FOUNDATION_WIDTH,
                      height: FOUNDATION_HEIGHT,
                    }}
                    onClick={() =>
                      handleCardClick({} as CardType, `foundation-${suit}`)
                    }
                  >
                    {gameState.foundations[suit].length > 0 ? (
                      renderCard(
                        gameState.foundations[suit][
                          gameState.foundations[suit].length - 1
                        ],
                        false
                      )
                    ) : (
                      <div className="text-white/50 text-xs">Empty</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau */}
          <div className="space-y-2">
            <div className="text-white text-sm mb-2">Tableau</div>
            <div className="flex space-x-2">
              {gameState.tableau.map((column, colIndex) => (
                <div
                  key={colIndex}
                  className="flex flex-col space-y-1 min-h-32"
                >
                  {column.map((card, cardIndex) => (
                    <div
                      key={`tableau-${colIndex}-${card.id}-${cardIndex}`}
                      className="cursor-pointer"
                      onClick={() =>
                        handleCardClick(card, `tableau-${colIndex}`, cardIndex)
                      }
                    >
                      {renderCard(card, gameState.selectedCard?.id === card.id)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 游戏结束 */}
        {gameState.gameOver && (
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-green-400 mb-2">
              🎉 You Win!
            </p>
            <p className="text-white/70">Final Score: {gameState.score}</p>
            <p className="text-white/70">Moves: {gameState.moves}</p>
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
                onClick={dealFromStock}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Deal (D)
              </Button>
              <Button
                onClick={autoMoveToFoundation}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Auto Move (A)
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
            Click cards to select and move them. Press D to deal, A for
            auto-move, P to pause.
          </p>
        </div>
      </Card>
    </div>
  );
}
