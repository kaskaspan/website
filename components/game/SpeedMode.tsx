"use client";

import { TypingGame } from "@/components/ui/typing-game";

export function SpeedMode() {
  // Short lesson for speed mode
  const lesson = "The quick brown fox jumps over the lazy dog.";
  return <TypingGame overrideLessonText={lesson} />;
}
