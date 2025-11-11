export type ThemeMode = "default" | "dark" | "high-contrast" | "custom";

export interface ThemeSetting {
  mode: ThemeMode;
  primaryColor?: string;
  accentColor?: string;
}

export type KeyboardLayoutType =
  | "qwerty"
  | "dvorak"
  | "colemak"
  | "azerty"
  | "custom";

export interface TypingRuleSetting {
  allowBackspace: boolean;
  blockOnError: boolean;
  keySound: "off" | "soft" | "loud" | string;
  voiceNarration: "off" | "word" | "letter" | "full";
  cursorStyle: "blink" | "solid" | "beam";
  oneHandMode?: "left" | "right" | "both";
  layout: KeyboardLayoutType;
}

export interface AccessibilitySetting {
  fontFamily: "system" | "opendyslexic" | "large-print" | string;
  fontSize: "sm" | "md" | "lg" | "xl" | "2xl";
  lineHeight: number;
  colorScheme: "default" | "dark" | "custom";
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
  highContrastMode: boolean;
  motionReduction: number;
  screenReaderHints: boolean;
  zoomLevel: number;
  focusOutline: "default" | "strong";
}

export interface AudioSetting {
  masterVolume: number; // 0-100
  keySoundEnabled: boolean;
  keySoundProfile: string;
  keySoundVolume: number;
  voiceEnabled: boolean;
  voiceLocale: string;
  voiceSpeed: number;
  ambientSound: boolean;
  ambientVolume: number;
  spatialAudio: boolean;
}

export interface LayoutSetting {
  showVirtualKeyboard: boolean;
  showVirtualHands: boolean;
  handTransparency: number; // 0-100
  perspectiveTilt: number; // 0-30°
  highlightColor: string;
  virtualHandTheme: "default" | "outline";
}

export interface UserPreferences {
  theme: ThemeSetting;
  typing: TypingRuleSetting;
  accessibility: AccessibilitySetting;
  audio: AudioSetting;
  layout: LayoutSetting;
}

