"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface VideoTextProps {
  children: React.ReactNode;
  src: string;
  className?: string;
  fallbackBg?: string;
}

export function VideoText({
  children,
  src,
  className,
  fallbackBg = "bg-gradient-to-r from-purple-600 to-blue-600",
}: VideoTextProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsLoading(false);
      video.play().catch(() => {
        // 如果自动播放失败，静默处理
      });
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", handleCanPlay);

    // 设置超时，如果视频长时间不加载就显示文本
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplay", handleCanPlay);
      clearTimeout(timeout);
    };
  }, [isLoading]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className
      )}
    >
      {/* 视频背景 */}
      {!hasError && (
        <video
          ref={videoRef}
          src={src}
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: isLoading ? 0 : 1 }}
        />
      )}

      {/* 备用背景 */}
      {(hasError || isLoading) && (
        <div className={cn("absolute inset-0 w-full h-full", fallbackBg)} />
      )}

      {/* 加载状态 */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* 文本内容 */}
      <div
        className={cn(
          "relative z-10 text-4xl sm:text-6xl font-bold text-white whitespace-nowrap transition-opacity duration-500",
          isLoading ? "opacity-0" : "opacity-100",
          hasError ? "" : "mix-blend-screen"
        )}
      >
        {children}
      </div>
    </div>
  );
}
