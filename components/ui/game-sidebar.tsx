"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GameSidebarProps {
  currentGame: string;
  onGameSelect: (game: string) => void;
}

const GAMES = [
  { id: "snake", name: "🐍 Snake", description: "Classic snake game" },
  { id: "tetris", name: "🧩 Tetris", description: "Block puzzle game" },
  { id: "pong", name: "🏓 Pong", description: "Ping pong game" },
  { id: "breakout", name: "💥 Breakout", description: "Brick breaker game" },
  {
    id: "minesweeper",
    name: "💣 Minesweeper",
    description: "Mine finding game",
  },
  { id: "memory", name: "🧠 Memory", description: "Card matching game" },
  { id: "2048", name: "🔢 2048", description: "Number puzzle game" },
  {
    id: "space-invaders",
    name: "🚀 Space Invaders",
    description: "Arcade shooter game",
  },
  { id: "chess", name: "♟️ Chess", description: "Classic chess game" },
  {
    id: "colorful-tetris",
    name: "🌈 Colorful Tetris",
    description: "Colorful block puzzle",
  },
  {
    id: "advanced-minesweeper",
    name: "💣 Advanced Minesweeper",
    description: "Enhanced mine game",
  },
  {
    id: "multiplayer-snake",
    name: "🐍🐍 Multiplayer Snake",
    description: "Two player snake",
  },
  {
    id: "tic-tac-toe",
    name: "⭕❌ Tic Tac Toe",
    description: "Classic tic tac toe",
  },
  { id: "puzzle", name: "🧩 Puzzle", description: "Number sliding puzzle" },
  {
    id: "space-shooter",
    name: "🚀 Space Shooter",
    description: "Space combat game",
  },
  { id: "racing", name: "🏎️ Racing", description: "Car racing game" },
  { id: "platformer", name: "🦘 Platformer", description: "Jump and run game" },
  {
    id: "word-puzzle",
    name: "📝 Word Puzzle",
    description: "Word guessing game",
  },
  { id: "card-game", name: "🃏 Card Game", description: "Classic card game" },
  {
    id: "dungeon-crawler",
    name: "🗡️ Dungeon Crawler",
    description: "Adventure game",
  },
  {
    id: "rhythm-game",
    name: "🎵 Rhythm Game",
    description: "Music rhythm game",
  },
  {
    id: "tower-defense",
    name: "🏰 Tower Defense",
    description: "Strategy defense game",
  },
  { id: "frogger", name: "🐸 Frogger", description: "Cross the road game" },
  { id: "asteroids", name: "🪨 Asteroids", description: "Space shooter game" },
  {
    id: "connect-four",
    name: "🔴🟡 Connect Four",
    description: "Four in a row game",
  },
  { id: "solitaire", name: "🃏 Solitaire", description: "Classic card game" },
  { id: "mahjong", name: "🀄 Mahjong", description: "Tile matching game" },
  {
    id: "bubble-shooter",
    name: "🫧 Bubble Shooter",
    description: "Bubble popping game",
  },
  {
    id: "match-three",
    name: "💎 Match Three",
    description: "Gem matching game",
  },
  {
    id: "roguelike",
    name: "🗡️ Roguelike",
    description: "Dungeon exploration game",
  },
  {
    id: "flappy-bird",
    name: "🐦 Flappy Bird",
    description: "Classic flappy bird game",
  },
  {
    id: "doodle-jump",
    name: "📱 Doodle Jump",
    description: "Jump between platforms",
  },
  {
    id: "color-switch",
    name: "🌈 Color Switch",
    description: "Match colors to pass",
  },
  {
    id: "crossy-road",
    name: "🦘 Crossy Road",
    description: "Cross the road game",
  },
  {
    id: "ball-game",
    name: "⚽ Ball Game",
    description: "Keep the ball bouncing",
  },
  {
    id: "slither",
    name: "🐍 Slither.io",
    description: "Eat and grow longer",
  },
];

export function GameSidebar({ currentGame, onGameSelect }: GameSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

  const handleLeaderboardClick = () => {
    // 检查是否已登录（这里简化处理，实际项目中应该检查真实的登录状态）
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (isLoggedIn) {
      // 如果已登录，跳转到排行榜页面
      router.push("/leaderboard");
    } else {
      // 如果未登录，跳转到登录页面
      router.push("/login");
    }
  };

  return (
    <Card
      className={`h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-white">🎮 Game Center</h2>
          )}
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            {isCollapsed ? "→" : "←"}
          </Button>
        </div>

        {/* Divider */}
        {!isCollapsed && (
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
        )}

        {/* Game List */}
        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {GAMES.map((game) => (
            <Button
              key={game.id}
              onClick={() => onGameSelect(game.id)}
              className={`w-full justify-start text-left h-auto p-3 transition-all duration-200 ${
                currentGame === game.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{game.name.split(" ")[0]}</span>
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium">{game.name}</div>
                    <div className="text-xs opacity-70">{game.description}</div>
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Stats */}
        {!isCollapsed && (
          <div className="mt-6 p-3 bg-white/10 rounded-lg flex-shrink-0">
            <h3 className="text-sm font-bold text-white mb-2">📊 Game Stats</h3>
            <div className="space-y-1 text-xs text-white/70">
              <div>Total Games: {GAMES.length}</div>
              <div>
                Current: {GAMES.find((g) => g.id === currentGame)?.name}
              </div>
              <div>Status: 🟢 Online</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="mt-4 space-y-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaderboardClick}
              className="w-full text-white border-white/30 hover:bg-white/10"
            >
              🏆 Leaderboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-white border-white/30 hover:bg-white/10"
            >
              ⚙️ Settings
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
