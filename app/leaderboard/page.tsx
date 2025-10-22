"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LeaderboardEntry {
  rank: number;
  player: string;
  score: number;
  game: string;
  date: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 模拟实时更新排行榜
  const updateLeaderboard = () => {
    const getLeaderboardData = (): LeaderboardEntry[] => {
      const rawData = [
        {
          player: "GameMaster",
          score: 15420,
          game: "Snake",
          date: "2024-01-15",
        },
        {
          player: "SnakeKing",
          score: 12850,
          game: "Snake",
          date: "2024-01-14",
        },
        {
          player: "BlockBuster",
          score: 11200,
          game: "Tetris",
          date: "2024-01-13",
        },
        { player: "PongMaster", score: 9800, game: "Pong", date: "2024-01-12" },
        {
          player: "BreakoutPro",
          score: 8750,
          game: "Breakout",
          date: "2024-01-11",
        },
        {
          player: "MineHunter",
          score: 7200,
          game: "Minesweeper",
          date: "2024-01-10",
        },
        { player: "GameLover", score: 6800, game: "Snake", date: "2024-01-09" },
        {
          player: "ScoreChaser",
          score: 6200,
          game: "Tetris",
          date: "2024-01-08",
        },
        { player: "ArcadeFan", score: 5800, game: "Pong", date: "2024-01-07" },
        {
          player: "RetroGamer",
          score: 5400,
          game: "Breakout",
          date: "2024-01-06",
        },
        // 动态添加新玩家高分（模拟实时更新）
        {
          player: "NewChampion",
          score: 18500 + Math.floor(Math.random() * 1000),
          game: "Snake",
          date: "2024-01-16",
        },
        {
          player: "RisingStar",
          score: 14200 + Math.floor(Math.random() * 500),
          game: "Tetris",
          date: "2024-01-16",
        },
        {
          player: "ProGamer",
          score: 13500 + Math.floor(Math.random() * 300),
          game: "Snake",
          date: "2024-01-16",
        },
        {
          player: "SpeedRunner",
          score: 16800 + Math.floor(Math.random() * 200),
          game: "Snake",
          date: "2024-01-16",
        },
        {
          player: "MasterPlayer",
          score: 15200 + Math.floor(Math.random() * 400),
          game: "Tetris",
          date: "2024-01-16",
        },
      ];

      // 按分数降序排序
      const sortedData = rawData.sort((a, b) => b.score - a.score);

      // 分配排名
      return sortedData.map((entry, index) => ({
        rank: index + 1,
        player: entry.player,
        score: entry.score,
        game: entry.game,
        date: entry.date,
      }));
    };

    return getLeaderboardData();
  };

  useEffect(() => {
    // 检查登录状态
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    const mockLeaderboard = updateLeaderboard();

    // 模拟API调用延迟
    setTimeout(() => {
      setLeaderboard(mockLeaderboard);
      setIsLoading(false);
    }, 1000);

    // 设置自动刷新排行榜（极快更新）
    const refreshInterval = setInterval(() => {
      const updatedLeaderboard = updateLeaderboard();
      setLeaderboard(updatedLeaderboard);
    }, 0.0000000001); // 极快刷新

    return () => clearInterval(refreshInterval);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative z-10 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              🏆 Leaderboard
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-8" />
            <p className="text-white/70 text-lg">
              Top players across all games
            </p>
          </div>

          {/* Leaderboard */}
          <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 font-bold">Rank</th>
                      <th className="text-left py-3 px-4 font-bold">Player</th>
                      <th className="text-left py-3 px-4 font-bold">Game</th>
                      <th className="text-left py-3 px-4 font-bold">Score</th>
                      <th className="text-left py-3 px-4 font-bold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.rank}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {entry.rank <= 3 && (
                              <span className="text-2xl mr-2">
                                {entry.rank === 1 && "🥇"}
                                {entry.rank === 2 && "🥈"}
                                {entry.rank === 3 && "🥉"}
                              </span>
                            )}
                            <span className="font-bold text-lg">
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium">
                          {entry.player}
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-white/20 px-2 py-1 rounded text-sm">
                            {entry.game}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-yellow-400">
                          {entry.score.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-white/70">
                          {entry.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link href="/game">
              <Button className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-blue-400 hover:text-white hover:from-purple-600/40 hover:to-blue-600/40 rounded-full border border-blue-400/30 hover:border-purple-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
                <span className="group-hover:-translate-x-1 transition-transform duration-300">
                  ←
                </span>
                <span>Back to Games</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
