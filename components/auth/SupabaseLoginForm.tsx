"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loginWithEmail, signUp, loginWithUsername } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export function SupabaseLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // 检查 URL 参数中是否有验证成功的消息
  useEffect(() => {
    const verified = new URLSearchParams(window.location.search).get('verified');
    if (verified === 'true') {
      setSuccessMessage('邮箱验证成功！您现在可以登录了。');
      // 清除 URL 参数
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 验证密码强度
  const validatePassword = (pwd: string): { valid: boolean; message: string } => {
    if (pwd.length < 6) {
      return { valid: false, message: "密码至少需要 6 个字符" };
    }
    if (!/[0-9]/.test(pwd)) {
      return { valid: false, message: "密码必须包含至少一个数字" };
    }
    if (!/[a-z]/.test(pwd)) {
      return { valid: false, message: "密码必须包含至少一个小写字母" };
    }
    if (!/[A-Z]/.test(pwd)) {
      return { valid: false, message: "密码必须包含至少一个大写字母" };
    }
    return { valid: true, message: "" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      let result;
      
      if (isSignUp) {
        if (!email || !password || !username) {
          setError("请填写所有字段");
          setIsLoading(false);
          return;
        }
        
        // 验证密码强度
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          setError(passwordValidation.message);
          setIsLoading(false);
          return;
        }
        
        result = await signUp(email, password, username);
        
        if (result.success) {
          // 注册成功，显示成功消息，不自动跳转
          setSuccessMessage("注册成功！请检查您的邮箱以验证账户。验证后即可登录。");
          // 清空表单
          setEmail("");
          setPassword("");
          setUsername("");
          // 3秒后切换到登录模式
          setTimeout(() => {
            setIsSignUp(false);
            setSuccessMessage("");
          }, 5000);
        } else {
          // 提供更友好的错误消息
          let errorMessage = result.message;
          if (errorMessage.includes('invalid') || errorMessage.includes('Email')) {
            errorMessage = '邮箱地址格式不正确，请检查拼写（例如：gmail.com 不是 gamil.com）';
          } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
            errorMessage = '该邮箱已被注册，请直接登录或使用其他邮箱';
          } else if (errorMessage.includes('password')) {
            errorMessage = '密码不符合要求：需要至少6个字符，包含数字、大写和小写字母';
          }
          setError(errorMessage);
        }
      } else {
        // 使用邮箱和密码登录
        if (!email || !password) {
          setError("请输入邮箱和密码");
          setIsLoading(false);
          return;
        }
        result = await loginWithEmail(email, password);
        
        if (result.success) {
          router.push("/");
          router.refresh();
        } else {
          // 提供更友好的错误消息
          let errorMessage = result.message;
          if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid')) {
            errorMessage = '邮箱或密码错误，请检查后重试';
          } else if (errorMessage.includes('Email not confirmed')) {
            errorMessage = '请先验证您的邮箱。检查收件箱中的验证邮件。';
          }
          setError(errorMessage);
        }
      }
    } catch (err) {
      setError((err as Error).message || "发生错误，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse -left-20 -top-20" />
        <div className="absolute w-80 h-80 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000 -right-20 -bottom-20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <Card className="w-full max-w-md mx-4 p-8 bg-white shadow-xl border border-gray-200 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? "注册账户" : "登录"}
          </h1>
          <p className="text-gray-600">
            {isSignUp
              ? "创建新账户以同步您的数据"
              : "登录以访问您的账户和数据"}
          </p>
        </div>



        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">
                用户名
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                required={isSignUp}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700">
              邮箱
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">
              密码
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "至少6个字符，包含数字、大写和小写字母" : "输入密码"}
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 pr-10 focus:border-blue-500 focus:ring-blue-500"
                required
                minLength={isSignUp ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {isSignUp && password && (
              <div className="text-xs text-gray-500 space-y-1">
                <div className={password.length >= 6 ? "text-green-600" : ""}>
                  {password.length >= 6 ? "✓" : "○"} 至少 6 个字符
                </div>
                <div className={/[0-9]/.test(password) ? "text-green-600" : ""}>
                  {/[0-9]/.test(password) ? "✓" : "○"} 包含数字
                </div>
                <div className={/[a-z]/.test(password) ? "text-green-600" : ""}>
                  {/[a-z]/.test(password) ? "✓" : "○"} 包含小写字母
                </div>
                <div className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                  {/[A-Z]/.test(password) ? "✓" : "○"} 包含大写字母
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-md">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-md">
              <p className="text-green-200 text-sm">{successMessage}</p>
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
              className="text-gray-600 hover:text-gray-900 text-sm underline"
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

