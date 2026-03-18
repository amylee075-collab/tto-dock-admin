"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ORANGE = "#ff5700";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?type=recovery`
          : "";
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (err) {
        setError(err.message);
        return;
      }
      setSent(true);
    } catch {
      setError("요청을 처리할 수 없습니다. 잠시 후 다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border-[3px] border-[#ff5700] bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-extrabold text-[#212529]" style={{ color: ORANGE }}>
          이메일을 확인하세요
        </h1>
        <p className="mt-4 text-[#212529]">
          <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈습니다. 이메일의 링크를 클릭하면 새
          비밀번호를 설정할 수 있습니다.
        </p>
        <p className="mt-2 text-sm text-gray-600">스팸 메일함도 확인해 주세요.</p>
        <Link
          href="/login"
          className="mt-6 inline-block h-11 px-5 rounded-xl font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: ORANGE }}
        >
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-[3px] border-[#ff5700] bg-white p-8 shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-[#212529]" style={{ color: ORANGE }}>
          비밀번호 찾기
        </h1>
        <p className="mt-2 text-[#212529] font-medium">
          가입한 이메일을 입력하면 재설정 링크를 보내드립니다.
        </p>
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
          {loading ? "전송 중…" : "재설정 링크 받기"}
        </button>
      </form>
      <p className="mt-6 text-center">
        <Link href="/login" className="text-sm font-medium text-[#ff5700] hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
