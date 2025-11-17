"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";

type VirtualKeyboardContextType = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const VirtualKeyboardContext = createContext<VirtualKeyboardContextType | null>(
  null
);

export function VirtualKeyboardProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <VirtualKeyboardContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </VirtualKeyboardContext.Provider>
  );
}

export function useVirtualKeyboard() {
  const context = useContext(VirtualKeyboardContext);
  if (!context) {
    throw new Error(
      "useVirtualKeyboard must be used within VirtualKeyboardProvider"
    );
  }
  return context;
}

export function VirtualKeyboardToggleButton() {
  const { isOpen, toggle } = useVirtualKeyboard();

  return (
    <Button
      onClick={toggle}
      variant="outline"
      className="border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm"
      size="lg"
    >
      <Keyboard className="h-4 w-4 mr-2" />
      {isOpen ? "隐藏键盘" : "显示键盘"}
    </Button>
  );
}

