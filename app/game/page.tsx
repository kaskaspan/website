"use client";

import Link from "next/link";
import { SnakeGame } from "@/components/ui/snake-game";
import { TetrisGame } from "@/components/ui/tetris-game";
import { PongGame } from "@/components/ui/pong-game";
import { BreakoutGame } from "@/components/ui/breakout-game";
import { MinesweeperGame } from "@/components/ui/minesweeper-game";
import { MemoryGame } from "@/components/ui/memory-game";
import { Game2048 } from "@/components/ui/2048-game";
import { SpaceInvadersGame } from "@/components/ui/space-invaders-game";
import { ChessGame } from "@/components/ui/chess-game";
import { ColorfulTetrisGame } from "@/components/ui/colorful-tetris-game";
import { AdvancedMinesweeperGame } from "@/components/ui/advanced-minesweeper-game";
import { MultiplayerSnakeGame } from "@/components/ui/multiplayer-snake-game";
import { TicTacToeGame } from "@/components/ui/tic-tac-toe-game";
import { PuzzleGame } from "@/components/ui/puzzle-game";
import { SpaceShooterGame } from "@/components/ui/space-shooter-game";
import { RacingGame } from "@/components/ui/racing-game";
import { PlatformerGame } from "@/components/ui/platformer-game";
import { WordPuzzleGame } from "@/components/ui/word-puzzle-game";
import { CardGame } from "@/components/ui/card-game";
import { DungeonCrawlerGame } from "@/components/ui/dungeon-crawler-game";
import { RhythmGame } from "@/components/ui/rhythm-game";
import { TowerDefenseGame } from "@/components/ui/tower-defense-game";
import { FroggerGame } from "@/components/ui/frogger-game";
import { AsteroidsGame } from "@/components/ui/asteroids-game";
import { ConnectFourGame } from "@/components/ui/connect-four-game";
import { SolitaireGame } from "@/components/ui/solitaire-game";
import { MahjongGame } from "@/components/ui/mahjong-game";
import { BubbleShooterGame } from "@/components/ui/bubble-shooter-game";
import { RoguelikeGame } from "@/components/ui/roguelike-game";
import { MatchThreeGame } from "@/components/ui/match-three-game";
import { FlappyBirdGame } from "@/components/ui/flappy-bird-game";
import { DoodleJumpGame } from "@/components/ui/doodle-jump-game";
import { ColorSwitchGame } from "@/components/ui/color-switch-game";
import { CrossyRoadGame } from "@/components/ui/crossy-road-game";
import { BallGame } from "@/components/ui/ball-game";
import { SlitherGame } from "@/components/ui/slither-game";
import { GameSidebar } from "@/components/ui/game-sidebar";

// 游戏列表（与 GameSidebar 中的保持一致）
const GAMES = [
  { id: "snake", name: "🐍 Snake" },
  { id: "tetris", name: "🧩 Tetris" },
  { id: "pong", name: "🏓 Pong" },
  { id: "breakout", name: "💥 Breakout" },
  { id: "minesweeper", name: "💣 Minesweeper" },
  { id: "memory", name: "🧠 Memory" },
  { id: "2048", name: "🔢 2048" },
  { id: "space-invaders", name: "🚀 Space Invaders" },
  { id: "chess", name: "♟️ Chess" },
  { id: "colorful-tetris", name: "🌈 Colorful Tetris" },
  { id: "advanced-minesweeper", name: "💣 Advanced Minesweeper" },
  { id: "multiplayer-snake", name: "🐍🐍 Multiplayer Snake" },
  { id: "tic-tac-toe", name: "⭕❌ Tic Tac Toe" },
  { id: "puzzle", name: "🧩 Puzzle" },
  { id: "space-shooter", name: "🚀 Space Shooter" },
  { id: "racing", name: "🏎️ Racing" },
  { id: "platformer", name: "🦘 Platformer" },
  { id: "word-puzzle", name: "📝 Word Puzzle" },
  { id: "card-game", name: "🃏 Card Game" },
  { id: "dungeon-crawler", name: "🗡️ Dungeon Crawler" },
  { id: "rhythm-game", name: "🎵 Rhythm Game" },
  { id: "tower-defense", name: "🏰 Tower Defense" },
  { id: "frogger", name: "🐸 Frogger" },
  { id: "asteroids", name: "🪨 Asteroids" },
  { id: "connect-four", name: "🔴🟡 Connect Four" },
  { id: "solitaire", name: "🃏 Solitaire" },
  { id: "mahjong", name: "🀄 Mahjong" },
  { id: "bubble-shooter", name: "🫧 Bubble Shooter" },
  { id: "roguelike", name: "⚔️ Roguelike" },
  { id: "match-three", name: "💎 Match Three" },
  { id: "flappy-bird", name: "🐦 Flappy Bird" },
  { id: "doodle-jump", name: "🦘 Doodle Jump" },
  { id: "color-switch", name: "🎨 Color Switch" },
  { id: "crossy-road", name: "🐔 Crossy Road" },
  { id: "ball-game", name: "⚽ Ball Game" },
  { id: "slither", name: "🐍 Slither" },
];
import { useEffect, useState } from "react";
import { IconCloud } from "@/components/ui/icon-cloud";
import { SmoothCursor } from "@/registry/magicui/smooth-cursor";
import { TypingAnimation } from "@/registry/magicui/typing-animation";
import {
  VirtualKeyboardToggleButton,
  useVirtualKeyboard,
} from "@/components/ui/virtual-keyboard-toggle";
import { Menu, X } from "lucide-react";

export default function GamePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentGame, setCurrentGame] = useState("snake");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isOpen: isKeyboardOpen } = useVirtualKeyboard();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <div
      className="font-sans relative min-h-screen overflow-y-auto overflow-x-hidden"
      style={{ minHeight: "100dvh" }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Floating orbs */}
        <div
          className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            left:
              typeof window !== "undefined"
                ? `${20 + (mousePosition.x / window.innerWidth) * 10}%`
                : "20%",
            top:
              typeof window !== "undefined"
                ? `${10 + (mousePosition.y / window.innerHeight) * 10}%`
                : "10%",
          }}
        />
        <div
          className="absolute w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"
          style={{
            right:
              typeof window !== "undefined"
                ? `${20 + (mousePosition.x / window.innerWidth) * -10}%`
                : "20%",
            bottom:
              typeof window !== "undefined"
                ? `${20 + (mousePosition.y / window.innerHeight) * -10}%`
                : "20%",
          }}
        />
        <div
          className="absolute w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"
          style={{
            left:
              typeof window !== "undefined"
                ? `${50 + (mousePosition.x / window.innerWidth) * 5}%`
                : "50%",
            top:
              typeof window !== "undefined"
                ? `${60 + (mousePosition.y / window.innerHeight) * 5}%`
                : "60%",
          }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => {
          // Use a deterministic seed based on index to avoid hydration mismatch
          const seed = i * 0.1;
          const left =
            Math.round((Math.sin(seed) * 0.5 + 0.5) * 100 * 100) / 100;
          const top =
            Math.round((Math.cos(seed) * 0.5 + 0.5) * 100 * 100) / 100;
          const animationDelay =
            Math.round((Math.sin(seed * 2) * 0.5 + 0.5) * 3 * 100) / 100;
          const animationDuration =
            Math.round((2 + (Math.cos(seed * 3) * 0.5 + 0.5) * 3) * 100) / 100;

          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDelay: `${animationDelay}s`,
                animationDuration: `${animationDuration}s`,
              }}
            />
          );
        })}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block relative z-50">
          <GameSidebar
            currentGame={currentGame}
            onGameSelect={setCurrentGame}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out lg:hidden
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-r border-white/20 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">🎮 Game Center</h2>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="text-white hover:bg-white/10 p-2 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <GameSidebar
              currentGame={currentGame}
              onGameSelect={(game) => {
                setCurrentGame(game);
                setIsMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div
          className="flex-1 p-8 gap-16 sm:p-20"
          style={{
            paddingBottom: isKeyboardOpen ? "calc(25vh + 2rem)" : "5rem",
            transition: "padding-bottom 0.3s ease-out",
          }}
        >
          <main className="max-w-4xl mx-auto">
            {/* Mobile Menu Button */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <VirtualKeyboardToggleButton />
            </div>
            {/* Game Emoji Cloud */}
            <div className="mb-8 h-32 w-full">
              <IconCloud
                emojis={[
                  "🎮",
                  "🎯",
                  "🎲",
                  "🎰",
                  "🃏",
                  "🎴",
                  "🧩",
                  "🕹️",
                  "🎪",
                  "🎨",
                  "🎭",
                  "🎬",
                ]}
              />
            </div>

            <div className="text-center mb-8">
              <h1 className="mb-4">
                <TypingAnimation
                  className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                  speed={50}
                  hideCursorAfterFinish
                >
                  🎮 Game Zone
                </TypingAnimation>
              </h1>

              {/* Top Game Icon - Clickable */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => {
                    // 滚动到游戏区域
                    setTimeout(() => {
                      const gameContainer = document.querySelector(
                        "[data-game-container]"
                      );
                      if (gameContainer) {
                        gameContainer.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }, 50);
                  }}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 hover:border-white/40 transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
                  title={`当前游戏: ${
                    GAMES.find((g) => g.id === currentGame)?.name || currentGame
                  } - 点击跳转到游戏区域`}
                >
                  <span className="text-3xl">
                    {GAMES.find((g) => g.id === currentGame)?.name.split(
                      " "
                    )[0] || "🎮"}
                  </span>
                </button>
                <div className="hidden lg:flex">
                  <VirtualKeyboardToggleButton />
                </div>
              </div>

              <div className="lg:hidden flex justify-center mb-4">
                <VirtualKeyboardToggleButton />
              </div>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-8" />
              <TypingAnimation
                className="block text-white/70 text-lg"
                speed={45}
                hideCursorAfterFinish
              >
                Welcome to the fun game section! Choose a game from the sidebar.
              </TypingAnimation>
              <div className="mt-4 text-white/50 text-sm">
                <span className="hidden md:block">Move your mouse around</span>
                <span className="block md:hidden">
                  Tap anywhere to see the cursor
                </span>
              </div>
              <SmoothCursor />
            </div>

            {/* Game Content */}
            <div className="min-h-[600px]" data-game-container>
              {currentGame === "snake" && <SnakeGame />}
              {currentGame === "tetris" && <TetrisGame />}
              {currentGame === "pong" && <PongGame />}
              {currentGame === "breakout" && <BreakoutGame />}
              {currentGame === "minesweeper" && <MinesweeperGame />}
              {currentGame === "memory" && <MemoryGame />}
              {currentGame === "2048" && <Game2048 />}
              {currentGame === "space-invaders" && <SpaceInvadersGame />}
              {currentGame === "chess" && <ChessGame />}
              {currentGame === "colorful-tetris" && <ColorfulTetrisGame />}
              {currentGame === "advanced-minesweeper" && (
                <AdvancedMinesweeperGame />
              )}
              {currentGame === "multiplayer-snake" && <MultiplayerSnakeGame />}
              {currentGame === "tic-tac-toe" && <TicTacToeGame />}
              {currentGame === "puzzle" && <PuzzleGame />}
              {currentGame === "space-shooter" && <SpaceShooterGame />}
              {currentGame === "racing" && <RacingGame />}
              {currentGame === "platformer" && <PlatformerGame />}
              {currentGame === "word-puzzle" && <WordPuzzleGame />}
              {currentGame === "card-game" && <CardGame />}
              {currentGame === "dungeon-crawler" && <DungeonCrawlerGame />}
              {currentGame === "rhythm-game" && <RhythmGame />}
              {currentGame === "tower-defense" && <TowerDefenseGame />}
              {currentGame === "frogger" && <FroggerGame />}
              {currentGame === "asteroids" && <AsteroidsGame />}
              {currentGame === "connect-four" && <ConnectFourGame />}
              {currentGame === "solitaire" && <SolitaireGame />}
              {currentGame === "mahjong" && <MahjongGame />}
              {currentGame === "bubble-shooter" && <BubbleShooterGame />}
              {currentGame === "roguelike" && <RoguelikeGame />}
              {currentGame === "match-three" && <MatchThreeGame />}
              {currentGame === "flappy-bird" && <FlappyBirdGame />}
              {currentGame === "doodle-jump" && <DoodleJumpGame />}
              {currentGame === "color-switch" && <ColorSwitchGame />}
              {currentGame === "crossy-road" && <CrossyRoadGame />}
              {currentGame === "ball-game" && <BallGame />}
              {currentGame === "slither" && <SlitherGame />}
            </div>

            <div className="mt-12 pt-8 border-t border-white/20 text-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-blue-400 hover:text-white hover:from-purple-600/40 hover:to-blue-600/40 rounded-full border border-blue-400/30 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">
                  ←
                </span>
                <span>Back to Home</span>
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
