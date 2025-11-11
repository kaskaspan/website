## 阶段 4 · 数据持久化与分析管线（规划）

### 核心目标

- 将当前前端 Redux 状态与练习数据持久化到后端，支撑多设备同步与教师端分析。
- 构建基础的 Analytics Dashboard，展示历史 WPM、准确率、热力图、课程进度等。
- 设计离线队列与重试机制，确保断网练习可在恢复后同步。

### 计划交付（阶段 4 全局）

1. **后端接口**
   - 用户、课程、Session、Analytics API 草案（REST + WebSocket）
   - 数据库建模（PostgreSQL + Prisma，表：users / lessons / lesson_tracks / typing_sessions / typing_events / achievements 等）
   - Redis 缓存课程数据、排行榜等热点信息

2. **前端同步**
   - 扩展 Redux middleware：离线队列、重试策略、在线状态指示
   - RTK Query service 拦截器统一附带用户 token、处理错误
   - IndexedDB 存储 typing events、session chunks，在线时批量同步

3. **分析面板**
   - Dashboard 页面展示：WPM/T趋势、准确率、练习时长、键位热力图、成就
   - 通过后端 API 获取聚合数据（后台异步计算后存储或实时聚合）

4. **文档 & 测试**
   - `stage4-backend-api.md`（API 设计）、`stage4-analytics-pipeline.md`（数据 ETL、任务队列、离线处理）
   - Jest 测试：同步队列、中间件；端到端测试：离线/在线切换

### 阶段节点

- **阶段 4-1**（当前）梳理目标与任务
- **阶段 4-2** 设计后端 API 及数据同步流程
- **阶段 4-3** 实现前端持久化与 Dashboard MVP

完成阶段 4 后，可进入阶段 5（教师/管理工具）和阶段 6（智能推荐、全球部署）。

