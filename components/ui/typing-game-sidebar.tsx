"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TypingGameSidebarProps {
  currentMode: string;
  onModeSelect: (mode: string) => void;
}

const TYPING_MODES = [
  {
    id: "classic",
    name: "📝 经典模式",
    description: "标准打字练习",
  },
  {
    id: "speed",
    name: "⚡ 速度挑战",
    description: "测试你的打字速度",
  },
  {
    id: "accuracy",
    name: "🎯 准确度训练",
    description: "提高打字准确度",
  },
  {
    id: "code",
    name: "💻 代码练习",
    description: "编程代码打字练习",
  },
  {
    id: "quote",
    name: "💬 名言警句",
    description: "打字练习名言",
  },
  {
    id: "custom",
    name: "✏️ 自定义文本",
    description: "输入自己的文本",
  },
];

export function TypingGameSidebar({
  currentMode,
  onModeSelect,
}: TypingGameSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Card
      className={`h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-white/20 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-white">⌨️ 打字模式</h2>
          )}
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            {isCollapsed ? "→" : "←"}
          </Button>
        </div>

        {/* Divider */}
        {!isCollapsed && (
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4" />
        )}

        {/* Mode List */}
        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {TYPING_MODES.map((mode) => (
            <Button
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              className={`w-full justify-start text-left h-auto p-3 transition-all duration-200 ${
                currentMode === mode.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{mode.name.split(" ")[0]}</span>
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium">{mode.name}</div>
                    <div className="text-xs opacity-70">{mode.description}</div>
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="mt-4 space-y-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-white border-white/30 hover:bg-white/10"
            >
              📊 统计信息
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-white border-white/30 hover:bg-white/10"
            >
              ⚙️ 设置
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

