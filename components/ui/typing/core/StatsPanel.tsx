"use client";

export interface StatsPanelProps {
  wpm: number;
  accuracy: number;
  correct: number;
  mistakes: number;
  elapsedMs: number;
  stars?: number;
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function StatsPanel({
  wpm,
  accuracy,
  correct,
  mistakes,
  elapsedMs,
  stars = 0,
}: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-center md:grid-cols-3">
      <StatCard label="WPM" value={wpm} tone="text-emerald-300" />
      <StatCard label="准确率" value={`${accuracy}%`} tone="text-sky-300" />
      <StatCard label="正确" value={correct} tone="text-purple-300" />
      <StatCard label="错误" value={mistakes} tone="text-rose-300" />
      <StatCard label="用时" value={formatDuration(elapsedMs)} tone="text-teal-300" />
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-black/20 py-3">
        <div className="flex gap-1 text-lg">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={index < stars ? "text-yellow-300" : "text-white/20"}
            >
              ★
            </span>
          ))}
        </div>
        <span className="text-xs text-white/60">星级 {stars}/5</span>
      </div>
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
    <div className="rounded-xl border border-white/10 bg-black/20 py-3">
      <div className={`text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}

