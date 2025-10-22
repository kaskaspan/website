"use client";

import Link from "next/link";
import { SnakeGame } from "@/components/ui/snake-game";
import { GameSidebar } from "@/components/ui/game-sidebar";
import { useEffect, useState } from "react";

export default function GamePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentGame, setCurrentGame] = useState("snake");

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
    <div className="font-sans relative min-h-screen overflow-hidden">
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
          const left = (Math.sin(seed) * 0.5 + 0.5) * 100;
          const top = (Math.cos(seed) * 0.5 + 0.5) * 100;
          const animationDelay = (Math.sin(seed * 2) * 0.5 + 0.5) * 3;
          const animationDuration = 2 + (Math.cos(seed * 3) * 0.5 + 0.5) * 3;

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
        {/* Sidebar */}
        <div className="hidden lg:block">
          <GameSidebar
            currentGame={currentGame}
            onGameSelect={setCurrentGame}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 pb-20 gap-16 sm:p-20">
          <main className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                🎮 Game Zone
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-8" />
              <p className="text-white/70 text-lg">
                Welcome to the fun game section! Choose a game from the sidebar.
              </p>
            </div>

            {/* Game Content */}
            <div className="min-h-[600px]">
              {currentGame === "snake" && <SnakeGame />}
              {currentGame === "tetris" && (
                <div className="flex items-center justify-center h-96 bg-white/10 rounded-lg border border-white/20">
                  <div className="text-center text-white">
                    <h3 className="text-2xl font-bold mb-4">🧩 Tetris</h3>
                    <p className="text-white/70">Coming Soon!</p>
                  </div>
                </div>
              )}
              {currentGame === "pong" && (
                <div className="flex items-center justify-center h-96 bg-white/10 rounded-lg border border-white/20">
                  <div className="text-center text-white">
                    <h3 className="text-2xl font-bold mb-4">🏓 Pong</h3>
                    <p className="text-white/70">Coming Soon!</p>
                  </div>
                </div>
              )}
              {currentGame === "breakout" && (
                <div className="flex items-center justify-center h-96 bg-white/10 rounded-lg border border-white/20">
                  <div className="text-center text-white">
                    <h3 className="text-2xl font-bold mb-4">💥 Breakout</h3>
                    <p className="text-white/70">Coming Soon!</p>
                  </div>
                </div>
              )}
              {currentGame === "minesweeper" && (
                <div className="flex items-center justify-center h-96 bg-white/10 rounded-lg border border-white/20">
                  <div className="text-center text-white">
                    <h3 className="text-2xl font-bold mb-4">💣 Minesweeper</h3>
                    <p className="text-white/70">Coming Soon!</p>
                  </div>
                </div>
              )}
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
