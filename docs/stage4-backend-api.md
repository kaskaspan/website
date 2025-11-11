## 阶段 4-2 · 后端 API、同步与分析管线方案

### 1. 系统架构概览

- **API 层**：Next.js App Router API routes 或独立 NestJS 服务；提供 REST + WebSocket。
- **数据库**：PostgreSQL + Prisma（或 Drizzle）
  - `users`, `lesson_tracks`, `lessons`, `lesson_contents`
  - `typing_sessions`, `typing_events`, `user_preferences`, `achievements`
  - `analytics_snapshots`（聚合表）
- **缓存**：Redis（热点课程、排行榜、课堂状态）
- **任务队列**：BullMQ / RabbitMQ，用于同步 typing events、生成分析报表、发送通知。
- **对象存储**：S3/OSS，用于保存录音、音频、导出报表（阶段 5+）

### 2. API 设计草案

#### Auth & User
- `POST /api/auth/login`（邮箱/密码或 OAuth）
- `GET /api/user/profile`：返回 `UserProfile` + 偏好设置
- `PUT /api/user/preferences`：更新 UI/音频/可访问性设置

#### Curriculum
- `GET /api/curriculum/tracks`：返回所有 Track + Lesson 元数据
- `GET /api/curriculum/contents/:id`：LessonContent（懒加载）
- `POST /api/curriculum/progress`：批量提交完成记录，更新星级/成就

#### Typing Sessions
- `POST /api/sessions/start`：创建 session 记录，返回 sessionId
- `POST /api/sessions/:id/events`：批量上传打字事件（带 time offset）
- `POST /api/sessions/:id/complete`：结束 session，提交 summary
- `GET /api/sessions/recent`：最近练习概览（分页）

#### Analytics
- `GET /api/analytics/overview`：返回 WPM/Accuracy/Duration 等统计（按日/周/月）
- `GET /api/analytics/heatmap`：返回键位热点图
- `GET /api/analytics/achievements`：返回成就、连胜等

#### WebSocket
- `ws://.../realtime`：用于课堂实时状态、教师监控、多人竞速
  - 事件：`session:update`, `lesson:assigned`, `leaderboard:update`

### 3. 数据同步流程

#### 前端
1. 用户开始练习 → 调用 `/sessions/start` 获得 sessionId。
2. 打字时：事件暂存于 IndexedDB，并放入离线队列。
3. 在线时，每 N 秒或累积 M 条 → `POST /sessions/:id/events`。
4. 完成后 → `POST /sessions/:id/complete`（包含 summary）。
5. 如果离线：队列保留，恢复网络后按时间顺序重放。

#### 后端
- `typing_events` 表存储原始事件，异步写入 kafka/队列用于分析。
- `typing_sessions` 表存 summary、lessonId、WPM、Accuracy、stars。
- 定时 Job（Cron）读取近 24h 数据，生成 `analytics_snapshots`。
- 课堂/排行榜数据写入 Redis，方便实时读取。

### 4. 分析管线（ETL）
1. 收集：session 完成时写入 `typing_events` & `typing_sessions`。
2. 队列：BullMQ 任务处理原始事件，生成键位热力、技能标签统计。
3. 存储：分析结果写入 `analytics_snapshots`（按日/周）。
4. Dashboard 通过 API 拉取 snapshot，减少实时聚合压力。

### 5. 安全与权限
- JWT/Auth Token，前端携带到 API 请求；WebSocket 连接前需要验证。
- 教师端（后续阶段）需要 Role-based Access Control，区分 student/teacher/admin。
- GDPR：`/api/user/delete` 支持数据导出与匿名化。

### 6. 下一步（阶段 4-3）
- 实现前端同步中间件：离线队列、RTK Query services。
- 搭建 mock API 或本地后端原型，验证流程。
- 开发 Analytics Dashboard MVP，展示 overview & heatmap。

