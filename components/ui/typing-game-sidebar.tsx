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
      className={`h-full bg-white border-r border-gray-200 transition-all duration-300 relative z-50 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`h-full flex flex-col ${isCollapsed ? "p-2" : "p-4"}`}>
        {/* Header */}
        <div className={`flex flex-col items-center ${isCollapsed ? "mb-4" : "mb-4"}`}>
          {isCollapsed ? (
            <>
              {/* Top Icon - Click to go to current mode */}
              <Button
                onClick={() => {
                  const currentModeData = TYPING_MODES.find((m) => m.id === currentMode);
                  if (currentModeData) {
                    onModeSelect(currentMode);
                  }
                }}
                variant="ghost"
                size="lg"
                className="w-full h-12 mb-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                title={TYPING_MODES.find((m) => m.id === currentMode)?.name || "Current Mode"}
              >
                <span className="text-2xl">
                  {TYPING_MODES.find((m) => m.id === currentMode)?.name.split(" ")[0] || "⌨️"}
                </span>
              </Button>
              {/* Collapse Button */}
              <Button
                onClick={() => setIsCollapsed(!isCollapsed)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:bg-gray-100 w-full"
              >
                →
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <h2 className="text-xl font-bold text-gray-800">⌨️ 打字模式</h2>
              <Button
                onClick={() => setIsCollapsed(!isCollapsed)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:bg-gray-100"
              >
                ←
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        {!isCollapsed && (
          <div className="w-full h-px bg-gray-200 mb-4" />
        )}

        {/* Mode List */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${isCollapsed ? "space-y-2" : "space-y-2"}`}>
          {TYPING_MODES.map((mode) => (
            <Button
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              className={`w-full h-auto transition-all duration-200 ${
                isCollapsed ? "justify-center" : "justify-start text-left"
              } ${
                mode.id === "custom"
                  ? isCollapsed
                    ? "p-4"
                    : "p-5"
                  : isCollapsed
                    ? "p-2"
                    : "p-3"
              } ${
                currentMode === mode.id
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
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
              className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              📊 统计信息
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              ⚙️ 设置
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

