"use client";

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">测试页面</h1>
        <div className="space-y-4">
          <div>
            <label className="text-white block mb-2">邮箱</label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder:text-white/50"
            />
          </div>
          <div>
            <label className="text-white block mb-2">密码</label>
            <input
              type="password"
              placeholder="输入密码"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder:text-white/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}


