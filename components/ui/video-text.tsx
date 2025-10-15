"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VideoTextProps {
  children: React.ReactNode;
  src: string;
  className?: string;
}

export function VideoText({ children, src, className }: VideoTextProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      video.play();
    };

    video.addEventListener("loadeddata", handleLoadedData);
    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className
      )}
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10 text-6xl font-bold text-white mix-blend-screen">
        {children}
      </div>
    </div>
  );
}
