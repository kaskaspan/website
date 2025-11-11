"use client";

import { memo } from "react";

type KeyState = "idle" | "active" | "correct" | "incorrect" | "hint";

export interface VirtualKeyboardProps {
  layout?: string[][];
  keyStates?: Record<string, KeyState>;
}

const DEFAULT_LAYOUT: string[][] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

const stateClassMap: Record<KeyState, string> = {
  idle: "bg-white/10 border-white/20 text-white/80",
  active: "bg-purple-500/60 border-purple-200/80 text-white",
  correct: "bg-emerald-500/60 border-emerald-200/80 text-white",
  incorrect: "bg-rose-500/60 border-rose-100/80 text-white",
  hint: "bg-blue-500/40 border-blue-200/80 text-white",
};

export const VirtualKeyboard = memo<VirtualKeyboardProps>(
  ({ layout = DEFAULT_LAYOUT, keyStates }) => {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((key) => {
              const state = keyStates?.[key.toLowerCase()] ?? "idle";
              return (
                <span
                  key={key}
                  className={`flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold uppercase transition ${stateClassMap[state]}`}
                >
                  {key}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
);

VirtualKeyboard.displayName = "VirtualKeyboard";

