"use client";

import { TypingGame } from "@/components/ui/typing-game";

export function QuoteMode() {
  const quotes = [
    "The only limit to our realization of tomorrow is our doubts today. – Franklin D. Roosevelt",
    "Life is what happens when you're busy making other plans. – John Lennon",
    "In the middle of difficulty lies opportunity. – Albert Einstein",
  ];
  const lesson = quotes[Math.floor(Math.random() * quotes.length)];
  return <TypingGame overrideLessonText={lesson} />;
}
