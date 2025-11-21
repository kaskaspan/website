"use client";

import Link from "next/link";
import { TypingGame } from "@/components/ui/typing-game";
import { TypingGameSidebar } from "@/components/ui/typing-game-sidebar";
import { TypingGameRightSidebar } from "@/components/ui/typing-game-right-sidebar";
import { Achievements } from "@/components/game/Achievements";
import { TypingTips } from "@/components/game/TypingTips";
import { SpeedMode } from "@/components/game/SpeedMode";
import { AccuracyMode } from "@/components/game/AccuracyMode";
import { CodeMode } from "@/components/game/CodeMode";
import { QuoteMode } from "@/components/game/QuoteMode";
import { CustomMode } from "@/components/game/CustomMode";

// 打字模式列表
const TYPING_MODES = [
  { id: "classic", name: "📝 经典模式" },
  { id: "speed", name: "⚡ 速度挑战" },
  { id: "accuracy", name: "🎯 准确度训练" },
  { id: "code", name: "💻 代码练习" },
  { id: "quote", name: "💬 名言警句" },
  { id: "custom", name: "✏️ 自定义文本" },
];
import { useState, useEffect, useCallback } from "react";
import { SmoothCursor } from "@/registry/magicui/smooth-cursor";
import { TypingAnimation } from "@/registry/magicui/typing-animation";
import { Button } from "@/components/ui/button";
import { LogIn, UserRound, Menu, X } from "lucide-react";
import { VirtualKeyboardToggleButton, useVirtualKeyboard } from "@/components/ui/virtual-keyboard-toggle";
import { useAuth } from "@/components/auth/AuthProvider";

export default function TypingGamePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isGamePlaying, setIsGamePlaying] = useState(false);
  const [currentMode, setCurrentMode] = useState("classic");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isOpen: isKeyboardOpen } = useVirtualKeyboard();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [gameStats, setGameStats] = useState({
    wpm: 0,
    accuracy: 100,
    correctChars: 0,
    errorChars: 0,
    highScore: 0,
    durationMs: 0,
    stars: 0,
    isCompleted: false,
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition((prev) => {
      const next = { x: e.clientX, y: e.clientY };
      if (prev.x === next.x && prev.y === next.y) {
        return prev;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // 从 localStorage 加载最高分
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHighScore = localStorage.getItem("typingGameHighScore");
      if (savedHighScore) {
        setGameStats((prev) => ({
          ...prev,
          highScore: parseInt(savedHighScore, 10),
        }));
      }
    }
  }, []);

  const handleStatsUpdate = useCallback((stats: {
    wpm: number;
    accuracy: number;
    correctChars: number;
    errorChars: number;
    highScore?: number;
    durationMs: number;
    stars: number;
    isCompleted: boolean;
  }) => {
    setGameStats((prev) => {
      const newHighScore = stats.highScore ?? prev.highScore;
      const nextHighScore = Math.max(prev.highScore, newHighScore);

      if (
        prev.wpm === stats.wpm &&
        prev.accuracy === stats.accuracy &&
        prev.correctChars === stats.correctChars &&
        prev.errorChars === stats.errorChars &&
        prev.durationMs === stats.durationMs &&
        prev.stars === stats.stars &&
        prev.isCompleted === stats.isCompleted &&
        prev.highScore === nextHighScore
      ) {
        return prev;
      }

      if (nextHighScore > prev.highScore && typeof window !== "undefined") {
        localStorage.setItem("typingGameHighScore", nextHighScore.toString());
      }

      return {
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        correctChars: stats.correctChars,
        errorChars: stats.errorChars,
        highScore: nextHighScore,
        durationMs: stats.durationMs,
        stars: stats.stars,
        isCompleted: stats.isCompleted,
      };
    });
  }, []);

  return (
    <div className="font-sans relative min-h-screen w-full overflow-y-auto overflow-x-hidden" style={{ minHeight: '100dvh' }}>
      {/* Animated Background */}
      {/* Animated Background - Light Theme */}
      <div className="absolute inset-0 bg-gray-50">
        {/* Floating orbs - Subtle for light theme */}
        <div
          className="absolute w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"
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
          className="absolute w-80 h-80 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000"
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
        
        {/* Grid pattern - Darker for visibility on light bg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Floating particles - Darker for light theme */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => {
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
              className="absolute w-1 h-1 bg-blue-500/20 rounded-full animate-pulse"
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
      <div className="relative z-10 min-h-screen w-full flex">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block relative z-50">
          <TypingGameSidebar
            currentMode={currentMode}
            onModeSelect={setCurrentMode}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Left Sidebar */}
        <div
          className={`
            fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out lg:hidden
            ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="h-full bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">⌨️ 打字模式</h2>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="text-gray-500 hover:bg-gray-100 p-2 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <TypingGameSidebar
              currentMode={currentMode}
              onModeSelect={(mode) => {
                setCurrentMode(mode);
                setIsMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="flex-1 w-full p-4 sm:p-6 md:p-8 lg:p-12 gap-16"
          style={{
            paddingBottom: isKeyboardOpen ? 'calc(25vh + 2rem)' : '5rem',
            transition: 'padding-bottom 0.3s ease-out',
          }}
        >
          <main className="w-full">
            {/* Mobile Menu Button */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <VirtualKeyboardToggleButton />
            </div>
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Link
                    href="/"
                    className="rounded-full border border-gray-300 px-3 py-1 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition"
                  >
                    ⬅️ 返回首页
                  </Link>
                  <span className="hidden md:block text-gray-300">|</span>
                  <span className="hidden md:block">盲打教程 · 新手到高手路线</span>
                </div>

                <div className="flex items-center gap-3">
                  {!authLoading && (
                    <>
                      {isAuthenticated ? (
                        <Button
                          asChild
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                          <Link href="/profile" className="flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            <span className="hidden sm:inline">个人资料</span>
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                          <Link href="/login" className="flex items-center gap-2">
                            <LogIn className="h-4 w-4" />
                            <span className="hidden sm:inline">登录</span>
                          </Link>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

            <div className="text-center mb-6 sm:mb-8">
              <h1 className="mb-3 sm:mb-4">
                <TypingAnimation
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
                  hideCursorAfterFinish
                >
                  ⌨️ Typing Game
                </TypingAnimation>
              </h1>
              
              {/* Top Mode Icon - Clickable */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
                <button
                  onClick={() => {
                    // 滚动到打字游戏区域
                    setTimeout(() => {
                      const gameContainer = document.querySelector('[data-typing-game-container]');
                      if (gameContainer) {
                        gameContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 50);
                  }}
                  className="p-2.5 sm:p-3 bg-white hover:bg-gray-50 rounded-full border border-gray-200 hover:border-gray-300 transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-sm touch-manipulation"
                  title={`当前模式: ${TYPING_MODES.find((m) => m.id === currentMode)?.name || currentMode} - 点击跳转到游戏区域`}
                >
                  <span className="text-2xl sm:text-3xl block">
                    {TYPING_MODES.find((m) => m.id === currentMode)?.name.split(" ")[0] || "⌨️"}
                  </span>
                </button>
                <div className="flex items-center justify-center">
                  <VirtualKeyboardToggleButton />
                </div>
              </div>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-8" />
              <p className="text-gray-600 text-lg">
                Improve your typing speed and accuracy
              </p>
              <SmoothCursor enabled={!isGamePlaying} />
            </div>

            {/* Game Component */}
            <div className="w-full" data-typing-game-container>
              <div className="flex justify-end mb-4">
                <TypingTips />
              </div>
              {currentMode === "classic" && (
                <TypingGame
                  onPlayingChange={setIsGamePlaying}
                  onStatsUpdate={handleStatsUpdate}
                />
              )}
              {currentMode === "speed" && <SpeedMode />}
              {currentMode === "accuracy" && <AccuracyMode />}
              {currentMode === "code" && <CodeMode />}
              {currentMode === "quote" && <QuoteMode />}
              {currentMode === "custom" && <CustomMode />}
            </div>

            {/* Achievements Section */}
            <div className="mt-12">
              <Achievements 
                wpm={gameStats.wpm} 
                accuracy={gameStats.accuracy} 
                highScore={gameStats.highScore}
                gamesPlayed={gameStats.isCompleted ? 1 : 0} // Simple tracking for now
              />
            </div>

            {/* Back Button */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 px-8 py-3 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full border border-gray-300 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300">
                  ←
                </span>
                <span>Back to Home</span>
              </Link>
            </div>
          </main>
        </div>

        {/* Right Sidebar */}
        <div className="hidden xl:block relative z-50">
          <TypingGameRightSidebar
            wpm={gameStats.wpm}
            accuracy={gameStats.accuracy}
            correctChars={gameStats.correctChars}
            errorChars={gameStats.errorChars}
            highScore={gameStats.highScore}
            durationMs={gameStats.durationMs}
            stars={gameStats.stars}
            isCompleted={gameStats.isCompleted}
          />
        </div>
      </div>
    </div>
  );
}
