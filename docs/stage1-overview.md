## 阶段 1 · 核心打字体验（MVP）路线

### 目标

- 将阶段 0 的模型与状态规划落地到实际代码骨架。
- 构建 TypingGame 核心体验的最小可用版本：文本呈现、键盘高亮、实时统计。
- 为后续阶段预留扩展点（音频、虚拟手、课程体系等）。

### 本阶段主要交付

1. `store/` 目录：Redux Toolkit 初始化、`sessions`/`preferences`/`user` 等基础 slice。
2. `components/ui/typing/core/`：拆分 `TypingGame`，形成可复用的核心组件矩阵：
   - `TextDisplay`
   - `VirtualKeyboard`（简化版）
   - `StatsPanel`
   - `TypingController`（负责事件监听与状态分发）
3. MVP 功能：键盘输入 → 状态更新 → UI 渲染，支持 WPM / 准确率 / 星级基础计算。
4. 文档：`stage1-store-init.md`、`stage1-typing-core.md`（组件设计与实现细节）。

### 任务清单（建议顺序）

1. 建立 store、slice、selector 基础代码结构。
2. 将现有 `TypingGame` 组件拆分成核心子组件，迁移逻辑到 store。
3. 实现 MVP 数据流：
   - keydown 捕获 → dispatch → reducer
   - selector 计算 wpm/accuracy/stars
   - UI 组件消费 store 状态
4. 回写 `app/typing-game/page.tsx`，使用新组件结构。
5. 撰写阶段文档与代码注释，更新 README 路线图。

### 验收标准

- 无论是否连接后端，单次练习可完整进行：输入 → 统计 → Reset。
- 状态存于 Redux store，可通过 Redux DevTools 检查。
- 代码遵循阶段 0 设定的目录与文档规范。
- 单元测试覆盖核心 reducer / selector。

完成以上内容后，即可进入阶段 2（课程体系与自适应训练）。

