"use client";

import { Lightbulb, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

const TIPS = [
  {
    title: "保持正确姿势",
    content: "坐直，双脚平放地面。屏幕应与视线平齐，手腕悬空，不要压在键盘或桌面上。",
  },
  {
    title: "基准键位 (Home Row)",
    content: "将手指放在 ASDF 和 JKL; 上。这是你的大本营，每次按键后手指都应回到这里。",
  },
  {
    title: "准确度优先",
    content: "不要一味追求速度。先保证准确率，速度自然会随之提升。错误的肌肉记忆很难纠正。",
  },
  {
    title: "使用所有手指",
    content: "严格按照指法图使用对应手指按键。虽然刚开始很慢，但这才是突破速度瓶颈的关键。",
  },
  {
    title: "保持节奏",
    content: "尝试以均匀的节奏打字，而不是忽快忽慢。平稳的节奏有助于减少错误。",
  },
];

export function TypingTips() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2 border-yellow-400/30 text-yellow-200 hover:bg-yellow-400/10 hover:text-yellow-100"
      >
        <Lightbulb className="w-4 h-4" />
        打字技巧
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-xl shadow-2xl p-6"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <Lightbulb className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white">打字小贴士</h2>
              </div>

              <div className="min-h-[120px] mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {TIPS[currentTip].title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {TIPS[currentTip].content}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  {TIPS.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentTip ? "bg-yellow-400" : "bg-white/20"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentTip((prev) => (prev === 0 ? TIPS.length - 1 : prev - 1))}
                    className="text-white/70 hover:text-white"
                  >
                    上一个
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentTip((prev) => (prev + 1) % TIPS.length)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                  >
                    下一个
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
