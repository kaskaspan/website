## 阶段 0 · 核心数据模型草案

本文件用于阶段 0 的准备工作，定义 TypingClub 级别平台所需的主要实体与 TypeScript 接口雏形，后续阶段将在此基础上拓展。

### 1. 用户与身份

```ts
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: "student" | "teacher" | "admin";
  locale: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: ThemeSetting;
  typing: TypingRuleSetting;
  accessibility: AccessibilitySetting;
  audio: AudioSetting;
  layout: LayoutSetting;
}
```

### 2. 课程体系

```ts
export interface LessonTrack {
  id: string;
  name: string;
  description: string;
  skillBranch: string; // 对应技能树的主分支
  difficultyIndex: number; // 0-100
  prerequisites: string[]; // 依赖的 track id
  lessons: LessonMeta[];
}

export interface LessonMeta {
  id: string;
  title: string;
  estimatedMinutes: number;
  tags: string[]; // speed / accuracy / left-hand 等
  contentRef: string; // 指向 LessonContent 的 id
  difficulty: {
    speed: number;
    accuracy: number;
    complexity: number;
  };
  skillAttributes: string[]; // 与 78 种技能标签对应
}

export interface LessonContent {
  id: string;
  locale: string;
  modules: LessonModule[]; // Drill / Exercise / Challenge / Test
  keyboardLayout: KeyboardLayoutType;
  handMode?: "both" | "left" | "right";
  anchorHints?: AnchorHint[]; // 左右域练习
}

export type LessonModule =
  | { type: "drill"; text: string; repetitions: number }
  | { type: "exercise"; textBlocks: string[][] }
  | { type: "challenge"; targetWPM: number; durationSec: number }
  | { type: "test"; questionPool: string[] };
```

### 3. 打字会话与事件

```ts
export interface TypingSession {
  id: string;
  userId: string;
  lessonId: string;
  trackId: string;
  startedAt: string;
  finishedAt?: string;
  config: TypingRuleSetting;
  summary?: SessionSummary;
  events?: TypingEvent[]; // 按需持久化
}

export interface TypingEvent {
  timestamp: number;
  key: string;
  action: "keydown" | "keyup" | "autoscroll";
  isCorrect?: boolean;
  latencyMs?: number;
  cursorIndex?: number;
}

export interface SessionSummary {
  durationMs: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  errorRate: number;
  starRating: number; // 0-5, 支持 0.5 递增
  streak: number;
  burstSpeed?: number;
  hesitationStats?: HesitationStat;
  fingerUsage?: FingerUsageStat[];
  heatmap?: KeyHeatmap;
}
```

### 4. 设置与可访问性

```ts
export interface TypingRuleSetting {
  allowBackspace: boolean;
  blockOnError: boolean;
  keySound: "off" | "soft" | "loud" | string; // 自定义音色 id
  voiceNarration: "off" | "word" | "letter" | "full";
  cursorStyle: "blink" | "solid" | "beam";
  oneHandMode?: "left" | "right";
  layout: KeyboardLayoutType;
}

export interface AccessibilitySetting {
  fontFamily: "system" | "opendyslexic" | "large-print" | string;
  fontSize: "sm" | "md" | "lg" | "xl" | "2xl";
  lineHeight: number; // 1.0-3.0
  colorScheme: "default" | "high-contrast" | "dark" | "custom";
  colorBlindMode?: "protanopia" | "deuteranopia" | "tritanopia";
  motionReduction: number; // 0-100
  screenReaderHints: boolean;
  zoomLevel: number; // 100-400%
}

export interface AudioSetting {
  masterVolume: number; // 0-100
  spatialAudio: boolean;
  ambientSound: boolean;
  voiceLocale: string;
}

export interface LayoutSetting {
  showVirtualKeyboard: boolean;
  showVirtualHands: boolean;
  handTransparency: number; // 0-100
  perspectiveTilt: number; // 0-30°
  highlightColor: string;
}
```

### 5. 成就与游戏化

```ts
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string; // speed / streak / accuracy / exploration 等
  icon: string;
  criteria: AchievementCriteria;
  rewards?: AchievementReward;
}

export type AchievementCriteria =
  | { type: "wpm"; threshold: number }
  | { type: "accuracy"; threshold: number }
  | { type: "streak"; days: number }
  | { type: "lesson"; count: number }
  | { type: "custom"; script: string };

export interface AchievementReward {
  xp?: number;
  keyCoins?: number;
  badgeId?: string;
}

export interface ProgressionState {
  xp: number;
  level: number;
  streakDays: number;
  keyCoins: number;
  unlockedBadges: string[];
}
```

### 6. 教室与管理（预留）

```ts
export interface Classroom {
  id: string;
  name: string;
  ownerId: string; // teacher/admin
  organizationId?: string;
  gradeLevel?: string;
  tags?: string[];
  roster: ClassroomMember[];
  settings: ClassroomSetting;
}

export interface ClassroomMember {
  userId: string;
  role: "student" | "co-teacher";
  status: "active" | "inactive";
  accommodations?: AccommodationSetting;
}

export interface ClassroomAssignment {
  id: string;
  classroomId: string;
  lessonIds: string[];
  assignedAt: string;
  dueAt?: string;
  timeLimitMin?: number;
  prerequisites?: string[];
  targetGroupIds?: string[]; // 自定义分组
}
```

### 7. 后续工作

- 阶段 1 将基于以上接口创建真实的 TypeScript 类型文件，并为状态管理提供 initial state。
- 阶段 2 会扩展 lesson 与 session 的实际数据结构，加入自适应与错误分类字段。
- 阶段 4 之后需将本设计映射到数据库 schema（PostgreSQL + Prisma）。

