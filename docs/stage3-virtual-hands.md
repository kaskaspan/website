## 阶段 3-3 · 虚拟手势与音效 MVP + 设置面板扩展

### 组件与 Hook
- `components/ui/typing/core/VirtualHands.tsx`
  - 按键位映射到左右手五指，支持 `default/outline` 主题与透明度调节。
  - 在 TypingGame 中根据当前字符实时高亮，配合虚拟键盘提示使用。
- `hooks/useKeySound.ts`
  - 基于 `AudioManager` 播放键音，支持主音量/键音音量/音色配置。
  - 暴露 `playKey`, `playError`，被 TypingGame 调用以输出正确 & 错误反馈。
- `components/ui/typing/settings/TypingSettingsPanel.tsx`
  - 新增设置面板（纯前端 Overlay），允许调整键音开关、音量、虚拟手开关、透明度、高对比度、动画减弱等。
  - 支持“一键恢复默认”，自动写入 Redux `preferences`。

### TypingGame 更新
- 引入 `LessonSelector` + 推荐按钮，练习中可快速跳转下一推荐课程。
- 使用 `useKeySound` 在按键与错误时播放音效。
- 根据用户偏好显示/隐藏虚拟手、调整透明度。
- 新增设置按钮 `⚙️ 设置` 打开 `TypingSettingsPanel`，实现即时配置生效。
- 在完成课程时调用 `completeLesson`，触发自适应推荐刷新。

### 后续建议
- `TypingSettingsPanel` 目前为 MVP，可后续迁移至共享设置中心并加入更多选项（语音、环境音、色盲调色等）。
- 可在高对比度 / 色盲模式下应用 CSS 变量覆盖，进一步改善视觉无障碍。
- 将虚拟手与键盘提示向 `LessonSelector`、`Lesson` 数据打通，突出正在训练的手指和技能标签。

