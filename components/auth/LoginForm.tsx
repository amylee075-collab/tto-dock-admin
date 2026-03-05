"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ORANGE = "#ff5700";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        const msg = signInError.message;
        if (msg === "Invalid login credentials") {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else if (msg.includes("Email not confirmed") || msg === "signup_not_confirmed") {
          setError("이메일 인증이 완료되지 않았습니다. Supabase 대시보드에서 사용자를 '확인됨'으로 설정하세요.");
        } else {
          setError(msg);
        }
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError("Supabase 설정을 확인해 주세요. (.env.local)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border-[3px] border-[#ff5700] bg-white p-8 shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-[#212529]" style={{ color: ORANGE }}>
          또독 관리자
        </h1>
        <p className="mt-2 text-[#212529] font-medium">관리자 계정으로 로그인하세요.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#212529] mb-1.5">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition"
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#212529] mb-1.5">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition"
            placeholder="••••••••"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: ORANGE }}
        >
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}

type Props = { needSetup: boolean };

export default function LoginForm({ needSetup }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff5f0] px-4 gap-6">
      {needSetup && (
        <div className="w-full max-w-md rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
          <p className="font-semibold">Supabase 설정이 필요합니다</p>
          <p className="mt-1">
            프로젝트 루트에 <code className="bg-amber-100 px-1 rounded">.env.local</code> 파일을 만들고{" "}
            <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 값을 추가한 뒤 개발 서버를 다시 실행하세요.
          </p>
          <a
            href="https://supabase.com/dashboard/project/_/settings/api"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[#ff5700] font-medium underline"
          >
            Supabase API 설정 →
          </a>
        </div>
      )}
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="rounded-2xl border-[3px] border-[#ff5700] bg-white p-8 shadow-sm text-center text-gray-500">
              로딩 중…
            </div>
          }
        >
          <LoginFormInner />
        </Suspense>
      </div>
    </div>
  );
}
