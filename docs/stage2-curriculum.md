## 阶段 2-2 · 课程数据结构与自适应引擎方案

### 1. 数据来源与结构

- 在 `data/curriculum/` 下新增：
  - `tracks.ts`：导出 `lessonTracks: LessonTrack[]`，包含 Track 元数据与 Lesson 列表。
  - `contents.ts`：导出 `lessonContents: LessonContent[]`，按 `contentRef` 关联模块内容。
- 类型沿用阶段 0 设计 (`types/lesson.ts`)，确保 Track / Lesson / Content 一致。
- 后续可替换为 API 拉取；目前作为静态 mock 数据，便于前端快速迭代。

### 2. Store 设计草案

`CurriculumState`：

```ts
interface CurriculumState {
  tracks: LessonTrack[];
  contents: Record<string, LessonContent>;
  selectedTrackId: string | null;
  selectedLessonId: string | null;
  completed: Record<string, { bestStars: number; attempts: number }>;
  recommendedLessonIds: string[];
}
```

- `tracks` / `contents`：初始化时注入静态数据。
- `selectedTrackId` / `selectedLessonId`：用于 TypingGame 载入对应练习。
- `completed`：记录已完成课程表现（星级、尝试次数）。
- `recommendedLessonIds`：自适应引擎产出，供 Lesson Selector 呈现。

### 3. 自适应引擎初版规则

输入：最近一次 `SessionSummary`（星级、准确率、lessonId）。

规则：
1. 若星级 < 3 或准确率 < 90%，推荐重复当前 Lesson。
2. 否则推荐同 Track 下一个 Lesson（若存在）。
3. 若 Track 已完成，推荐下一个 Track 第一个 Lesson。
4. `completed` 数据用于判断已达成的最佳星级，避免重复推荐已满星课程。

未来扩展（阶段 4+）：
- 引入键位热力、技能标签匹配，精准指向弱项课程。
- 结合 spaced repetition / streak 机制微调推荐。

### 4. 相关组件/页面调整

- 新增 `LessonSelector` 组件，展示 Track 与 Lesson 列表、推荐区块。
- TypingGame 页面需读取 store，按所选 Lesson 生成文本。
- session 结束时 dispatch `completeLesson` 与 `updateRecommendation`。

### 5. 下一步

- 实现 `curriculumSlice` 与相关 selectors。
- 编写 `LessonSelector` UI（阶段 2-3）。
- 将 TypingGame 与 Lesson 数据打通，替换现有随机文本。

