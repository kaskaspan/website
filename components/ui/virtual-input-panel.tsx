"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useVirtualKeyboard } from "@/components/ui/virtual-keyboard-toggle";

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

const ALLOWED_ROUTE_PREFIXES = ["/game", "/typing"];

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
    id: "tab",
    label: "Tab",
    key: "Tab",
    code: "Tab",
    insertValue: "\t",
    className: "flex-[1.2]",
  },
  {
    id: "space",
    label: "Space",
    key: " ",
    code: "Space",
    insertValue: " ",
    className: "flex-[3]",
  },
  {
    id: "enter",
    label: "Enter",
    key: "Enter",
    code: "Enter",
    action: "enter",
    className: "flex-[1.5]",
  },
  {
    id: "backspace",
    label: "⌫",
    key: "Backspace",
    code: "Backspace",
    action: "backspace",
    className: "flex-[1.2]",
  },
];

const TYPING_LAYOUT: VirtualKey[][] = [
  NUMBER_KEYS,
  TOP_ROW_LETTERS,
  HOME_ROW_LETTERS,
  [
    { id: "shift", label: "⇧", key: "Shift", code: "ShiftLeft", className: "flex-[1.3]" },
    ...BOTTOM_ROW_LETTERS,
    ...BASIC_PUNCTUATION,
    { id: "shift-right", label: "⇧", key: "Shift", code: "ShiftRight", className: "flex-[1.3]" },
  ],
  CONTROL_KEYS,
];

const GAME_KEYS: VirtualKey[] = [
  {
    id: "game-up",
    label: "↑",
    key: "ArrowUp",
    code: "ArrowUp",
    hint: "上",
  },
  {
    id: "game-down",
    label: "↓",
    key: "ArrowDown",
    code: "ArrowDown",
    hint: "下",
  },
  {
    id: "game-left",
    label: "←",
    key: "ArrowLeft",
    code: "ArrowLeft",
    hint: "左",
  },
  {
    id: "game-right",
    label: "→",
    key: "ArrowRight",
    code: "ArrowRight",
    hint: "右",
  },
  {
    id: "game-r",
    label: "R",
    key: "r",
    code: "KeyR",
    hint: "重载",
  },
  {
    id: "game-l",
    label: "L",
    key: "l",
    code: "KeyL",
    hint: "加载",
  },
  {
    id: "game-w",
    label: "W",
    key: "w",
    code: "KeyW",
    hint: "上",
  },
  {
    id: "game-a",
    label: "A",
    key: "a",
    code: "KeyA",
    hint: "左",
  },
  {
    id: "game-s",
    label: "S",
    key: "s",
    code: "KeyS",
    hint: "下",
  },
  {
    id: "game-d",
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
    className: "flex-[2]",
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
    id: "game-escape",
    label: "Esc",
    key: "Escape",
    code: "Escape",
    hint: "退出",
  },
];

const GAME_LAYOUT: VirtualKey[][] = [
  // 第一行：方向键
  [
    { id: "spacer-1", label: "", key: "", code: "", className: "flex-[0.5]" },
    GAME_KEYS[0], // ↑
    { id: "spacer-2", label: "", key: "", code: "", className: "flex-[0.5]" },
  ],
  // 第二行：左右和 R/L
  [
    GAME_KEYS[2], // ←
    { id: "spacer-3", label: "", key: "", code: "", className: "flex-[0.5]" },
    GAME_KEYS[1], // ↓
    { id: "spacer-4", label: "", key: "", code: "", className: "flex-[0.5]" },
    GAME_KEYS[3], // →
    { id: "spacer-5", label: "", key: "", code: "", className: "flex-[1]" },
    GAME_KEYS[4], // R
    GAME_KEYS[5], // L
  ],
  // 第三行：WASD
  [
    GAME_KEYS[6], // W
    GAME_KEYS[7], // A
    GAME_KEYS[8], // S
    GAME_KEYS[9], // D
  ],
  // 第四行：控制键
  [
    GAME_KEYS[10], // Space
    GAME_KEYS[11], // Enter
    GAME_KEYS[12], // Esc
  ],
];

export function VirtualInputPanel() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const { isOpen: contextIsOpen, toggle, close } = useVirtualKeyboard();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [mode, setMode] = useState<PanelMode>("typing");
  const [pressedKeyIds, setPressedKeyIds] = useState<Set<string>>(new Set());
  const dragState = useRef<PointerDragState | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const pathname = usePathname();
  const [debugMode, setDebugMode] = useState(false);

  // 根据路径初始化模式
  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/game")) {
      setMode("game");
    } else if (pathname.startsWith("/typing")) {
      setMode("typing");
    }
  }, [pathname]);

  // 合并 context 和本地状态，优先使用 context
  const isOpen = contextIsOpen || localIsOpen;

  // 检查调试模式（通过 URL 参数或 localStorage）
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get("virtualKeyboard");
    const storedDebug = localStorage.getItem("virtualKeyboardDebug");
    const shouldDebug = debugParam === "true" || storedDebug === "true";
    setDebugMode(shouldDebug);
  }, []);

  const isAllowedRoute = useMemo(() => {
    if (!pathname) {
      return false;
    }
    return ALLOWED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

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

  // 当 context 打开时，允许显示虚拟键盘（即使不是触控设备）
  useEffect(() => {
    if (!isAllowedRoute) {
      close();
      setLocalIsOpen(false);
    }
    // 如果 context 打开，允许显示（即使不是触控设备）
    if (contextIsOpen && isAllowedRoute) {
      // 允许显示
    } else if (!isTouchDevice && !debugMode && !contextIsOpen) {
      // 只有在不是触控设备、不是调试模式、且 context 未打开时才关闭
      close();
      setLocalIsOpen(false);
    }
  }, [isTouchDevice, isAllowedRoute, debugMode, close, contextIsOpen]);

  const layout = useMemo(() => {
    return mode === "typing" ? TYPING_LAYOUT : GAME_LAYOUT;
  }, [mode]);

  const isGameMode = mode === "game";

  // 在允许的路由上，如果是触控设备、调试模式、或 context 打开，则显示
  if (
    !isAllowedRoute ||
    (!isTouchDevice && !debugMode && !contextIsOpen)
  ) {
    return null;
  }

  const updatePressedKeysState = () => {
    setPressedKeyIds(new Set(pressedKeysRef.current));
  };

  const handleOpenToggle = () => {
    toggle();
    setLocalIsOpen((prev) => !prev);
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
    // 降低阈值，使滑动更容易触发
    if (delta < -30) {
      if (!isOpen) {
        toggle();
        setLocalIsOpen(true);
      }
    } else if (delta > 30) {
      if (isOpen) {
        close();
        setLocalIsOpen(false);
      }
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
    <div 
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4"
      style={{
        paddingBottom: isOpen 
          ? `max(env(safe-area-inset-bottom, 0px), 16px)` 
          : `max(env(safe-area-inset-bottom, 0px), 16px)`,
      }}
    >
      <div
        className={cn(
          "pointer-events-auto relative w-full max-w-3xl transition-transform duration-300 ease-out will-change-transform",
          isOpen ? "translate-y-0" : "translate-y-[calc(100%-56px)]"
        )}
      >
        <button
          type="button"
          aria-label={isOpen ? "隐藏虚拟键盘" : "展开虚拟键盘"}
          className="absolute -top-14 left-1/2 flex h-14 w-48 -translate-x-1/2 select-none flex-col items-center justify-center gap-1 rounded-t-2xl bg-gradient-to-b from-white/30 to-white/20 text-xs font-semibold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition-all active:scale-95 active:bg-white/40"
          onClick={handleOpenToggle}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-1 w-8 rounded-full bg-white/60"></div>
            <div className="h-0.5 w-6 rounded-full bg-white/40"></div>
          </div>
          <span className="text-[10px]">{isOpen ? "向下滑动收起" : "向上滑动展开"}</span>
        </button>
        <div 
          className="overflow-hidden rounded-t-3xl border border-white/15 bg-gradient-to-b from-gray-900/95 to-black/95 shadow-[0_-20px_45px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          style={{ height: '25vh', maxHeight: '25vh' }}
        >
          {/* 切换按钮区域 */}
          <div className="flex items-center justify-center px-3 pt-2 pb-1">
            <Button
              onClick={() => setMode(mode === "typing" ? "game" : "typing")}
              variant="outline"
              className="border-white/30 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white backdrop-blur-sm text-xs h-7 px-2"
              size="sm"
            >
              {mode === "typing" ? "🎮 游戏" : "⌨️ 打字"}
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-1 pb-1 text-xs text-white/70">
            <span className="font-medium text-[10px]">
              {isGameMode ? "触控控制" : "触控键盘"}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-white/60">
              <Label
                htmlFor="virtual-panel-mode"
                className="whitespace-nowrap text-white/70 text-[10px]"
              >
                WASD
              </Label>
              <Switch
                id="virtual-panel-mode"
                checked={isGameMode}
                onCheckedChange={(checked) =>
                  setMode(checked ? "game" : "typing")
                }
                className="scale-75"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1 px-2 pb-2 pt-1 overflow-y-auto" style={{ maxHeight: 'calc(25vh - 60px)' }}>
            {layout.map((row, rowIndex) => (
              <div
                key={`row-${rowIndex}`}
                className="flex justify-center gap-1"
              >
                {row.map((virtualKey) => {
                  // 空白键（spacer）不渲染按钮，只作为占位符
                  if (virtualKey.id.startsWith("spacer-") || (!virtualKey.key && !virtualKey.label)) {
                    return (
                      <div
                        key={virtualKey.id}
                        className={cn("flex-1", virtualKey.className)}
                      />
                    );
                  }
                  return (
                    <Button
                      key={virtualKey.id}
                      type="button"
                      size="sm"
                      variant="secondary"
                      tabIndex={-1}
                      disabled={!virtualKey.key}
                      className={cn(
                        "h-8 min-w-[32px] flex-1 select-none border border-white/10 bg-white/10 text-xs font-semibold text-white hover:bg-white/20 hover:border-white/20 active:scale-[0.95] active:bg-white/25 rounded shadow-sm transition-all p-1",
                        virtualKey.className,
                        pressedKeyIds.has(virtualKey.id) && "bg-white/25 border-white/30 shadow-md",
                        !virtualKey.key && "opacity-0 pointer-events-none"
                      )}
                      onPointerDown={(event) => {
                        if (virtualKey.key) {
                          handlePointerStart(event, virtualKey);
                        }
                      }}
                      onPointerUp={(event) => {
                        if (virtualKey.key) {
                          handlePointerEnd(event, virtualKey);
                        }
                      }}
                      onPointerCancel={(event) => {
                        if (virtualKey.key) {
                          handlePointerCancel(event, virtualKey);
                        }
                      }}
                      onPointerOut={(event) => {
                        if (virtualKey.key) {
                          handlePointerOut(event, virtualKey);
                        }
                      }}
                    >
                      <span className="text-xs leading-tight">{virtualKey.label}</span>
                      {virtualKey.hint && !isGameMode ? (
                        <span className="ml-0.5 text-[8px] font-normal text-white/60 leading-tight">
                          {virtualKey.hint}
                        </span>
                      ) : null}
                    </Button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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
