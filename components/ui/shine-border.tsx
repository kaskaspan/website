"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  shineColor?: string | string[];
  className?: string;
  children: React.ReactNode;
}

export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  shineColor = "#ffffff",
  className,
  children,
  ...props
}: ShineBorderProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const isMultipleColors = Array.isArray(shineColor);

  useEffect(() => {
    const divElement = divRef.current;
    if (!divElement) return;

    const updateAnimation = () => {
      const angle = (Date.now() / 10) % 360;
      const colors = isMultipleColors ? shineColor : [shineColor];
      const gradient = `linear-gradient(${angle}deg, ${colors.join(", ")})`;
      divElement.style.background = gradient;
    };

    const interval = setInterval(updateAnimation, 50);
    return () => clearInterval(interval);
  }, [shineColor, isMultipleColors]);

  return (
    <div
      ref={divRef}
      className={cn("relative p-[1px] rounded-lg", className)}
      style={{
        borderRadius: `${borderRadius}px`,
      }}
      {...props}
    >
      <div
        className="w-full h-full rounded-lg"
        style={{
          borderRadius: `${borderRadius - borderWidth}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
