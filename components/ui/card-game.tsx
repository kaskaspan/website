"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface PlayingCard {
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  value: number;
  displayValue: string;
  color: "red" | "black";
}

interface GameState {
  deck: PlayingCard[];
  playerHand: PlayingCard[];
  dealerHand: PlayingCard[];
  playerScore: number;
  dealerScore: number;
  gameOver: boolean;
  isWon: boolean;
  isDealerTurn: boolean;
  score: number;
  level: number;
  wins: number;
  losses: number;
}

const CARD_VALUES = {
  A: 11,
  K: 10,
  Q: 10,
  J: 10,
  "10": 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "4": 4,
  "3": 3,
  "2": 2,
};

const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const VALUES = [
  "A",
  "K",
  "Q",
  "J",
  "10",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
] as const;

export function CardGame() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    playerHand: [],
    dealerHand: [],
    playerScore: 0,
    dealerScore: 0,
    gameOver: false,
    isWon: false,
    isDealerTurn: false,
    score: 0,
    level: 1,
    wins: 0,
    losses: 0,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 创建牌组
  const createDeck = useCallback((): PlayingCard[] => {
    const deck: PlayingCard[] = [];
    SUITS.forEach((suit) => {
      VALUES.forEach((value) => {
        deck.push({
          suit,
          value: CARD_VALUES[value as keyof typeof CARD_VALUES],
          displayValue: value,
          color: suit === "hearts" || suit === "diamonds" ? "red" : "black",
        });
      });
    });
    return deck;
  }, []);

  // 洗牌
  const shuffleDeck = useCallback((deck: PlayingCard[]): PlayingCard[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // 计算手牌分数
  const calculateScore = useCallback((hand: PlayingCard[]): number => {
    let score = hand.reduce((sum, card) => sum + card.value, 0);
    let aces = hand.filter((card) => card.displayValue === "A").length;

    // 处理A的软硬值
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }

    return score;
  }, []);

  // 发牌
  const dealCard = useCallback(
    (deck: PlayingCard[]): { card: PlayingCard; newDeck: PlayingCard[] } => {
      const newDeck = [...deck];
      const card = newDeck.pop()!;
      return { card, newDeck };
    },
    []
  );

  // 初始化游戏
  const initializeGame = useCallback(() => {
    const deck = shuffleDeck(createDeck());
    const { card: card1, newDeck: deck1 } = dealCard(deck);
    const { card: card2, newDeck: deck2 } = dealCard(deck1);
    const { card: dealerCard1, newDeck: deck3 } = dealCard(deck2);
    const { card: dealerCard2, newDeck: finalDeck } = dealCard(deck3);

    const playerHand = [card1, card2];
    const dealerHand = [dealerCard1, dealerCard2];
    const playerScore = calculateScore(playerHand);
    const dealerScore = calculateScore(dealerHand);

    setGameState((prev) => ({
      ...prev,
      deck: finalDeck,
      playerHand,
      dealerHand,
      playerScore,
      dealerScore,
      gameOver: false,
      isWon: false,
      isDealerTurn: false,
    }));
  }, [createDeck, shuffleDeck, dealCard, calculateScore]);

  // 玩家要牌
  const hit = useCallback(() => {
    if (gameState.gameOver || gameState.isDealerTurn) return;

    setGameState((prev) => {
      const { card, newDeck } = dealCard(prev.deck);
      const newPlayerHand = [...prev.playerHand, card];
      const newPlayerScore = calculateScore(newPlayerHand);

      let gameOver = false;
      let isWon = false;

      if (newPlayerScore > 21) {
        gameOver = true;
        isWon = false;
      } else if (newPlayerScore === 21) {
        gameOver = true;
        isWon = true;
      }

      return {
        ...prev,
        deck: newDeck,
        playerHand: newPlayerHand,
        playerScore: newPlayerScore,
        gameOver,
        isWon,
      };
    });
  }, [gameState.gameOver, gameState.isDealerTurn, dealCard, calculateScore]);

  // 玩家停牌
  const stand = useCallback(() => {
    if (gameState.gameOver) return;

    setGameState((prev) => ({
      ...prev,
      isDealerTurn: true,
    }));
  }, [gameState.gameOver]);

  // 庄家回合
  useEffect(() => {
    if (!gameState.isDealerTurn || gameState.gameOver) return;

    const dealerTurn = setInterval(() => {
      setGameState((prev) => {
        const dealerScore = calculateScore(prev.dealerHand);

        if (dealerScore < 17) {
          // 庄家要牌
          const { card, newDeck } = dealCard(prev.deck);
          const newDealerHand = [...prev.dealerHand, card];
          const newDealerScore = calculateScore(newDealerHand);

          return {
            ...prev,
            deck: newDeck,
            dealerHand: newDealerHand,
            dealerScore: newDealerScore,
          };
        } else {
          // 庄家停牌，判断胜负
          clearInterval(dealerTurn);

          let isWon = false;
          if (dealerScore > 21 || prev.playerScore > dealerScore) {
            isWon = true;
          } else if (prev.playerScore === dealerScore) {
            isWon = false; // 平局
          }

          const newScore = prev.score + (isWon ? 10 : 0);
          const newWins = prev.wins + (isWon ? 1 : 0);
          const newLosses = prev.losses + (isWon ? 0 : 1);

          // 更新自动记录器
          if (gameRecorder && isWon) {
            gameRecorder.updateScore(newScore);
          }

          return {
            ...prev,
            gameOver: true,
            isWon,
            score: newScore,
            wins: newWins,
            losses: newLosses,
          };
        }
      });
    }, 1000);

    return () => clearInterval(dealerTurn);
  }, [
    gameState.isDealerTurn,
    gameState.gameOver,
    calculateScore,
    dealCard,
    gameRecorder,
  ]);

  const startGame = () => {
    initializeGame();
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder("Card Game", "card-game");
    setGameRecorder(recorder);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState((prev) => ({
      ...prev,
      deck: [],
      playerHand: [],
      dealerHand: [],
      playerScore: 0,
      dealerScore: 0,
      gameOver: false,
      isWon: false,
      isDealerTurn: false,
    }));
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
  };

  // 渲染卡片
  const renderCard = (card: PlayingCard, isHidden = false) => {
    if (isHidden) {
      return (
        <div className="w-16 h-24 bg-blue-600 border-2 border-white rounded-lg flex items-center justify-center">
          <div className="text-white font-bold">?</div>
        </div>
      );
    }

    const suitSymbols = {
      hearts: "♥",
      diamonds: "♦",
      clubs: "♣",
      spades: "♠",
    };

    return (
      <div
        className={`w-16 h-24 border-2 border-white rounded-lg flex flex-col items-center justify-center ${
          card.color === "red"
            ? "bg-red-100 text-red-600"
            : "bg-white text-black"
        }`}
      >
        <div className="text-lg font-bold">{card.displayValue}</div>
        <div className="text-2xl">{suitSymbols[card.suit]}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-6 bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">🃏 Card Game</h2>
          <p className="text-white/70">
            Blackjack! Get as close to 21 as possible without going over.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Wins: {gameState.wins}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Losses: {gameState.losses}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">High Score: {highScore}</div>
          </div>
        </div>

        {/* 庄家手牌 */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-bold mb-2">
            Dealer ({gameState.dealerScore})
          </h3>
          <div className="flex space-x-2">
            {gameState.dealerHand.map((card, index) =>
              renderCard(card, !gameState.gameOver && index === 1)
            )}
          </div>
        </div>

        {/* 玩家手牌 */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-bold mb-2">
            Player ({gameState.playerScore})
          </h3>
          <div className="flex space-x-2">
            {gameState.playerHand.map((card, index) => renderCard(card, false))}
          </div>
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            {gameState.isWon ? (
              <p className="text-2xl font-bold text-green-400 mb-2">
                🎉 You Win!
              </p>
            ) : gameState.playerScore === gameState.dealerScore ? (
              <p className="text-2xl font-bold text-yellow-400 mb-2">
                🤝 It&apos;s a Tie!
              </p>
            ) : (
              <p className="text-2xl font-bold text-red-400 mb-2">
                💀 You Lose!
              </p>
            )}
            <p className="text-white/70">
              Player: {gameState.playerScore} | Dealer: {gameState.dealerScore}
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
              {!gameState.gameOver && !gameState.isDealerTurn && (
                <>
                  <Button
                    onClick={hit}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Hit
                  </Button>
                  <Button
                    onClick={stand}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Stand
                  </Button>
                </>
              )}
              <Button
                onClick={resetGame}
                className="bg-gray-600 hover:bg-gray-700 text-white"
              >
                New Game
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-white/70 text-sm">
          <p>🎮 Click Hit to get another card, Stand to stop</p>
          <p>🎯 Get as close to 21 as possible without going over</p>
          <p>👑 Face cards (J, Q, K) are worth 10</p>
          <p>🅰️ Aces can be worth 1 or 11</p>
        </div>
      </Card>
    </div>
  );
}
