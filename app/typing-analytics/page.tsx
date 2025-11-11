"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { TypingAnalyticsDashboard } from "@/components/analytics/TypingAnalyticsDashboard";

export default function TypingAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Typing Analytics</h1>
            <p className="text-sm text-white/60">
              查看本地保存的练习表现与课程进度。数据仅存储在当前设备。
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/20">
            <Link href="/typing-game">返回 Typing Game</Link>
          </Button>
        </div>

        <TypingAnalyticsDashboard />
      </div>
    </div>
  );
}

