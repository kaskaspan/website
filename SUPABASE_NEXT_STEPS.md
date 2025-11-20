# Supabase 集成 - 下一步操作指南

## ✅ 已完成

1. ✅ Supabase 项目已创建
2. ✅ API 密钥已配置到 `.env.local`
3. ✅ 数据库 schema 已执行（9 个表已创建）

## 🔍 验证表是否创建成功

### 方法 1: 在 Supabase 仪表板中检查

1. 访问: https://supabase.com/dashboard/project/tvvccjopzfnnssxaatom/editor
2. 点击左侧菜单的 **Table Editor**
3. 你应该能看到以下表：
   - `user_profiles`
   - `user_preferences`
   - `game_scores`
   - `lesson_tracks`
   - `lessons`
   - `lesson_contents`
   - `typing_sessions`
   - `typing_events`
   - `user_lesson_progress`

### 方法 2: 通过应用测试

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问登录页面：
   ```
   http://localhost:3000/login
   ```

3. 尝试注册新用户：
   - 点击"还没有账户？点击注册"
   - 填写邮箱、密码和用户名
   - 点击注册

4. 检查 Supabase 仪表板：
   - 在 Table Editor 中打开 `user_profiles` 表
   - 应该能看到新注册的用户

## 🚀 测试完整流程

### 1. 启动应用

```bash
npm run dev
```

### 2. 测试注册功能

1. 访问 `http://localhost:3000/login`
2. 注册一个新用户
3. 检查 Supabase 中的 `user_profiles` 表

### 3. 测试登录功能

1. 使用刚注册的账户登录
2. 应该能成功登录并跳转到首页

### 4. 测试数据同步（可选）

登录后：
- 玩一个游戏（访问 `/game`）
- 完成打字练习（访问 `/typing-game`）
- 数据会自动同步到 Supabase

## 🔧 如果遇到问题

### 问题：无法连接 Supabase

- 检查 `.env.local` 文件中的环境变量是否正确
- 确认 Supabase 项目状态为 "Active"
- 重启开发服务器

### 问题：注册/登录失败

- 检查 Supabase 项目中的 Authentication 设置
- 确认邮箱认证已启用
- 检查浏览器控制台的错误信息

### 问题：数据无法同步

- 确认用户已登录
- 检查浏览器控制台的错误信息
- 确认数据库表已创建（在 Table Editor 中查看）

## 📚 有用的链接

- Supabase 项目仪表板: https://supabase.com/dashboard/project/tvvccjopzfnnssxaatom
- Table Editor: https://supabase.com/dashboard/project/tvvccjopzfnnssxaatom/editor
- Authentication 设置: https://supabase.com/dashboard/project/tvvccjopzfnnssxaatom/auth/users
- API 设置: https://supabase.com/dashboard/project/tvvccjopzfnnssxaatom/settings/api

## ✨ 完成！

现在你的应用已经连接到 Supabase，可以：
- ✅ 用户注册和登录
- ✅ 数据持久化
- ✅ 多设备数据同步
- ✅ 游戏分数和打字记录存储

开始测试吧！🎉

