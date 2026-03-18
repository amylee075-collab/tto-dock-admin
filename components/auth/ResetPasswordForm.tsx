"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ORANGE = "#ff5700";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      setError("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border-[3px] border-[#ff5700] bg-white p-8 shadow-sm text-center">
        <p className="text-lg font-semibold text-[#212529]">비밀번호가 변경되었습니다.</p>
        <p className="mt-2 text-sm text-gray-600">대시보드로 이동합니다…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-[3px] border-[#ff5700] bg-white p-8 shadow-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold text-[#212529]" style={{ color: ORANGE }}>
          비밀번호 재설정
        </h1>
        <p className="mt-2 text-[#212529] font-medium">새 비밀번호를 입력하세요.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#212529] mb-1.5">
            새 비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition"
            placeholder="8자 이상"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-semibold text-[#212529] mb-1.5">
            비밀번호 확인
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition"
            placeholder="다시 입력"
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
          {loading ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
