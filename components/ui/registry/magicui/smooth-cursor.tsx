"use client";

import { useEffect, useRef } from "react";

interface SmoothCursorProps {
  enabled?: boolean;
}

export function SmoothCursor({ enabled = true }: SmoothCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || !enabled) {
      if (cursor) {
        cursor.style.display = "none";
      }
      return;
    }

    cursor.style.display = "block";

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrameId: number;

    const updateCursor = () => {
      currentX += (mouseX - currentX) * 0.1;
      currentY += (mouseY - currentY) * 0.1;

      if (cursor) {
        cursor.style.left = `${currentX}px`;
        cursor.style.top = `${currentY}px`;
      }

      animationFrameId = requestAnimationFrame(updateCursor);
    };

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    updateCursor();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="fixed w-6 h-6 rounded-full bg-white/30 pointer-events-none z-50 mix-blend-difference transition-transform duration-300 ease-out"
      style={{
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
