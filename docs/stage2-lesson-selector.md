## 阶段 2-3 · Lesson Selector 与自适应推荐实现

### 完成内容
- 新增 `components/ui/typing/lessons/LessonSelector.tsx`，展示课程 Track、Lesson 列表与推荐区域。
- `LessonSelector` 与 `curriculum` slice 交互，可以：
  - 切换 Track（同步更新默认 Lesson）。
  - 高亮推荐课程、显示预计时长、标签、历史星级与练习次数。
  - 根据点击更新 `selectedLessonId`，驱动 TypingGame 加载对应文本。
- 在 `TypingGame` 中嵌入 `LessonSelector`，并将底部“换一段文本”按钮替换为“下一推荐”。
- 更新 `selectNewText`，优先跳转至 `recommendedLessonIds`，若无推荐则保持当前课程。

### 推荐策略回顾
- `curriculumSlice` 在 `completeLesson` 时更新 `completed` 记录，并依据星级/准确率生成推荐：
  1. 星级 < 3 或准确率 < 90% → 重复当前 Lesson。
  2. 否则推荐同 Track 下一 Lesson。
  3. 若当前 Track 已完成 → 推荐下一个 Track 的首个 Lesson。
- 推荐结果显示在 LessonSelector 顶部的卡片区，同时 TypingGame 页面的“下一推荐”按钮也引用同样的数据。

### 后续拓展
- 引入更细粒度的自适应：根据 SessionSummary 中的热力/技能标签进行 Lesson 匹配。
- 给 LessonSelector 增加过滤器、搜索与进度统计。
- 支持从后端加载课程数据，允许教师端动态管理。

