"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PanelMode = "typing" | "game";

type VirtualKey = {
  id: string;
  label: string;
  key: string;
  code: string;
  insertValue?: string;
  action?: "backspace" | "enter";
  hint?: string;
  className?: string;
};

type PointerDragState = {
  startY: number;
  pointerId: number;
};

const NUMBER_KEYS: VirtualKey[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
].map((value) => ({
  id: `digit-${value}`,
  label: value,
  key: value,
  code: `Digit${value}`,
  insertValue: value,
}));

const TOP_ROW_LETTERS = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map(
  (value) => ({
    id: `key-${value}`,
    label: value,
    key: value.toLowerCase(),
    code: `Key${value}`,
    insertValue: value.toLowerCase(),
  })
);

const HOME_ROW_LETTERS = ["A", "S", "D", "F", "G", "H", "J", "K", "L"].map(
  (value) => ({
    id: `key-${value}`,
    label: value,
    key: value.toLowerCase(),
    code: `Key${value}`,
    insertValue: value.toLowerCase(),
  })
);

const BOTTOM_ROW_LETTERS = ["Z", "X", "C", "V", "B", "N", "M"].map((value) => ({
  id: `key-${value}`,
  label: value,
  key: value.toLowerCase(),
  code: `Key${value}`,
  insertValue: value.toLowerCase(),
}));

const BASIC_PUNCTUATION: VirtualKey[] = [
  { id: "comma", label: ",", key: ",", code: "Comma", insertValue: "," },
  { id: "period", label: ".", key: ".", code: "Period", insertValue: "." },
];

const CONTROL_KEYS: VirtualKey[] = [
  {
    id: "space",
    label: "Space",
    key: " ",
    code: "Space",
    insertValue: " ",
    className: "flex-[1.8]",
  },
  {
    id: "enter",
    label: "Enter",
    key: "Enter",
    code: "Enter",
    action: "enter",
    className: "flex-[1.1]",
  },
  {
    id: "backspace",
    label: "Backspace",
    key: "Backspace",
    code: "Backspace",
    action: "backspace",
    className: "flex-[1.1]",
  },
];

const TYPING_LAYOUT: VirtualKey[][] = [
  NUMBER_KEYS,
  TOP_ROW_LETTERS,
  HOME_ROW_LETTERS,
  [...BOTTOM_ROW_LETTERS, ...BASIC_PUNCTUATION],
  CONTROL_KEYS,
];

const GAME_KEYS: VirtualKey[] = [
  {
    id: "game-up",
    label: "W",
    key: "w",
    code: "KeyW",
    hint: "上",
  },
  {
    id: "game-left",
    label: "A",
    key: "a",
    code: "KeyA",
    hint: "左",
  },
  {
    id: "game-down",
    label: "S",
    key: "s",
    code: "KeyS",
    hint: "下",
  },
  {
    id: "game-right",
    label: "D",
    key: "d",
    code: "KeyD",
    hint: "右",
  },
  {
    id: "game-space",
    label: "Space",
    key: " ",
    code: "Space",
    insertValue: " ",
    hint: "跳跃 / 选择",
    className: "flex-[1.5]",
  },
  {
    id: "game-enter",
    label: "Enter",
    key: "Enter",
    code: "Enter",
    action: "enter",
    hint: "确认",
  },
  {
    id: "game-backspace",
    label: "Backspace",
    key: "Backspace",
    code: "Backspace",
    action: "backspace",
    hint: "撤销",
  },
];

const GAME_LAYOUT: VirtualKey[][] = [
  GAME_KEYS.slice(0, 3),
  GAME_KEYS.slice(3, 5),
  GAME_KEYS.slice(5),
];

export function VirtualInputPanel() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PanelMode>("typing");
  const [pressedKeyIds, setPressedKeyIds] = useState<Set<string>>(new Set());
  const dragState = useRef<PointerDragState | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const evaluateTouch = () => {
      const hasTouch =
        window.matchMedia?.("(pointer: coarse)")?.matches ||
        navigator.maxTouchPoints > 0 ||
        "ontouchstart" in window;
      setIsTouchDevice(hasTouch);
    };

    evaluateTouch();

    const handleResize = () => evaluateTouch();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    const touchListener = () => setIsTouchDevice(true);
    window.addEventListener("touchstart", touchListener, { once: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.removeEventListener("touchstart", touchListener);
    };
  }, []);

  useEffect(() => {
    if (!isTouchDevice) {
      setIsOpen(false);
    }
  }, [isTouchDevice]);

  const layout = useMemo(() => {
    return mode === "typing" ? TYPING_LAYOUT : GAME_LAYOUT;
  }, [mode]);

  if (!isTouchDevice) {
    return null;
  }

  const updatePressedKeysState = () => {
    setPressedKeyIds(new Set(pressedKeysRef.current));
  };

  const handleOpenToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handlePointerStart = (
    event: React.PointerEvent<HTMLButtonElement>,
    key: VirtualKey
  ) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!pressedKeysRef.current.has(key.id)) {
      pressedKeysRef.current.add(key.id);
      fireKeyboardEvent("keydown", key);
      updatePressedKeysState();
    }
  };

  const releaseKey = (key: VirtualKey) => {
    if (!pressedKeysRef.current.has(key.id)) {
      return;
    }
    pressedKeysRef.current.delete(key.id);
    fireKeyboardEvent("keyup", key);
    handleTextInsertion(key);
    updatePressedKeysState();
  };

  const handlePointerEnd = (
    event: React.PointerEvent<HTMLButtonElement>,
    key: VirtualKey
  ) => {
    event.preventDefault();
    event.currentTarget.releasePointerCapture(event.pointerId);
    releaseKey(key);
  };

  const handlePointerCancel = (
    _event: React.PointerEvent<HTMLButtonElement>,
    key: VirtualKey
  ) => {
    releaseKey(key);
  };

  const handlePointerOut = (
    _event: React.PointerEvent<HTMLButtonElement>,
    key: VirtualKey
  ) => {
    if (!pressedKeysRef.current.has(key.id)) {
      return;
    }
    releaseKey(key);
  };

  const handleDragStart: React.PointerEventHandler<HTMLButtonElement> = (
    event
  ) => {
    event.preventDefault();
    dragState.current = {
      startY: event.clientY,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove: React.PointerEventHandler<HTMLButtonElement> = (
    event
  ) => {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) {
      return;
    }
    const delta = event.clientY - dragState.current.startY;
    if (delta < -40) {
      setIsOpen(true);
    } else if (delta > 40) {
      setIsOpen(false);
    }
  };

  const handleDragEnd: React.PointerEventHandler<HTMLButtonElement> = (
    event
  ) => {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) {
      return;
    }
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragState.current = null;
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(env(safe-area-inset-bottom,0px),16px)]">
      <div
        className={cn(
          "pointer-events-auto relative w-full max-w-3xl transition-transform duration-300 ease-out will-change-transform",
          isOpen ? "translate-y-0" : "translate-y-[calc(100%-48px)]"
        )}
      >
        <button
          type="button"
          aria-label={isOpen ? "隐藏虚拟键盘" : "展开虚拟键盘"}
          className="absolute -top-12 left-1/2 flex h-12 w-40 -translate-x-1/2 select-none items-center justify-center rounded-full bg-white/20 text-xs font-medium uppercase tracking-[0.2em] text-white/80 backdrop-blur transition-colors active:bg-white/30"
          onClick={handleOpenToggle}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          {isOpen ? "向下滑动收起" : "向上滑动展开"}
        </button>
        <div className="overflow-hidden rounded-t-3xl border border-white/15 bg-black/75 shadow-[0_-20px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 pt-6 text-sm text-white/60">
            <span className="font-medium">
              {mode === "typing" ? "触控键盘" : "触控控制"}
            </span>
            <div className="flex gap-2 rounded-full bg-white/10 p-1">
              <ModeToggle
                label="键盘"
                isActive={mode === "typing"}
                onClick={() => setMode("typing")}
              />
              <ModeToggle
                label="WASD"
                isActive={mode === "game"}
                onClick={() => setMode("game")}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 px-4 pb-6 pt-4">
            {layout.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className="flex justify-center gap-2"
              >
                {row.map((virtualKey) => (
                  <Button
                    key={virtualKey.id}
                    type="button"
                    size="lg"
                    variant="secondary"
                    tabIndex={-1}
                    className={cn(
                      "h-12 min-w-[44px] flex-1 select-none border-transparent bg-white/15 text-base font-semibold text-white hover:bg-white/25 active:scale-[0.97] active:bg-white/30",
                      virtualKey.className,
                      pressedKeyIds.has(virtualKey.id) && "bg-white/30"
                    )}
                    onPointerDown={(event) =>
                      handlePointerStart(event, virtualKey)
                    }
                    onPointerUp={(event) => handlePointerEnd(event, virtualKey)}
                    onPointerCancel={(event) =>
                      handlePointerCancel(event, virtualKey)
                    }
                    onPointerOut={(event) =>
                      handlePointerOut(event, virtualKey)
                    }
                  >
                    <span>{virtualKey.label}</span>
                    {virtualKey.hint ? (
                      <span className="ml-1 text-[10px] font-normal text-white/70">
                        {virtualKey.hint}
                      </span>
                    ) : null}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeToggle({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-1.5 text-xs font-semibold text-white/70 transition",
        isActive ? "bg-white/25 text-white" : "bg-transparent hover:bg-white/15"
      )}
    >
      {label}
    </button>
  );
}

function fireKeyboardEvent(type: "keydown" | "keyup", key: VirtualKey) {
  if (typeof window === "undefined") {
    return;
  }

  const eventInit: KeyboardEventInit = {
    key: key.key,
    code: key.code,
    bubbles: true,
  };

  try {
    const event = new KeyboardEvent(type, eventInit);
    window.dispatchEvent(event);

    const activeElement = document.activeElement;
    if (activeElement) {
      activeElement.dispatchEvent(new KeyboardEvent(type, eventInit));
    }
  } catch {
    // 某些浏览器阻止构造 KeyboardEvent，我们忽略错误并继续
  }
}

function handleTextInsertion(key: VirtualKey) {
  if (typeof document === "undefined") {
    return;
  }

  const activeElement = document.activeElement as HTMLElement | null;
  if (!activeElement) {
    return;
  }

  if (isTextInput(activeElement)) {
    insertIntoInput(activeElement, key);
    return;
  }

  if (activeElement.isContentEditable) {
    if (key.action === "backspace") {
      document.execCommand("delete");
      return;
    }
    if (key.action === "enter") {
      document.execCommand("insertHTML", false, "\n");
      return;
    }
    if (key.insertValue) {
      document.execCommand("insertText", false, key.insertValue);
    }
  }
}

function insertIntoInput(
  element: HTMLInputElement | HTMLTextAreaElement,
  key: VirtualKey
) {
  const { selectionStart, selectionEnd, value } = element;
  const start = selectionStart ?? value.length;
  const end = selectionEnd ?? value.length;

  let nextValue = value;
  let nextCursor = start;

  if (key.action === "backspace") {
    if (start === end && start > 0) {
      nextValue = value.slice(0, start - 1) + value.slice(end);
      nextCursor = start - 1;
    } else if (start !== end) {
      nextValue = value.slice(0, start) + value.slice(end);
      nextCursor = start;
    }
  } else if (key.action === "enter") {
    nextValue = value.slice(0, start) + "\n" + value.slice(end);
    nextCursor = start + 1;
  } else if (key.insertValue !== undefined) {
    nextValue = value.slice(0, start) + key.insertValue + value.slice(end);
    nextCursor = start + key.insertValue.length;
  } else {
    return;
  }

  if (nextValue !== value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      element.constructor.prototype,
      "value"
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, nextValue);
    } else {
      element.value = nextValue;
    }

    element.setSelectionRange(nextCursor, nextCursor);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function isTextInput(
  element: HTMLElement | null
): element is HTMLInputElement | HTMLTextAreaElement {
  if (!element) {
    return false;
  }
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  );
}
