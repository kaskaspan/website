"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TypingGameRightSidebarProps {
  wpm?: number;
  accuracy?: number;
  correctChars?: number;
  errorChars?: number;
  highScore?: number;
  durationMs?: number;
  stars?: number;
  isCompleted?: boolean;
}

export function TypingGameRightSidebar({
  wpm = 0,
  accuracy = 100,
  correctChars = 0,
  errorChars = 0,
  highScore = 0,
  durationMs = 0,
  stars = 0,
  isCompleted = false,
}: TypingGameRightSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalGames: 0,
    averageWPM: 0,
    bestWPM: 0,
    totalWords: 0,
  });

  const finalScore = useMemo(() => Math.max(0, wpm * 10 + accuracy), [wpm, accuracy]);

  const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // 从 localStorage 加载统计数据
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedStats = localStorage.getItem("typingGameStats");
      if (savedStats) {
        try {
          setStats(JSON.parse(savedStats));
        } catch (e) {
          console.error("Failed to parse stats", e);
        }
      }
    }
  }, []);

  // 保存统计数据（只在游戏完成时更新）
  useEffect(() => {
    if (!isCompleted || wpm <= 0) return;

    setStats((prev) => {
      const updated = {
        totalGames: prev.totalGames + 1,
        averageWPM: Math.round(
          (prev.averageWPM * prev.totalGames + wpm) /
            (prev.totalGames + 1)
        ),
        bestWPM: Math.max(prev.bestWPM, wpm),
        totalWords: prev.totalWords + Math.max(0, Math.round(correctChars / 5)),
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("typingGameStats", JSON.stringify(updated));
      }

      return updated;
    });
  }, [isCompleted, wpm, correctChars]);

  return (
    <Card
      className={`h-full bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 border-white/20 transition-all duration-300 relative z-50 ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-white">📊 实时统计</h2>
          )}
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            {isCollapsed ? "←" : "→"}
          </Button>
        </div>

        {/* Divider */}
        {!isCollapsed && (
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
        )}

        {!isCollapsed && (
          <>
            {/* Current Session Stats */}
            <div className="mb-6 space-y-3">
              <h3 className="text-sm font-bold text-white mb-3">
                🎮 当前游戏
              </h3>
              <div className="rounded-xl border border-white/10 bg-white/10 p-4">
                <div className="mb-3 flex justify-between text-xs uppercase text-white/50">
                  <span>实时表现</span>
                  <span>Score {finalScore}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-black/30 p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{wpm}</div>
                    <div className="text-xs text-white/70">WPM</div>
                  </div>
                  <div className="rounded-lg bg-black/30 p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{accuracy}%</div>
                    <div className="text-xs text-white/70">准确率</div>
                  </div>
                  <div className="rounded-lg bg-black/30 p-3 text-center">
                    <div className="text-xl font-semibold text-purple-300">
                      {correctChars}
                    </div>
                    <div className="text-xs text-white/70">正确</div>
                  </div>
                  <div className="rounded-lg bg-black/30 p-3 text-center">
                    <div className="text-xl font-semibold text-rose-300">
                      {errorChars}
                    </div>
                    <div className="text-xs text-white/70">错误</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="text-xs uppercase tracking-wide text-white/40">
                      用时
                    </span>
                    <span className="font-medium text-white">
                      {formatDuration(durationMs)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-lg">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={index}
                        className={
                          index < stars
                            ? "text-yellow-300 drop-shadow"
                            : "text-white/15"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {isCompleted && (
                  <p className="mt-2 rounded-lg bg-green-500/15 px-3 py-2 text-xs text-green-200">
                    本轮已完成，别忘了记录你的成绩！
                  </p>
                )}
              </div>
            </div>

            {/* Overall Stats */}
            <div className="mb-6 flex-1">
              <h3 className="text-sm font-bold text-white mb-3">
                📈 总体统计
              </h3>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-lg font-bold text-yellow-400">
                    {stats.totalGames}
                  </div>
                  <div className="text-xs text-white/70">总游戏次数</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-lg font-bold text-orange-400">
                    {stats.averageWPM}
                  </div>
                  <div className="text-xs text-white/70">平均 WPM</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-lg font-bold text-pink-400">
                    {stats.bestWPM}
                  </div>
                  <div className="text-xs text-white/70">最佳 WPM</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-lg font-bold text-cyan-400">
                    {stats.totalWords}
                  </div>
                  <div className="text-xs text-white/70">总字数</div>
                </div>
              </div>
            </div>

            {/* High Score */}
            {highScore > 0 && (
              <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-400/30">
                <div className="text-center">
                  <div className="text-xs text-white/70 mb-1">最高分</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {highScore}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-white border-white/30 hover:bg-white/10"
              >
                🏆 排行榜
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-white border-white/30 hover:bg-white/10"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    confirm("确定要清除所有统计数据吗？")
                  ) {
                    localStorage.removeItem("typingGameStats");
                    setStats({
                      totalGames: 0,
                      averageWPM: 0,
                      bestWPM: 0,
                      totalWords: 0,
                    });
                  }
                }}
              >
                🗑️ 清除统计
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

