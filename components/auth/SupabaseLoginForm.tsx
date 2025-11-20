"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginWithEmail, signUp, loginWithUsername } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SupabaseLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      let result;
      
      if (isSignUp) {
        if (!email || !password || !username) {
          setError("请填写所有字段");
          setIsLoading(false);
          return;
        }
        result = await signUp(email, password, username);
      } else {
        // 使用邮箱和密码登录
        if (!email || !password) {
          setError("请输入邮箱和密码");
          setIsLoading(false);
          return;
        }
        result = await loginWithEmail(email, password);
      }

      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || "发生错误，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <Card className="w-full max-w-md mx-4 p-8 bg-white/10 backdrop-blur-sm border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isSignUp ? "注册账户" : "登录"}
          </h1>
          <p className="text-white/70">
            {isSignUp
              ? "创建新账户以同步您的数据"
              : "登录以访问您的账户和数据"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                用户名
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                required={isSignUp}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              密码
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? "至少6个字符" : "输入密码"}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              required
              minLength={isSignUp ? 6 : undefined}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isSignUp ? "注册中..." : "登录中..."}
              </div>
            ) : (
              isSignUp ? "注册" : "登录"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-white/70 hover:text-white text-sm underline"
            >
              {isSignUp
                ? "已有账户？点击登录"
                : "还没有账户？点击注册"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

