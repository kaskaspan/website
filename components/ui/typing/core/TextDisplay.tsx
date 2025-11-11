"use client";

import { memo } from "react";

export interface TextDisplayProps {
  text: string;
  cursorIndex: number;
  highlightRange?: [number, number];
}

export const TextDisplay = memo<TextDisplayProps>(
  ({ text, cursorIndex, highlightRange }) => {
    const beforeCursor = text.slice(0, cursorIndex);
    const atCursor = text.slice(cursorIndex, cursorIndex + 1) || " ";
    const afterCursor = text.slice(cursorIndex + 1);

    return (
      <div className="relative font-mono text-lg leading-relaxed text-white/90">
        <span>{beforeCursor}</span>
        <span className="relative text-purple-300">
          <span className="absolute inset-0 animate-pulse rounded bg-purple-500/30"></span>
          <span className="relative">{atCursor}</span>
        </span>
        <span>{afterCursor}</span>
        {highlightRange && (
          <span className="sr-only">
            Highlight from {highlightRange[0]} to {highlightRange[1]}
          </span>
        )}
      </div>
    );
  }
);

TextDisplay.displayName = "TextDisplay";

