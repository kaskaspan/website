"use client";

import { useState } from "react";
import { TypingGame } from "@/components/ui/typing-game";

export function AccuracyMode() {
  // Shorter text to focus on accuracy
  const lesson = "The quick brown fox jumps over the lazy dog.";
  return <TypingGame overrideLessonText={lesson} />;
}
