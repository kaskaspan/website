"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("正在验证...");

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();
      const code = searchParams.get("code");

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            setStatus("error");
            setMessage("验证失败：" + error.message);
          } else {
            setStatus("success");
            setMessage("邮箱验证成功！正在跳转...");
            
            // 3秒后跳转到登录页面
            setTimeout(() => {
              router.push("/login?verified=true");
            }, 2000);
          }
        } catch (err) {
          setStatus("error");
          setMessage("验证过程中发生错误");
        }
      } else {
        setStatus("error");
        setMessage("缺少验证代码");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="w-full max-w-md mx-4 p-8 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-white mb-2">验证中...</h1>
            <p className="text-white/70">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">验证成功！</h1>
            <p className="text-white/70 mb-6">{message}</p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
            >
              前往登录
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-white mb-2">验证失败</h1>
            <p className="text-white/70 mb-6">{message}</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
              >
                返回登录
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="inline-block px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                重试
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}




export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
