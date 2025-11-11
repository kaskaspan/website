"use client";

import { useEffect } from "react";

export interface TypingControllerProps {
  enabled?: boolean;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  children?: React.ReactNode;
}

export function TypingController({
  enabled = true,
  onKeyDown,
  onKeyUp,
  children,
}: TypingControllerProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown?.(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      onKeyUp?.(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, onKeyDown, onKeyUp]);

  return <>{children}</>;
}

