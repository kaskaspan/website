"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { selectLesson } from "@/store/slices";
import { TypingGame } from "@/components/ui/typing-game";

export function BookMode() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Select the World End book lesson
    dispatch(selectLesson({ lessonId: "content-book-world-end" }));
  }, [dispatch]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-serif font-bold text-[#5f4b32] dark:text-[#a69b8d]">
          📖 世界末日
        </h2>
        <p className="text-sm text-[#a69b8d] font-serif italic mt-2">
          "城不是墙，是时间。"
        </p>
      </div>
      <TypingGame mode="book" />
    </div>
  );
}
