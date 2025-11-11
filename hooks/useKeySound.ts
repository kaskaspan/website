"use client";

import { useCallback, useEffect, useMemo } from "react";

import { audioManager } from "@/lib/audio/audio-manager";
import { registerDefaultPresets } from "@/lib/audio/sound-presets";

interface UseKeySoundOptions {
  enabled: boolean;
  masterVolume: number; // 0-100
  keyVolume: number; // 0-100
  presetId: string;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function useKeySound({
  enabled,
  masterVolume,
  keyVolume,
  presetId,
}: UseKeySoundOptions) {
  useEffect(() => {
    registerDefaultPresets();
  }, []);

  const normalizedMaster = useMemo(() => clamp01(masterVolume / 100), [masterVolume]);
  const normalizedKey = useMemo(() => clamp01(keyVolume / 100), [keyVolume]);

  useEffect(() => {
    audioManager.setMasterVolume(normalizedMaster);
  }, [normalizedMaster]);

  const playKey = useCallback(() => {
    if (!enabled) return;
    audioManager.playKey(presetId, { volume: normalizedKey });
  }, [enabled, normalizedKey, presetId]);

  const playError = useCallback(() => {
    if (!enabled) return;
    audioManager.playError(presetId);
  }, [enabled, presetId]);

  return { playKey, playError };
}

