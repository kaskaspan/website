"use client";

import { memo, useMemo } from "react";

type Finger = "thumb" | "index" | "middle" | "ring" | "pinky";
type Hand = "left" | "right";

interface VirtualHandsProps {
  currentChar?: string;
  visible: boolean;
  transparency: number; // 0-100
  theme?: "default" | "outline";
}

const fingerLabels: Record<Hand, Finger[]> = {
  left: ["pinky", "ring", "middle", "index", "thumb"],
  right: ["thumb", "index", "middle", "ring", "pinky"],
};

const displayNames: Record<Finger, string> = {
  thumb: "拇指",
  index: "食指",
  middle: "中指",
  ring: "无名指",
  pinky: "小指",
};

const fingerMap: Record<string, { hand: Hand; finger: Finger }> = {
  q: { hand: "left", finger: "pinky" },
  a: { hand: "left", finger: "pinky" },
  z: { hand: "left", finger: "pinky" },
  w: { hand: "left", finger: "ring" },
  s: { hand: "left", finger: "ring" },
  x: { hand: "left", finger: "ring" },
  e: { hand: "left", finger: "middle" },
  d: { hand: "left", finger: "middle" },
  c: { hand: "left", finger: "middle" },
  r: { hand: "left", finger: "index" },
  f: { hand: "left", finger: "index" },
  v: { hand: "left", finger: "index" },
  t: { hand: "left", finger: "index" },
  g: { hand: "left", finger: "index" },
  b: { hand: "left", finger: "index" },
  " ": { hand: "left", finger: "thumb" },
  y: { hand: "right", finger: "index" },
  h: { hand: "right", finger: "index" },
  n: { hand: "right", finger: "index" },
  u: { hand: "right", finger: "index" },
  j: { hand: "right", finger: "index" },
  m: { hand: "right", finger: "index" },
  i: { hand: "right", finger: "middle" },
  k: { hand: "right", finger: "middle" },
  ",": { hand: "right", finger: "middle" },
  o: { hand: "right", finger: "ring" },
  l: { hand: "right", finger: "ring" },
  ".": { hand: "right", finger: "ring" },
  p: { hand: "right", finger: "pinky" },
  ";": { hand: "right", finger: "pinky" },
  "/": { hand: "right", finger: "pinky" },
  "[": { hand: "right", finger: "pinky" },
  "]": { hand: "right", finger: "pinky" },
  "'": { hand: "right", finger: "pinky" },
  "-": { hand: "right", finger: "pinky" },
  "=": { hand: "right", finger: "pinky" },
};

export const VirtualHands = memo(function VirtualHands({
  currentChar,
  visible,
  transparency,
  theme = "default",
}: VirtualHandsProps) {
  const normalizedOpacity = Math.max(0, Math.min(1, 1 - transparency / 100));

  const active = useMemo(() => {
    if (!currentChar) return null;
    return fingerMap[currentChar.toLowerCase()] ?? null;
  }, [currentChar]);

  if (!visible) return null;

  return (
    <div
      className="mx-auto flex max-w-3xl justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70 backdrop-blur"
      style={{ opacity: normalizedOpacity }}
    >
      <HandColumn hand="left" active={active} theme={theme} />
      <div className="hidden h-20 w-px bg-white/10 md:block" />
      <HandColumn hand="right" active={active} theme={theme} />
    </div>
  );
});

interface HandColumnProps {
  hand: Hand;
  active: { hand: Hand; finger: Finger } | null;
  theme: "default" | "outline";
}

function HandColumn({ hand, active, theme }: HandColumnProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <span className="text-sm font-semibold text-white/80">
        {hand === "left" ? "左手" : "右手"}
      </span>
      <div className="grid w-full max-w-[140px] grid-cols-1 gap-2">
        {fingerLabels[hand].map((finger) => {
          const isActive = active?.hand === hand && active?.finger === finger;
          const baseClass =
            theme === "outline"
              ? "border border-white/30"
              : "bg-white/10 border border-white/10";
          const activeClass =
            theme === "outline"
              ? "border-purple-400 text-purple-200"
              : "bg-purple-500/40 border-purple-300/70 text-white";
          return (
            <div
              key={finger}
              className={`rounded-lg px-3 py-2 text-center transition ${baseClass} ${
                isActive ? activeClass : ""
              }`}
            >
              {displayNames[finger]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

