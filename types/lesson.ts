import type { KeyboardLayoutType } from "./settings";

export interface LessonModuleBase {
  id: string;
  title?: string;
  instructions?: string;
}

export type LessonModule =
  | (LessonModuleBase & {
      type: "drill";
      text: string;
      repetitions: number;
    })
  | (LessonModuleBase & {
      type: "exercise";
      textBlocks: string[][];
    })
  | (LessonModuleBase & {
      type: "challenge";
      targetWPM: number;
      durationSec: number;
    })
  | (LessonModuleBase & {
      type: "test";
      questionPool: string[];
    });

export interface AnchorHint {
  domain: "left" | "right" | "both";
  description: string;
}

export interface LessonContent {
  id: string;
  locale: string;
  modules: LessonModule[];
  keyboardLayout: KeyboardLayoutType;
  handMode?: "both" | "left" | "right";
  anchorHints?: AnchorHint[];
}

export interface LessonMeta {
  id: string;
  title: string;
  estimatedMinutes: number;
  tags: string[];
  contentRef: string;
  difficulty: {
    speed: number;
    accuracy: number;
    complexity: number;
  };
  skillAttributes: string[];
}

export interface LessonTrack {
  id: string;
  name: string;
  description: string;
  skillBranch: string;
  difficultyIndex: number;
  prerequisites: string[];
  lessons: LessonMeta[];
}

