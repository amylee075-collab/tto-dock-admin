"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPES = ["순우리말", "한자어", "외래어"] as const;
type WordType = (typeof TYPES)[number];

type Props = {
  id?: string;
  initialWord?: string;
  initialMeaning?: string;
  initialExample?: string;
  initialType?: string;
};

export default function TodayWordForm({
  id,
  initialWord = "",
  initialMeaning = "",
  initialExample = "",
  initialType = "순우리말",
}: Props) {
  const router = useRouter();
  const [word, setWord] = useState(initialWord);
  const [meaning, setMeaning] = useState(initialMeaning);
  const [example, setExample] = useState(initialExample);
  const [type, setType] = useState<WordType>(
    TYPES.includes(initialType as WordType) ? (initialType as WordType) : "순우리말"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const payload = { word: word.trim(), meaning: meaning.trim(), example: example.trim(), type };

    try {
      if (id) {
        const { error: updateError } = await supabase.from("today_words").update(payload).eq("id", id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("today_words").insert(payload);
        if (insertError) throw insertError;
      }
      router.push("/dashboard/today-words");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 space-y-5">
        <div>
          <label htmlFor="word" className="block text-sm font-semibold text-[#212529] mb-1.5">단어</label>
          <input
            id="word"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition"
            placeholder="예: 꾸준히"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-semibold text-[#212529] mb-1.5">유형</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as WordType)}
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] outline-none transition"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="meaning" className="block text-sm font-semibold text-[#212529] mb-1.5">뜻</label>
          <input
            id="meaning"
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition"
            placeholder="예: 잠시도 쉬지 않고 계속"
          />
        </div>
        <div>
          <label htmlFor="example" className="block text-sm font-semibold text-[#212529] mb-1.5">예문</label>
          <textarea
            id="example"
            value={example}
            onChange={(e) => setExample(e.target.value)}
            required
            rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition resize-none"
            placeholder="예: 꾸준히 연습하면 실력이 늘어요."
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2" role="alert">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="h-12 px-6 rounded-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#ff5700" }}
        >
          {loading ? "저장 중…" : id ? "수정하기" : "등록하기"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="h-12 px-6 rounded-xl font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50 transition"
        >
          취소
        </button>
      </div>
    </form>
  );
}
