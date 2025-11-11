import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { UserPreferences } from "@/types";

export interface PreferencesState {
  value: UserPreferences;
  version: number;
}

const defaultPreferences: UserPreferences = {
  theme: {
    mode: "default",
    primaryColor: "#7c3aed",
    accentColor: "#38bdf8",
  },
  typing: {
    allowBackspace: true,
    blockOnError: false,
    keySound: "off",
    voiceNarration: "off",
    cursorStyle: "blink",
    oneHandMode: "both",
    layout: "qwerty",
  },
  accessibility: {
    fontFamily: "system",
    fontSize: "md",
    lineHeight: 1.6,
    colorScheme: "default",
    colorBlindMode: "none",
    highContrastMode: false,
    motionReduction: 0,
    screenReaderHints: false,
    zoomLevel: 100,
    focusOutline: "default",
  },
  audio: {
    masterVolume: 60,
    keySoundEnabled: false,
    keySoundProfile: "mechanical-1",
    keySoundVolume: 70,
    voiceEnabled: false,
    voiceLocale: "en-US",
    voiceSpeed: 1,
    ambientSound: false,
    ambientVolume: 40,
    spatialAudio: false,
  },
  layout: {
    showVirtualKeyboard: true,
    showVirtualHands: false,
    handTransparency: 40,
    perspectiveTilt: 10,
    highlightColor: "#a855f7",
    virtualHandTheme: "default",
  },
};

const initialState: PreferencesState = {
  value: defaultPreferences,
  version: 1,
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setPreferences(state, action: PayloadAction<UserPreferences>) {
      state.value = action.payload;
      state.version += 1;
    },
    resetPreferences(state) {
      state.value = defaultPreferences;
      state.version += 1;
    },
  },
});

export const { setPreferences, resetPreferences } =
  preferencesSlice.actions;

export default preferencesSlice.reducer;

export { defaultPreferences };

