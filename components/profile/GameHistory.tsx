"use client";

import { useEffect, useState } from "react";
import { getUserGameScores, getUserTypingSessions } from "@/lib/supabase/sync";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface GameScore {
  id: string;
  game_name: string;
  score: number;
  created_at: string;
}

interface TypingSession {
  id: string;
  wpm: number;
  accuracy: number;
  duration_ms: number;
  started_at: string;
}

export function GameHistory() {
  const [activeTab, setActiveTab] = useState<"games" | "typing">("games");
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [typingSessions, setTypingSessions] = useState<TypingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [scores, sessions] = await Promise.all([
          getUserGameScores(undefined, 20),
          getUserTypingSessions(20),
        ]);
        setGameScores(scores as unknown as GameScore[]);
        setTypingSessions(sessions as unknown as TypingSession[]);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPpp", { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">历史记录</h2>
        <div className="flex bg-black/20 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("games")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "games"
                ? "bg-white/20 text-white shadow-sm"
                : "text-white/60 hover:text-white"
            }`}
          >
            游戏分数
          </button>
          <button
            onClick={() => setActiveTab("typing")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "typing"
                ? "bg-white/20 text-white shadow-sm"
                : "text-white/60 hover:text-white"
            }`}
          >
            打字练习
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {activeTab === "games" ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 text-white/60 font-medium">游戏</th>
                  <th className="pb-3 text-white/60 font-medium">分数</th>
                  <th className="pb-3 text-white/60 font-medium text-right">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {gameScores.length > 0 ? (
                  gameScores.map((score) => (
                    <tr key={score.id} className="group hover:bg-white/5 transition-colors">
                      <td className="py-3 text-white font-medium capitalize">
                        {score.game_name.replace(/-/g, " ")}
                      </td>
                      <td className="py-3 text-purple-300 font-bold">{score.score}</td>
                      <td className="py-3 text-white/50 text-sm text-right">
                        {formatDate(score.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-white/40">
                      暂无游戏记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 text-white/60 font-medium">WPM</th>
                  <th className="pb-3 text-white/60 font-medium">准确率</th>
                  <th className="pb-3 text-white/60 font-medium">时长</th>
                  <th className="pb-3 text-white/60 font-medium text-right">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {typingSessions.length > 0 ? (
                  typingSessions.map((session) => (
                    <tr key={session.id} className="group hover:bg-white/5 transition-colors">
                      <td className="py-3 text-green-300 font-bold">{session.wpm}</td>
                      <td className="py-3 text-blue-300">{session.accuracy}%</td>
                      <td className="py-3 text-white/70">{formatDuration(session.duration_ms)}</td>
                      <td className="py-3 text-white/50 text-sm text-right">
                        {formatDate(session.started_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-white/40">
                      暂无打字记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </Card>
  );
}
