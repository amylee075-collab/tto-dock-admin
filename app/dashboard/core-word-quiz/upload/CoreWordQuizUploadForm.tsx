"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseCsvToObjects } from "@/lib/csv";
import { insertCoreWordQuizBulk, type CoreWordQuizRow } from "./actions";

const EXPECTED_HEADERS = ["sentence", "correct_answer", "selectable_words"];

function normalizeHeader(s: string): string {
  return s.replace(/\s/g, "").toLowerCase();
}

function parseSelectableWords(val: string): string[] {
  if (!val || typeof val !== "string") return [];
  return val
    .split(/\|/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFeedbackByWord(val: string): Record<string, string> {
  if (!val || typeof val !== "string") return {};
  const t = val.trim();
  if (!t) return {};
  try {
    const o = JSON.parse(t);
    return typeof o === "object" && o !== null ? o : {};
  } catch {
    return {};
  }
}

export default function CoreWordQuizUploadForm() {
  const router = useRouter();
  const [rows, setRows] = useState<CoreWordQuizRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    setRows(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        const parsed = parseCsvToObjects(text);
        if (parsed.length === 0) {
          setError("CSV에 데이터 행이 없습니다. 헤더: sentence, correct_answer, selectable_words (필수), feedback_by_word, sort_order (선택)");
          return;
        }
        const first = Object.keys(parsed[0]).map(normalizeHeader);
        const hasHeader = EXPECTED_HEADERS.every((h) => first.includes(h));
        if (!hasHeader) {
          setError("CSV 헤더에 sentence, correct_answer, selectable_words 컬럼이 필요합니다. 선택지는 | 로 구분하세요.");
          return;
        }
        const mapped: CoreWordQuizRow[] = parsed.map((r, idx) => {
          const rawSelectable = (r.selectable_words ?? r["selectable_words"] ?? "").trim();
          const rawFeedback = (r.feedback_by_word ?? r["feedback_by_word"] ?? "").trim();
          const rawSort = (r.sort_order ?? r["sort_order"] ?? "").trim();
          return {
            sentence: (r.sentence ?? r["문장"] ?? "").trim(),
            correct_answer: (r.correct_answer ?? r["correct_answer"] ?? r["정답"] ?? "").trim(),
            selectable_words: parseSelectableWords(rawSelectable),
            feedback_by_word: parseFeedbackByWord(rawFeedback),
            sort_order: rawSort === "" ? null : parseInt(rawSort, 10) || null,
          };
        });
        setRows(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "CSV 파싱에 실패했습니다.");
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rows || rows.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await insertCoreWordQuizBulk(rows);
      if (res.ok) {
        setResult(res.message);
        setRows(null);
        router.refresh();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6">
        <h2 className="text-lg font-bold text-[#212529] mb-2">CSV 파일로 일괄 등록</h2>
        <p className="text-sm text-gray-600 mb-4">
          필수 컬럼: <strong>sentence</strong>, <strong>correct_answer</strong>, <strong>selectable_words</strong>
          <br />
          선택지(selectable_words)는 <strong>|</strong> 로 구분 (예: 학교|마을|한 식구|공동체 의식)
          <br />
          선택: <strong>feedback_by_word</strong>(JSON), <strong>sort_order</strong>(숫자). 문장에 쉼표가 있으면 셀을 따옴표로 감싸세요.
        </p>
        <p className="text-xs text-gray-500 mb-2">
          샘플: 헤더만 있는 CSV를 만들어 sentence, correct_answer, selectable_words(선택지는 | 구분)를 채운 뒤 업로드하세요. feedback_by_word는 비우면 빈 객체로 저장됩니다.
        </p>
        <label className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-sm font-medium text-gray-700">CSV 선택:</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-[#ff5700] file:text-white file:cursor-pointer hover:file:opacity-90"
          />
        </label>
        {rows && (
          <>
            <p className="mt-4 text-sm text-gray-600">미리보기 ({rows.length}건)</p>
            <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200 max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-semibold w-12">#</th>
                    <th className="px-3 py-2 text-left font-semibold">문장 (일부)</th>
                    <th className="px-3 py-2 text-left font-semibold">정답</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 15).map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2 max-w-md truncate">{r.sentence.slice(0, 60)}…</td>
                      <td className="px-3 py-2 text-[#ff5700] font-medium">{r.correct_answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 15 && <p className="p-2 text-xs text-gray-500">… 외 {rows.length - 15}건</p>}
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-5 rounded-xl font-semibold text-white bg-[#ff5700] hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "등록 중…" : `${rows.length}건 등록하기`}
              </button>
              <button
                type="button"
                onClick={() => setRows(null)}
                className="h-11 px-5 rounded-xl font-semibold text-gray-600 border-2 border-gray-200 hover:bg-gray-50"
              >
                취소
              </button>
            </form>
          </>
        )}
      </div>
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}
      {result && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm" role="status">
          {result}
        </div>
      )}
      <Link href="/dashboard/core-word-quiz" className="inline-block text-[#ff5700] font-medium hover:underline">
        ← 목록으로
      </Link>
    </div>
  );
}
