## 阶段 1 · Typing Core MVP 实现说明

### 1. 组件拆分与接线

- `TypingGame` 现已改为 orchestrator：
  - 使用 `TypingController` 捕捉键盘事件，统一处理 `Backspace`、`Escape` 与字符输入。
  - 通过 `TextDisplay` 呈现当前文本与光标位置，去掉原本的字符遍历渲染。
  - 使用 `StatsPanel` 显示 WPM、准确率、正确/错误次数、用时、星级。
  - `VirtualKeyboard` 用于提示当前目标键位（简单 hint 状态）。

- Redux store `sessions` slice 负责会话状态，`TypingGame` 在以下时机 dispatch：
  - `startGame` → `resetSession` + `startSession`（包含 lessonId 与文本）。
  - 输入变动 → `recordKeystroke`（携带 `count`），`setSessionElapsed`，`updateCursor`。
  - 结束 → 计算 `SessionSummary` 并触发 `endSession`。

### 2. 统计与状态同步

- WPM / 准确率仍由 `react-typing-game-hook` 计算，但将增量同步进 Redux，保证未来可脱离第三方 hook。
- star rating 逻辑未变，额外写入 `SessionSummary.starRating`，便于阶段 2 扩展成就系统。
- `highScore` 仍为本地状态（后续可迁移至 store / 后端）。

### 3. 键盘事件流

```
TypingController (keydown)
 → insertTyping / deleteTyping / resetGame
 → hook state 更新
 → useEffect 比对 correct/error/duration 差值
 → dispatch recordKeystroke / setSessionElapsed / updateCursor
 → UI 组件通过 props 展示最新数据
```

### 4. 依赖与提供器

- 新增 `@reduxjs/toolkit`、`react-redux`。
- 创建 `store/StoreProvider` 并在 `app/layout.tsx` 中包裹全局 Provider。

### 5. 待办 / 下一步

- 继续完成阶段 1-3 的测试用例（reducer、selector、TypingGame 交互）。
- Enqueue TODO：将 `VirtualKeyboard` 的状态映射扩充为正确/错误提示。
- 后续阶段引入 `useAppSelector` 以便其他组件读取 `sessions` 数据。

