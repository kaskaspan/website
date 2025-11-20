# Supabase 集成设置指南

本项目已集成 Supabase 用于数据持久化、用户认证和数据同步。

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **Name**: 你的项目名称
   - **Database Password**: 设置一个强密码（保存好，后续需要）
   - **Region**: 选择离你最近的区域
4. 等待项目创建完成（通常需要 1-2 分钟）

## 2. 获取 API 密钥

1. 在 Supabase 项目仪表板中，点击左侧菜单的 **Settings** (⚙️)
2. 选择 **API**
3. 复制以下值：
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## 3. 设置环境变量

在项目根目录创建 `.env.local` 文件（如果不存在）：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

将 `your_supabase_project_url` 和 `your_supabase_anon_key` 替换为你在步骤 2 中复制的值。

## 4. 创建数据库表

1. 在 Supabase 项目仪表板中，点击左侧菜单的 **SQL Editor**
2. 点击 **New query**
3. 打开项目中的 `supabase/schema.sql` 文件
4. 复制整个 SQL 内容并粘贴到 SQL Editor
5. 点击 **Run** 执行 SQL

这将创建以下表：
- `user_profiles` - 用户档案
- `user_preferences` - 用户偏好设置
- `game_scores` - 游戏分数
- `lesson_tracks` - 课程轨道
- `lessons` - 课程
- `lesson_contents` - 课程内容
- `typing_sessions` - 打字会话
- `typing_events` - 打字事件
- `user_lesson_progress` - 用户课程进度

## 5. 配置认证

### 启用邮箱认证

1. 在 Supabase 项目仪表板中，点击左侧菜单的 **Authentication**
2. 选择 **Providers**
3. 确保 **Email** 提供者已启用
4. 配置邮箱设置（可选）：
   - **Enable email confirmations**: 开发时可以关闭，生产环境建议开启
   - **Secure email change**: 建议开启

### 配置重定向 URL

1. 在 **Authentication** > **URL Configuration** 中
2. 添加以下重定向 URL：
   - `http://localhost:3000/auth/callback` (开发环境)
   - `https://yourdomain.com/auth/callback` (生产环境)

## 6. 更新应用代码

### 选项 A: 使用 Supabase 认证（推荐）

在 `app/layout.tsx` 中，将 `AuthProvider` 替换为 `SupabaseAuthProvider`：

```tsx
import { SupabaseAuthProvider } from "@/components/auth/SupabaseAuthProvider";

// 在 RootLayout 中
<SupabaseAuthProvider>
  {children}
</SupabaseAuthProvider>
```

### 选项 B: 保持现有认证系统

如果你想继续使用 localStorage 认证，可以保持现有代码不变。Supabase 将仅用于数据同步。

## 7. 更新登录表单

更新 `components/auth/LoginForm.tsx` 以支持邮箱/密码登录：

```tsx
import { loginWithEmail, signUp } from "@/lib/supabase/auth";

// 使用 loginWithEmail 或 signUp 函数
```

## 8. 测试

1. 启动开发服务器：`npm run dev`
2. 访问登录页面
3. 尝试注册新用户
4. 登录后检查 Supabase 仪表板中的 `user_profiles` 表，应该能看到新用户

## 9. 数据迁移（可选）

如果你有现有的 localStorage 数据需要迁移到 Supabase：

1. 导出 localStorage 数据
2. 编写迁移脚本将数据导入 Supabase
3. 或者让用户重新注册，数据会在使用时自动同步

## 故障排除

### 问题：无法连接到 Supabase

- 检查 `.env.local` 文件中的环境变量是否正确
- 确认 Supabase 项目状态为 "Active"
- 检查网络连接

### 问题：认证失败

- 检查 Supabase 项目中的 Authentication 设置
- 确认邮箱认证已启用
- 检查重定向 URL 配置

### 问题：数据库权限错误

- 检查 Row Level Security (RLS) 策略是否正确设置
- 确认用户已登录
- 检查表结构是否与 schema.sql 一致

## 下一步

- 配置实时订阅（WebSocket）
- 设置数据备份
- 配置生产环境域名
- 设置监控和告警

## 参考资源

- [Supabase 文档](https://supabase.com/docs)
- [Next.js + Supabase 指南](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)

