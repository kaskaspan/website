"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TypingGame } from "@/components/ui/typing-game";

export function CustomMode() {
  const [customText, setCustomText] = useState("");
  const [start, setStart] = useState(false);

  const handleStart = () => {
    if (customText.trim().length > 0) {
      setStart(true);
    }
  };

  if (start) {
    return <TypingGame overrideLessonText={customText} />;
  }

  return (
    <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
      <textarea
        className="w-full h-32 p-2 bg-black/30 text-white rounded mb-4 focus:outline-none"
        placeholder="在此输入自定义练习文本…"
        value={customText}
        onChange={(e) => setCustomText(e.target.value)}
      />
      <Button onClick={handleStart} disabled={!customText.trim()}>
        开始练习
      </Button>
    </Card>
  );
}
