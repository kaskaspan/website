"use client";

import { Trophy, Medal, Star, Zap, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "motion/react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (stats: { wpm: number; accuracy: number; gamesPlayed: number; highScore: number }) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_game",
    title: "初出茅庐",
    description: "完成你的第一场游戏",
    icon: <Star className="w-6 h-6 text-yellow-400" />,
    condition: (stats) => stats.gamesPlayed >= 1,
  },
  {
    id: "speed_demon",
    title: "速度恶魔",
    description: "达到 60 WPM",
    icon: <Zap className="w-6 h-6 text-blue-400" />,
    condition: (stats) => stats.wpm >= 60,
  },
  {
    id: "sharpshooter",
    title: "神射手",
    description: "达到 98% 准确率",
    icon: <Target className="w-6 h-6 text-red-400" />,
    condition: (stats) => stats.accuracy >= 98 && stats.gamesPlayed > 0,
  },
  {
    id: "pro_typer",
    title: "打字专家",
    description: "最高分超过 1000",
    icon: <Trophy className="w-6 h-6 text-purple-400" />,
    condition: (stats) => stats.highScore >= 1000,
  },
  {
    id: "veteran",
    title: "身经百战",
    description: "完成 10 场游戏",
    icon: <Medal className="w-6 h-6 text-orange-400" />,
    condition: (stats) => stats.gamesPlayed >= 10,
  },
];

interface AchievementsProps {
  wpm: number;
  accuracy: number;
  highScore: number;
  gamesPlayed?: number; // Optional for now, can be tracked later
}

export function Achievements({ wpm, accuracy, highScore, gamesPlayed = 0 }: AchievementsProps) {
  const stats = { wpm, accuracy, highScore, gamesPlayed };

  return (
    <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" />
        成就系统
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = achievement.condition(stats);
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                isUnlocked
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30"
                  : "bg-black/20 border-white/5 opacity-50 grayscale"
              }`}
            >
              <div className={`p-2 rounded-full ${isUnlocked ? "bg-white/10" : "bg-white/5"}`}>
                {achievement.icon}
              </div>
              <div>
                <h4 className={`font-semibold ${isUnlocked ? "text-white" : "text-white/60"}`}>
                  {achievement.title}
                </h4>
                <p className="text-xs text-white/50">{achievement.description}</p>
              </div>
              {isUnlocked && (
                <div className="ml-auto">
                  <span className="text-xs font-bold text-green-400 px-2 py-1 rounded bg-green-400/10">
                    已解锁
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
