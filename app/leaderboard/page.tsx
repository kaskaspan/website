"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getUserScores,
  getLeaderboardData,
  getUserStats,
  saveUserScore,
  type UserScore,
} from "@/lib/user-storage";

interface LeaderboardEntry {
  rank: number;
  player: string;
  score: number;
  game: string;
  date: string;
  timestamp?: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showAddScore, setShowAddScore] = useState(false);
  const [newScore, setNewScore] = useState({
    username: "",
    score: 0,
    game: "Snake",
  });
  const router = useRouter();

  // 初始化示例数据（如果没有任何数据）
  const initializeSampleData = () => {
    const existingScores = getUserScores();
    if (existingScores.length === 0) {
      const sampleScores = [
        {
          username: "GameMaster",
          score: 15420,
          game: "Snake",
          date: "2024-01-15",
        },
        {
          username: "SnakeKing",
          score: 12850,
          game: "Snake",
          date: "2024-01-14",
        },
        {
          username: "BlockBuster",
          score: 11200,
          game: "Tetris",
          date: "2024-01-13",
        },
        {
          username: "PongMaster",
          score: 9800,
          game: "Pong",
          date: "2024-01-12",
        },
        {
          username: "BreakoutPro",
          score: 8750,
          game: "Breakout",
          date: "2024-01-11",
        },
        {
          username: "MineHunter",
          score: 7200,
          game: "Minesweeper",
          date: "2024-01-10",
        },
        {
          username: "GameLover",
          score: 6800,
          game: "Snake",
          date: "2024-01-09",
        },
        {
          username: "ScoreChaser",
          score: 6200,
          game: "Tetris",
          date: "2024-01-08",
        },
        {
          username: "ArcadeFan",
          score: 5800,
          game: "Pong",
          date: "2024-01-07",
        },
        {
          username: "RetroGamer",
          score: 5400,
          game: "Breakout",
          date: "2024-01-06",
        },
      ];

      sampleScores.forEach((score) => {
        saveUserScore(score);
      });
    }
  };

  // 获取真实用户排行榜数据
  const updateLeaderboard = () => {
    const userScores = getLeaderboardData();

    // 转换为排行榜格式并分配排名
    const leaderboardData: LeaderboardEntry[] = userScores.map(
      (score, index) => ({
        rank: index + 1,
        player: score.username,
        score: score.score,
        game: score.game,
        date: score.date,
        timestamp: score.timestamp,
      })
    );

    return leaderboardData;
  };

  useEffect(() => {
    // 检查登录状态
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // 初始化示例数据（如果需要）
    initializeSampleData();

    const realLeaderboard = updateLeaderboard();

    // 加载真实数据
    setTimeout(() => {
      setLeaderboard(realLeaderboard);
      setIsLoading(false);
    }, 500);

    // 设置定期刷新（每30秒检查一次新数据）
    const refreshInterval = setInterval(() => {
      const updatedLeaderboard = updateLeaderboard();
      setLeaderboard(updatedLeaderboard);
    }, 30000); // 30秒刷新一次

    // 监听自动记录事件
    const handleLeaderboardUpdate = () => {
      const updatedLeaderboard = updateLeaderboard();
      setLeaderboard(updatedLeaderboard);
    };

    window.addEventListener("leaderboardUpdate", handleLeaderboardUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("leaderboardUpdate", handleLeaderboardUpdate);
    };
  }, [router]);

  // 处理日期选择
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  // 处理排序切换
  const handleSortToggle = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  // 获取过滤和排序后的数据
  const getFilteredAndSortedData = () => {
    let filteredData = leaderboard;

    // 按日期过滤
    if (selectedDate) {
      filteredData = leaderboard.filter((entry) => entry.date === selectedDate);
    }

    // 按分数排序
    const sortedData = filteredData.sort((a, b) => {
      return sortOrder === "desc" ? b.score - a.score : a.score - b.score;
    });

    // 重新分配排名
    return sortedData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  };

  // 获取所有可用日期
  const getAvailableDates = () => {
    const dates = [...new Set(leaderboard.map((entry) => entry.date))];
    return dates.sort();
  };

  // 处理添加新分数
  const handleAddScore = () => {
    if (newScore.username && newScore.score > 0) {
      const today = new Date().toISOString().split("T")[0];
      saveUserScore({
        username: newScore.username,
        score: newScore.score,
        game: newScore.game,
        date: today,
      });

      // 刷新排行榜
      const updatedLeaderboard = updateLeaderboard();
      setLeaderboard(updatedLeaderboard);

      // 重置表单
      setNewScore({ username: "", score: 0, game: "Snake" });
      setShowAddScore(false);
    }
  };

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

          {/* 控制面板 */}
          <Card className="bg-gradient-to-br from-purple-900/50 via-blue-900/50 to-indigo-900/50 border-white/20 backdrop-blur-sm mb-6">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                {/* 日期选择器 */}
                <div className="flex items-center gap-4">
                  <label className="text-white font-medium">选择日期:</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">所有日期</option>
                    {getAvailableDates().map((date) => (
                      <option key={date} value={date} className="bg-gray-800">
                        {date}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 排序控制 */}
                <div className="flex items-center gap-4">
                  <span className="text-white font-medium">排序:</span>
                  <Button
                    onClick={handleSortToggle}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
                  >
                    {sortOrder === "desc" ? "🔽 从大到小" : "🔼 从小到大"}
                  </Button>
                </div>

                {/* 添加分数按钮 */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setShowAddScore(!showAddScore)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                  >
                    {showAddScore ? "❌ 取消" : "➕ 添加分数"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* 添加分数表单 */}
          {showAddScore && (
            <Card className="bg-gradient-to-br from-green-900/50 via-emerald-900/50 to-teal-900/50 border-white/20 backdrop-blur-sm mb-6">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  ➕ 添加新分数
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      用户名
                    </label>
                    <input
                      type="text"
                      value={newScore.username}
                      onChange={(e) =>
                        setNewScore({ ...newScore, username: e.target.value })
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="输入用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      分数
                    </label>
                    <input
                      type="number"
                      value={newScore.score}
                      onChange={(e) =>
                        setNewScore({
                          ...newScore,
                          score: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="输入分数"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      游戏
                    </label>
                    <select
                      value={newScore.game}
                      onChange={(e) =>
                        setNewScore({ ...newScore, game: e.target.value })
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Snake">Snake</option>
                      <option value="Tetris">Tetris</option>
                      <option value="Pong">Pong</option>
                      <option value="Breakout">Breakout</option>
                      <option value="Minesweeper">Minesweeper</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddScore}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                    >
                      添加分数
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 显示当前过滤状态 */}
          {selectedDate && (
            <div className="mb-4 text-center">
              <p className="text-white/70">
                显示日期:{" "}
                <span className="text-purple-400 font-bold">
                  {selectedDate}
                </span>{" "}
                的排行榜
                <span className="ml-2">
                  ({getFilteredAndSortedData().length} 条记录)
                </span>
              </p>
            </div>
          )}

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
                    {getFilteredAndSortedData().map((entry) => (
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
