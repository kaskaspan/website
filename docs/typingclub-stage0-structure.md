## 阶段 0 · 目录结构与文档输出规范

为保证后续阶段迭代有序，约定以下目录规划、命名规则与文档格式。实际创建工作将在对应阶段逐步落地。

### 1. 目录规划

```
app/
  (routes 按 Next.js 约定继续维护)

components/
  ui/
    typing/
      core/          # TypingGame 核心组件（文本呈现、键盘、手势等）
      panels/        # 统计、设置、成就等 UI
      lessons/       # Lesson selector / track 卡片
  dashboards/
    analytics/
    classroom/

store/
  index.ts          # configureStore + middleware
  slices/
    user.ts
    preferences.ts
    sessions.ts
    curriculum.ts
    analytics.ts
    classroom.ts
  services/         # RTK Query service 定义

lib/
  audio/
  accessibility/
  analytics/
  offline/

types/
  index.ts          # re-export
  user.ts
  lesson.ts
  session.ts
  settings.ts
  classroom.ts

docs/
  typingclub-stage0-*.md    # 阶段 0 文档
  stage1-*.md               # 阶段 1 输出（实现细节、API 协议等）

public/
  audio/
  textures/
  keyboard-layouts/
```

> 说明：阶段 1 开始后，将陆续补齐 `store/`、`types/` 等目录与具体实现。

### 2. 文档输出规范

- **命名**：`stage{n}-{topic}.md`，例如 `stage1-virtual-keyboard.md`。
- **结构**：背景 → 目标 → 设计 → 待办 → 关联任务。
- **语言**：默认中文，必要时附英文术语。
- **更新策略**：每阶段结束前更新 `README` 段落，链接至详细文档。

### 3. 阶段交付物清单（示例）

| 阶段 | 必备文档 | 备注 |
| --- | --- | --- |
| 0 | data-models / state-management / structure | 已完成当前文件 |
| 1 | stage1-typing-core.md, stage1-store-init.md | 核心组件 + store 初始化设计 |
| 2 | stage2-curriculum.md, stage2-achievements.md | 课程体系、成就系统细节 |
| 3 | stage3-accessibility.md, stage3-audio-voice.md | 可访问性与音频实现 |
| 4 | stage4-backend-api.md, stage4-analytics-pipeline.md | 后端接口与数据管线 |
| 5 | stage5-classroom.md, stage5-reporting.md | 教师端与报表体系 |
| 6 | stage6-ml-recommendation.md, stage6-global-deployment.md | 智能推荐、全球化部署 |

### 4. README 计划

- 在 README 中新增「TypingClub Blueprint Roadmap」章节。
- 简要列出阶段目标，指向 docs 中详细文档。
- 随阶段推进更新完成状态（勾选/时间戳）。

此文件将作为后续阶段创建目录、编写文档的参考模板；如后期需要调整结构或命名，需在对应阶段文档中记录变更原因。

