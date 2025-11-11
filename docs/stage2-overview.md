## 阶段 2 · 课程体系与自适应训练（规划）

### 目标

- 在现有 Typing Core 基础上，构建可扩展的课程体系：Lesson Track、Lesson Selector、技能标签等。
- 引入“自适应引擎”雏形：根据用户错误模式与历史表现推荐下一段文本或专项训练。
- 为后续阶段（成就、教师端）提供课程和练习数据的结构化基础。

### 计划交付

1. **数据层**
   - 课程数据配置（示例 JSON / TypeScript 定义），适配阶段 0 的 `LessonTrack`、`LessonMeta`、`LessonContent` 类型。
   - 错误统计与适应策略：从 `sessions` slice 拓展出 `analytics` / `recommendation` 基础数据。

2. **UI/交互**
   - `LessonSelector` 组件（网格/分组展示 + “推荐”区域）。
   - 在 Typing Game 页加入“切换课程/推荐练习”入口，显示当前课程详情、目标指标。
   - MVP 自适应：基于最近错误的键位或手指，推送专项练习。

3. **状态管理**
   - 新增 `curriculum` slice：缓存课程列表、当前选中 Lesson、推荐练习队列。
   - 新增 `analytics` slice（或扩展 `sessions`）：记录错误频率、键位热力。

4. **文档与测试**
   - `stage2-curriculum.md`：课程数据与状态设计细节。
   - `stage2-adaptive-engine.md`：自适应算法 MVP 设计。
   - 单元测试覆盖新的 reducer / selector。

### 实施步骤（建议）

1. 整理课程与 Track 的示例数据，定义加载方式（静态文件 / API / 本地 mock）。
2. 实现 `curriculum` slice + selector，管理当前 Track、Lesson 列表、推荐队列。
3. 开发 `LessonSelector` UI，与 store 交互；在 TypingGame 页集成。
4. 构建自适应策略：
   - 统计最近 N 次 session 的错误键位。
   - 生成针对性的 lesson（例如触发特定 `LessonContent`）。
   - 提供简单的“推荐下一步”提示。
5. 补写文档、测试，更新 README Roadmap 状态。

### 依赖 / 前提

- 阶段 1 的 Redux 与 Typing Core 已准备完毕。
- 需要加入静态课程数据（可放在 `data/curriculum` 或 `lib/curriculum`）。
- 若需使用外部 JSON，可在临时 mock 基础上逐步迁移至后端。

后续阶段将基于此成果扩展 Gamification、教师端、数据分析等功能。

