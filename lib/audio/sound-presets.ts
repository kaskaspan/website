import { audioManager } from "./audio-manager";

export const DEFAULT_KEY_SOUND_PRESETS = [
  {
    id: "mechanical-1",
    src: "/audio/mechanical-1.mp3",
    gain: 0.9,
  },
  {
    id: "soft-click",
    src: "/audio/soft-click.mp3",
    gain: 1,
  },
];

export function registerDefaultPresets() {
  DEFAULT_KEY_SOUND_PRESETS.forEach((preset) => audioManager.registerPreset(preset));
}

