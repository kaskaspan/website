"use client";

import { cn } from "@/lib/utils";

interface LoadingProps {
  className?: string;
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({
  className,
  text = "加载中...",
  size = "md",
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className
      )}
    >
      {/* 旋转的加载图标 */}
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />

      {/* 加载文本 */}
      <p
        className={cn(
          "text-gray-600 dark:text-gray-400",
          textSizeClasses[size]
        )}
      >
        {text}
      </p>
    </div>
  );
}

// 全屏加载组件
export function FullScreenLoading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg">
        <Loading text={text} size="lg" />
      </div>
    </div>
  );
}

// 页面加载组件
export function PageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          {/* 主要加载动画 */}
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />

          {/* 脉冲效果 */}
          <div className="absolute inset-0 w-16 h-16 border-4 border-white/10 rounded-full animate-ping mx-auto" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Kasper Pan</h2>
        <p className="text-white/70">正在加载您的世界...</p>

        {/* 进度条 */}
        <div className="w-64 h-1 bg-white/20 rounded-full mt-6 mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"
            style={{ width: "60%" }}
          />
        </div>
      </div>
    </div>
  );
}
