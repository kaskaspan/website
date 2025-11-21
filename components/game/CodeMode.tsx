"use client";

import { TypingGame } from "@/components/ui/typing-game";

export function CodeMode() {
  // Simple JavaScript code snippet for typing practice
  const lesson = `function hello(name) {
  console.log("Hello, " + name);
}`;
  return <TypingGame overrideLessonText={lesson} />;
}
