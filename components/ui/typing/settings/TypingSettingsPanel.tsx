"use client";

import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPreferences, resetPreferences } from "@/store/slices";
import type { ThemeMode, UserPreferences } from "@/types";

type AudioPreferences = UserPreferences["audio"];
type LayoutPreferences = UserPreferences["layout"];
type AccessibilityPreferences = UserPreferences["accessibility"];

interface TypingSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function TypingSettingsPanel({ open, onClose }: TypingSettingsPanelProps) {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => state.preferences.value);

  const updateAudio = useCallback(
    (partial: Partial<AudioPreferences>) => {
      const nextAudio: AudioPreferences = {
        ...preferences.audio,
        ...partial,
      };
      dispatch(setPreferences({ ...preferences, audio: nextAudio }));
    },
    [dispatch, preferences]
  );

  const updateLayout = useCallback(
    (partial: Partial<LayoutPreferences>) => {
      const nextLayout: LayoutPreferences = {
        ...preferences.layout,
        ...partial,
      };
      dispatch(setPreferences({ ...preferences, layout: nextLayout }));
    },
    [dispatch, preferences]
  );

  const updateAccessibility = useCallback(
    (partial: Partial<AccessibilityPreferences>) => {
      const nextAccessibility: AccessibilityPreferences = {
        ...preferences.accessibility,
        ...partial,
      };
      dispatch(setPreferences({ ...preferences, accessibility: nextAccessibility }));
    },
    [dispatch, preferences]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <Card className="w-full max-w-3xl border-white/10 bg-slate-950/90 p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Typing 设置</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => dispatch(resetPreferences())}>
              恢复默认
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="space-y-3">
            <h3 className="text-lg font-semibold">音频</h3>
            <label className="flex items-center justify-between text-sm">
              <span>键音开关</span>
              <input
                type="checkbox"
                checked={preferences.audio.keySoundEnabled}
                onChange={(event) => updateAudio({ keySoundEnabled: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>音色</span>
              <select
                value={preferences.audio.keySoundProfile}
                onChange={(event) => updateAudio({ keySoundProfile: event.target.value })}
                className="rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
              >
                <option value="mechanical-1">机械键盘</option>
                <option value="soft-click">柔和点击</option>
              </select>
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>键音音量</span>
              <input
                type="range"
                min={0}
                max={100}
                value={preferences.audio.keySoundVolume}
                onChange={(event) =>
                  updateAudio({ keySoundVolume: Number(event.target.value) })
                }
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>主音量</span>
              <input
                type="range"
                min={0}
                max={100}
                value={preferences.audio.masterVolume}
                onChange={(event) =>
                  updateAudio({ masterVolume: Number(event.target.value) })
                }
              />
            </label>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold">视觉与可访问性</h3>
            <label className="flex items-center justify-between text-sm">
              <span>虚拟手显示</span>
              <input
                type="checkbox"
                checked={preferences.layout.showVirtualHands}
                onChange={(event) => updateLayout({ showVirtualHands: event.target.checked })}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>虚拟手透明度</span>
              <input
                type="range"
                min={0}
                max={100}
                value={preferences.layout.handTransparency}
                onChange={(event) =>
                  updateLayout({ handTransparency: Number(event.target.value) })
                }
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>主题模式</span>
              <select
                value={preferences.theme.mode}
                onChange={(event) => {
                  const mode = event.target.value as ThemeMode;
                  dispatch(
                    setPreferences({
                      ...preferences,
                      theme: {
                        ...preferences.theme,
                        mode,
                      },
                    })
                  );
                }}
                className="rounded border border-white/10 bg-black/30 px-2 py-1 text-white"
              >
                <option value="default">默认</option>
                <option value="dark">深色</option>
                <option value="custom">自定义</option>
              </select>
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>高对比度</span>
              <input
                type="checkbox"
                checked={preferences.accessibility.highContrastMode}
                onChange={(event) =>
                  updateAccessibility({ highContrastMode: event.target.checked })
                }
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>动画减弱</span>
              <input
                type="range"
                min={0}
                max={100}
                value={preferences.accessibility.motionReduction}
                onChange={(event) =>
                  updateAccessibility({ motionReduction: Number(event.target.value) })
                }
              />
            </label>
          </section>
        </div>
      </Card>
    </div>
  );
}

