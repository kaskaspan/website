## 阶段 3-2 · 音频系统与可访问性增强方案

### 1. 音频系统设计

| 模块 | 说明 |
| --- | --- |
| `lib/audio/audio-manager.ts` | 单例类，封装 Web Audio API，负责加载音色、播放、音量控制、缓存 AudioBuffer。 |
| `lib/audio/sound-presets.ts` | 预定义键音配置（名称、资源路径、音量校准参数）。 |
| `hooks/useKeySound.ts`（阶段 3-3 实现） | 订阅按键事件，根据 `preferences.audio` 播放对应音效。 |

#### 核心功能
- 懒加载音频资源，支持 `playKey`, `playError`, `playAmbient` 等接口。
- 全局主音量（0-100，与 `preferences.audio.masterVolume` 对应）。
- 键音音量 `keySoundVolume`（线性输入 → 对数调节）。
- 语音引导开关 + 播放速率（封装 Web Speech API，在后续阶段接入）。
- 环境音通道（循环播放，支持淡入淡出）。

### 2. 可访问性增强

扩展 `preferences.accessibility`：

| 字段 | 作用 |
| --- | --- |
| `highContrastMode: boolean` | 开关高对比度主题。 |
| `colorBlindMode: "none" | "protanopia" | ...` | 色盲主题调色。 |
| `motionReduction: number` | 动画减弱（0-100）。 |
| `screenReaderHints: boolean` | 是否播报额外提示。 |
| `focusOutline: "default" | "strong"` | 统一焦点样式。 |
| `oneHandMode: "both" | "left" | "right"` | 配合课程推荐单手训练。 |

扩展 `preferences.layout`：
- `showVirtualHands: boolean`
- `handTransparency: number`
- `virtualHandTheme: "default" | "outline"`

### 3. Store 与默认值

- 更新 `types/settings.ts` 与 `store/slices/preferencesSlice.ts`，为新增字段提供类型与默认值。
- 同步 `defaultPreferences`，确保新设置有初始值。
- 后续阶段 3-3 将在设置面板中映射这些字段。

### 4. 样式与主题

- 在 `app/globals.css` 中加入 CSS 变量，如 `--app-bg`, `--app-text`, `--focus-outline`。
- 提供高对比度、色盲模式的变量覆盖（使用 `data-theme` 属性或 className）。
- 动画减弱：在关键动画 class 中读取 `motionReduction`，通过 CSS 或 `framer-motion` 缩短/取消动效。

### 5. 实施路线

1. **此阶段（3-2）**
   - 定义音频与可访问性设置字段、默认值、文档（即本文件）。
   - 创建 `AudioManager` 骨架，支持加载/播放接口（尚未接入 UI）。

2. **下一阶段（3-3）**
   - 开发 `useKeySound`、`VirtualHands`、设置面板 UI。
   - 将音频/虚拟手与 TypingGame 结合，响应用户设置。

3. **后续阶段**
   - 语音播报、环境音、可访问性测试（Screen Reader、Lighthouse）。
   - 与课程推荐协同（例如 One-hand 模式推荐专用课程）。

### 6. 资源

- 音色资源可放置于 `public/audio/`（例如 `mechanical-1.mp3`, `click-soft.wav`）。
- 色盲调色可参考 [Color Oracle](https://colororacle.org/) 或 WCAG 指南。
- Web Speech API 参考：`window.speechSynthesis`, `SpeechSynthesisUtterance`。

