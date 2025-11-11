## 阶段 1 · Store 与核心目录骨架

本文件记录阶段 1 初始提交所完成的代码结构：

### 1. 类型定义

- 新增 `types/` 目录，按照阶段 0 规划拆分：`user.ts`、`settings.ts`、`lesson.ts`、`session.ts`、`classroom.ts`，并通过 `types/index.ts` 统一导出。
- 这些接口将作为 Redux slice 与后端 schema 的参考基础，后续阶段按需扩展字段。

### 2. Redux Store 基础

- `store/index.ts`：配置 Redux Toolkit store，预置 `user`、`preferences`、`sessions` 三个 slice。
- `store/hooks.ts`：提供 `useAppDispatch`、`useAppSelector` typed hooks，方便在客户端组件中使用。
- `store/slices/`
  - `userSlice.ts`：管理用户档案与加载状态。
  - `preferencesSlice.ts`：存储用户偏好，包含默认配置与 patch 方法。
  - `sessionsSlice.ts`：维护当前打字会话与历史摘要，提供开始/记录/结束等动作。

> 当前阶段未启用 Redux Persist、WebSocket 等高级特性，待阶段 4 后接入。

### 3. Typing Core 组件目录

- 新建 `components/ui/typing/core/`，包含：
  - `TextDisplay.tsx`：文本渲染骨架，预留光标与高亮逻辑。
  - `VirtualKeyboard.tsx`：简化版键盘 UI，将来接入动态状态。
  - `StatsPanel.tsx`：基础统计面板。
  - `TypingController.tsx`：键盘事件控制器，后续与 Redux actions 对接。
  - `index.ts`：统一导出。

这些组件在本阶段仅实现 UI 骨架，尚未与 store 互通，将在阶段 1 的后续任务中完成数据接线。

### 4. 后续步骤

- 阶段 1-3 任务将基于此骨架实现实际数据流与 UI 整合。
- 完成后需要更新 `app/typing-game/page.tsx` 以使用新组件结构。
- 编写相应的单元测试与文档（`stage1-typing-core.md`）。

