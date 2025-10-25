"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { integrateGameWithAutoRecorder } from "@/lib/auto-recorder";

interface GameState {
  word: string;
  guessedLetters: string[];
  wrongGuesses: number;
  gameOver: boolean;
  isWon: boolean;
  score: number;
  level: number;
  timeLeft: number;
}

const WORDS_BY_LEVEL = {
  1: ["CAT", "DOG", "SUN", "MOON", "STAR", "TREE", "FISH", "BIRD"],
  2: ["HOUSE", "WATER", "LIGHT", "MUSIC", "DANCE", "SMILE", "DREAM", "PEACE"],
  3: [
    "ELEPHANT",
    "MOUNTAIN",
    "ADVENTURE",
    "BEAUTIFUL",
    "FRIENDSHIP",
    "HAPPINESS",
    "KNOWLEDGE",
    "WONDERFUL",
  ],
  4: [
    "EXTRAORDINARY",
    "MAGNIFICENT",
    "EXTRAVAGANZA",
    "SOPHISTICATED",
    "REVOLUTIONARY",
    "EXTRAORDINARY",
  ],
};

const MAX_WRONG_GUESSES = 6;
const TIME_PER_LEVEL = 60; // 秒

export function WordPuzzleGame() {
  const [gameState, setGameState] = useState<GameState>({
    word: "",
    guessedLetters: [],
    wrongGuesses: 0,
    gameOver: false,
    isWon: false,
    score: 0,
    level: 1,
    timeLeft: TIME_PER_LEVEL,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [gameRecorder, setGameRecorder] = useState<{
    updateScore: (score: number) => void;
    endGame: (finalScore: number) => void;
    getCurrentScore: () => number;
    isActive: () => boolean;
  } | null>(null);

  // 选择随机单词
  const selectRandomWord = useCallback((level: number) => {
    const levelWords =
      WORDS_BY_LEVEL[level as keyof typeof WORDS_BY_LEVEL] || WORDS_BY_LEVEL[1];
    return levelWords[Math.floor(Math.random() * levelWords.length)];
  }, []);

  // 检查游戏状态
  const checkGameState = useCallback((state: GameState) => {
    const wordLetters = state.word.split("");
    const correctGuesses = wordLetters.filter((letter) =>
      state.guessedLetters.includes(letter)
    );

    const isWon = correctGuesses.length === wordLetters.length;
    const isLost =
      state.wrongGuesses >= MAX_WRONG_GUESSES || state.timeLeft <= 0;

    return { isWon, isLost };
  }, []);

  // 计时器
  useEffect(() => {
    if (!isPlaying || gameState.gameOver) return;

    const timer = setInterval(() => {
      setGameState((prev) => {
        const newTimeLeft = prev.timeLeft - 1;
        const { isWon, isLost } = checkGameState({
          ...prev,
          timeLeft: newTimeLeft,
        });

        if (isLost || newTimeLeft <= 0) {
          return {
            ...prev,
            timeLeft: 0,
            gameOver: true,
            isWon: false,
          };
        }

        return {
          ...prev,
          timeLeft: newTimeLeft,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, gameState.gameOver, checkGameState]);

  // 处理字母猜测
  const handleLetterGuess = useCallback(
    (letter: string) => {
      if (gameState.gameOver || gameState.guessedLetters.includes(letter))
        return;

      setGameState((prev) => {
        const newGuessedLetters = [...prev.guessedLetters, letter];
        const isCorrect = prev.word.includes(letter);
        const newWrongGuesses = isCorrect
          ? prev.wrongGuesses
          : prev.wrongGuesses + 1;

        const { isWon, isLost } = checkGameState({
          ...prev,
          guessedLetters: newGuessedLetters,
          wrongGuesses: newWrongGuesses,
        });

        let newScore = prev.score;
        if (isCorrect) {
          newScore += 10;
        }

        // 更新自动记录器
        if (gameRecorder && isCorrect) {
          gameRecorder.updateScore(newScore);
        }

        if (isWon) {
          newScore += 100;
          // 进入下一关
          const newLevel = prev.level + 1;
          const newWord = selectRandomWord(newLevel);
          return {
            ...prev,
            word: newWord,
            guessedLetters: [],
            wrongGuesses: 0,
            score: newScore,
            level: newLevel,
            timeLeft: TIME_PER_LEVEL,
          };
        }

        if (isLost) {
          return {
            ...prev,
            gameOver: true,
            isWon: false,
            guessedLetters: newGuessedLetters,
            wrongGuesses: newWrongGuesses,
          };
        }

        return {
          ...prev,
          guessedLetters: newGuessedLetters,
          wrongGuesses: newWrongGuesses,
          score: newScore,
        };
      });
    },
    [
      gameState.gameOver,
      gameState.guessedLetters,
      checkGameState,
      gameRecorder,
      selectRandomWord,
    ]
  );

  // 键盘输入
  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const letter = e.key.toUpperCase();
      if (letter.match(/[A-Z]/) && letter.length === 1) {
        handleLetterGuess(letter);
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [isPlaying, handleLetterGuess]);

  const startGame = () => {
    const word = selectRandomWord(1);
    setGameState({
      word,
      guessedLetters: [],
      wrongGuesses: 0,
      gameOver: false,
      isWon: false,
      score: 0,
      level: 1,
      timeLeft: TIME_PER_LEVEL,
    });
    setIsPlaying(true);

    const recorder = integrateGameWithAutoRecorder(
      "Word Puzzle Game",
      "word-puzzle-game"
    );
    setGameRecorder(recorder);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState({
      word: "",
      guessedLetters: [],
      wrongGuesses: 0,
      gameOver: false,
      isWon: false,
      score: 0,
      level: 1,
      timeLeft: TIME_PER_LEVEL,
    });
    if (gameRecorder) {
      gameRecorder.endGame(gameState.score);
    }
  };

  // 渲染单词显示
  const renderWord = () => {
    return gameState.word.split("").map((letter, index) => (
      <span
        key={index}
        className="inline-block w-8 h-8 mx-1 text-center text-xl font-bold text-white border-b-2 border-white"
      >
        {gameState.guessedLetters.includes(letter) ? letter : "_"}
      </span>
    ));
  };

  // 渲染字母按钮
  const renderLetterButtons = () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return alphabet.split("").map((letter) => (
      <Button
        key={letter}
        onClick={() => handleLetterGuess(letter)}
        disabled={
          gameState.guessedLetters.includes(letter) || gameState.gameOver
        }
        className={`w-8 h-8 p-0 text-sm ${
          gameState.guessedLetters.includes(letter)
            ? gameState.word.includes(letter)
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
            : "bg-blue-600 hover:bg-blue-500 text-white"
        }`}
      >
        {letter}
      </Button>
    ));
  };

  // 渲染绞刑架
  const renderHangman = () => {
    const parts = [
      gameState.wrongGuesses >= 1 && (
        <div
          key="head"
          className="absolute top-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full"
        />
      ),
      gameState.wrongGuesses >= 2 && (
        <div
          key="body"
          className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-white"
        />
      ),
      gameState.wrongGuesses >= 3 && (
        <div
          key="left-arm"
          className="absolute top-10 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white rotate-45 origin-left"
        />
      ),
      gameState.wrongGuesses >= 4 && (
        <div
          key="right-arm"
          className="absolute top-10 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white -rotate-45 origin-right"
        />
      ),
      gameState.wrongGuesses >= 5 && (
        <div
          key="left-leg"
          className="absolute top-16 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white rotate-45 origin-left"
        />
      ),
      gameState.wrongGuesses >= 6 && (
        <div
          key="right-leg"
          className="absolute top-16 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white -rotate-45 origin-right"
        />
      ),
    ];

    return (
      <div className="relative w-20 h-20 mx-auto mb-4">
        {/* 绞刑架结构 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-white" />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-white" />
        <div className="absolute top-0 right-0 w-1 h-4 bg-white" />
        {parts}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Card className="p-6 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">📝 Word Puzzle</h2>
          <p className="text-white/70">
            Guess the word by selecting letters. You have {MAX_WRONG_GUESSES}{" "}
            wrong guesses!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">Score: {gameState.score}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Level: {gameState.level}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">Time: {gameState.timeLeft}s</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              Wrong: {gameState.wrongGuesses}/{MAX_WRONG_GUESSES}
            </div>
          </div>
        </div>

        {/* 绞刑架 */}
        {renderHangman()}

        {/* 单词显示 */}
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-white mb-2">
            {renderWord()}
          </div>
        </div>

        {/* 字母按钮 */}
        <div className="grid grid-cols-6 md:grid-cols-9 gap-2 mb-6">
          {renderLetterButtons()}
        </div>

        {gameState.gameOver && (
          <div className="text-center mb-4">
            {gameState.isWon ? (
              <div>
                <p className="text-2xl font-bold text-green-400 mb-2">
                  🎉 Congratulations!
                </p>
                <p className="text-white/70">
                  You guessed the word: {gameState.word}
                </p>
                <p className="text-white/70">Score: {gameState.score}</p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-red-400 mb-2">
                  💀 Game Over!
                </p>
                <p className="text-white/70">The word was: {gameState.word}</p>
                <p className="text-white/70">Final Score: {gameState.score}</p>
              </div>
            )}
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
            <Button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reset
            </Button>
          )}
        </div>

        <div className="mt-4 text-center text-white/70 text-sm">
          <p>🎮 Click letters or type on keyboard to guess</p>
          <p>⏰ Each level has a time limit</p>
          <p>🏆 Higher levels have longer words</p>
          <p>💀 Too many wrong guesses = Game Over</p>
        </div>
      </Card>
    </div>
  );
}
