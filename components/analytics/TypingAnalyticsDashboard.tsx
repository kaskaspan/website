"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  clearTypingAnalytics,
  getTypingAnalytics,
  getTypingRecords,
  type TypingAnalyticsData,
  type TypingSessionRecord,
} from "@/lib/typing-analytics";

export function TypingAnalyticsDashboard() {
  const [data, setData] = useState<TypingAnalyticsData | null>(null);
  const [records, setRecords] = useState<TypingSessionRecord[]>([]);

  useEffect(() => {
    reload();
  }, []);

  const reload = () => {
    setData(getTypingAnalytics());
    setRecords(getTypingRecords());
  };

  const handleClear = () => {
    if (confirm("确定清空所有练习统计数据？")) {
      clearTypingAnalytics();
      reload();
    }
  };

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Card className="border-white/10 bg-white/5 p-6 text-white text-center">
          <p>暂无打字练习数据。完成一次课程后再来看看吧。</p>
        </Card>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes} 分 ${seconds} 秒`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Typing 练习统计</h1>
          <p className="text-sm text-white/60">展示本地保存的练习记录与趋势</p>
        </div>
        <Button variant="outline" className="border-white/20" onClick={handleClear}>
          清空数据
        </Button>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="完成次数" value={data.totalSessions} tone="text-purple-200" />
        <StatCard label="平均 WPM" value={data.averageWpm} tone="text-emerald-200" />
        <StatCard label="平均准确率" value={`${data.averageAccuracy}%`} tone="text-sky-200" />
        <StatCard label="累计时长" value={formatDuration(data.totalDurationMs)} tone="text-pink-200" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">星级分布</h2>
          <div className="space-y-2 text-sm">
            {Object.entries(data.starCounts)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([stars, count]) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-20">{stars} ★</span>
                  <div className="h-2 flex-1 rounded bg-white/10">
                    <div
                      className="h-2 rounded bg-purple-400"
                      style={{ width: `${(100 * count) / data.totalSessions}%` }}
                    ></div>
                  </div>
                  <span className="w-10 text-right">{count}</span>
                </div>
              ))}
          </div>
        </Card>

        <Card className="border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-4">近期表现</h2>
          <div className="space-y-2 text-sm">
            {data.recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col rounded border border白色/10 bg-black/20 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold text-white">
                    {session.lessonTitle}
                  </div>
                  <div className="text-xs text-white/60">
                    {new Date(session.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-white/60">
                  <span>WPM {session.summary.wpm}</span>
                  <span>准确率 {session.summary.accuracy}%</span>
                  <span>⭐ {session.summary.starRating ?? 0}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">课程表现</h2>
        <div className="overflow-x-auto text-sm">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase text-white/50">
                <th className="py-2">课程</th>
                <th className="py-2">练习次数</th>
                <th className="py-2">平均 WPM</th>
                <th className="py-2">平均准确率</th>
                <th className="py-2">最佳星级</th>
              </tr>
            </thead>
            <tbody>
              {data.lessonSummary.map((lesson) => (
                <tr key={lesson.lessonId} className="border-t border-white/10">
                  <td className="py-2 text-white/90">{lesson.lessonTitle}</td>
                  <td className="py-2">{lesson.attempts}</td>
                  <td className="py-2">{lesson.averageWpm}</td>
                  <td className="py-2">{lesson.averageAccuracy}%</td>
                  <td className="py-2">{lesson.bestStars}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold mb-4">全部记录</h2>
        <div className="space-y-2 text-xs text-white/60 max-h-80 overflow-y-auto">
          {records.map((record) => (
            <div key={record.id} className="grid grid-cols-4 gap-2 border border-white/10 rounded p-3">
              <span className="font-medium text-white">
                {new Date(record.timestamp).toLocaleString()}
              </span>
              <span>{record.lessonTitle}</span>
              <span>
                WPM {record.summary.wpm} / 准确率 {record.summary.accuracy}%
              </span>
              <span>⭐ {record.summary.starRating ?? 0}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  tone: string;
}

function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <Card className="border-white/10 bg-white/5 p-6">
      <div className="text-center">
        <div className={`text-3xl font-semibold ${tone}`}>{value}</div>
        <div className="text-xs text-white/60">{label}</div>
      </div>
    </Card>
  );
}

