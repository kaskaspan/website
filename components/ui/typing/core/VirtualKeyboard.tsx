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
  idle: "bg-white border-gray-200 text-gray-600 shadow-sm",
  active: "bg-purple-100 border-purple-300 text-purple-900 shadow-sm",
  correct: "bg-emerald-100 border-emerald-300 text-emerald-900 shadow-sm",
  incorrect: "bg-rose-100 border-rose-300 text-rose-900 shadow-sm",
  hint: "bg-blue-100 border-blue-300 text-blue-900 shadow-sm",
};

export const VirtualKeyboard = memo<VirtualKeyboardProps>(
  ({ layout = DEFAULT_LAYOUT, keyStates }) => {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 p-4">
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

