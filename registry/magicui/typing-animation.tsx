"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  children?: ReactNode;
  text?: string;
  className?: string;
  cursorClassName?: string;
  speed?: number;
  loop?: boolean;
  hideCursorAfterFinish?: boolean;
}

export function TypingAnimation({
  children,
  text,
  className,
  cursorClassName,
  speed = 70,
  loop = false,
  hideCursorAfterFinish = false,
}: TypingAnimationProps) {
  const content = useMemo(() => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) {
      return children
        .map((child) => (typeof child === "string" ? child : ""))
        .join("");
    }
    return text ?? "";
  }, [children, text]);

  const [visibleCount, setVisibleCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasFinished = visibleCount >= content.length && !loop;

  useEffect(() => {
    setVisibleCount(0);
  }, [content]);

  useEffect(() => {
    if (!content) {
      setVisibleCount(0);
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= content.length) {
          if (!loop) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return prev;
          }
          return 0;
        }
        return prev + 1;
      });
    }, Math.max(20, speed));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [content, speed, loop]);

  const displayText = content.slice(0, Math.min(visibleCount, content.length));

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <span>{displayText}</span>
      {(!hideCursorAfterFinish || !hasFinished) && (
        <span
          className={cn(
            "ml-1 inline-block h-5 w-[2px] animate-pulse bg-current align-middle",
            cursorClassName
          )}
        />
      )}
    </span>
  );
}
