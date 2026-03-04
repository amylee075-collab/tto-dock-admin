"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  id?: string;
  initialSentence?: string;
  initialCorrectAnswer?: string;
  initialSelectableWords?: string[];
  initialFeedbackByWord?: Record<string, string>;
  initialSortOrder?: number | null;
};

function parseSelectableWords(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFeedbackByWord(value: string): Record<string, string> {
  try {
    const o = JSON.parse(value || "{}");
    if (typeof o !== "object" || o === null) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof k === "string" && v != null) out[k] = String(v);
    }
    return out;
  } catch {
    return {};
  }
}

export default function CoreWordQuizForm({
  id,
  initialSentence = "",
  initialCorrectAnswer = "",
  initialSelectableWords = [],
  initialFeedbackByWord = {},
  initialSortOrder = null,
}: Props) {
  const router = useRouter();
  const [sentence, setSentence] = useState(initialSentence);
  const [correctAnswer, setCorrectAnswer] = useState(initialCorrectAnswer);
  const [selectableWordsText, setSelectableWordsText] = useState(
    initialSelectableWords.join("\n")
  );
  const [feedbackByWordText, setFeedbackByWordText] = useState(
    JSON.stringify(initialFeedbackByWord, null, 2)
  );
  const [sortOrder, setSortOrder] = useState(initialSortOrder ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const selectable_words = parseSelectableWords(selectableWordsText);
    const feedback_by_word = parseFeedbackByWord(feedbackByWordText);

    // jsonb 컬럼에는 반드시 배열/객체만 전달 (타입이 string[] / Record<string, string> 이어야 함)
    const safeSelectable = Array.isArray(selectable_words)
      ? selectable_words.map((s) => (typeof s === "string" ? s : String(s)))
      : [];
    const payload = {
      sentence: sentence.trim(),
      correct_answer: correctAnswer.trim(),
      selectable_words: safeSelectable,
      feedback_by_word: feedback_by_word && typeof feedback_by_word === "object" ? feedback_by_word : {},
      sort_order: sortOrder === "" || sortOrder == null ? null : parseInt(String(sortOrder), 10),
    };

    try {
      if (id) {
        const { error: updateError } = await supabase.from("core_word_quiz").update(payload).eq("id", id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("core_word_quiz").insert(payload);
        if (insertError) throw insertError;
      }
      router.push("/dashboard/core-word-quiz");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 space-y-5">
        <div>
          <label htmlFor="sentence" className="block text-sm font-semibold text-[#212529] mb-1.5">문장 (핵심 단어가 설명되는 문장)</label>
          <textarea
            id="sentence"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition resize-y"
            placeholder="예: 우리는 학교나 마을에서 여러 사람과 어울려 살아가는데, 이때 서로를 한 식구처럼 아끼고 돕는 마음가짐을 공동체 의식이라고 부릅니다."
          />
        </div>
        <div>
          <label htmlFor="correct_answer" className="block text-sm font-semibold text-[#212529] mb-1.5">정답 (핵심 단어)</label>
          <input
            id="correct_answer"
            type="text"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            required
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition"
            placeholder="예: 공동체 의식"
          />
        </div>
        <div>
          <label htmlFor="selectable_words" className="block text-sm font-semibold text-[#212529] mb-1.5">선택지 (한 줄에 하나, 또는 쉼표 구분)</label>
          <textarea
            id="selectable_words"
            value={selectableWordsText}
            onChange={(e) => setSelectableWordsText(e.target.value)}
            required
            rows={5}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition font-mono text-sm"
            placeholder="학교&#10;마을&#10;한 식구&#10;공동체 의식"
          />
        </div>
        <div>
          <label htmlFor="feedback_by_word" className="block text-sm font-semibold text-[#212529] mb-1.5">단어별 피드백 (JSON: 단어 → 말풍선 메시지)</label>
          <textarea
            id="feedback_by_word"
            value={feedbackByWordText}
            onChange={(e) => setFeedbackByWordText(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] focus:ring-2 focus:ring-[#ff5700]/20 outline-none transition font-mono text-sm"
            placeholder='{"공동체 의식": "정답이야!", "학교": "장소를 나타내는 말이에요."}'
          />
        </div>
        <div>
          <label htmlFor="sort_order" className="block text-sm font-semibold text-[#212529] mb-1.5">출제 순서 (숫자, 비우면 자동)</label>
          <input
            id="sort_order"
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-32 h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-[#ff5700] outline-none transition"
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
