"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseCsvToObjects } from "@/lib/csv";
import { insertTodayWordsBulk, type TodayWordRow } from "./actions";

const TYPES = ["순우리말", "한자어", "외래어"];
const EXPECTED_HEADERS = ["word", "meaning", "example", "type"];

function normalizeHeader(s: string): string {
  return s.replace(/\s/g, "").toLowerCase();
}

export default function TodayWordsUploadForm() {
  const router = useRouter();
  const [rows, setRows] = useState<TodayWordRow[] | null>(null);
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
          setError("CSV에 데이터 행이 없습니다. 첫 줄은 헤더(word,meaning,example,type)여야 합니다.");
          return;
        }
        const first = Object.keys(parsed[0]).map(normalizeHeader);
        const hasHeader = EXPECTED_HEADERS.every((h) => first.includes(h));
        if (!hasHeader) {
          setError("CSV 헤더에 word, meaning, example, type 컬럼이 필요합니다.");
          return;
        }
        const mapped: TodayWordRow[] = parsed.map((r) => ({
          word: (r.word ?? r["단어"] ?? "").trim(),
          meaning: (r.meaning ?? r["뜻"] ?? "").trim(),
          example: (r.example ?? r["예문"] ?? "").trim(),
          type: (r.type ?? r["유형"] ?? "순우리말").trim(),
        }));
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
      const res = await insertTodayWordsBulk(rows);
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
          첫 줄은 헤더로 사용됩니다. 컬럼: <strong>word</strong>, <strong>meaning</strong>, <strong>example</strong>, <strong>type</strong>
          <br />
          type은 &quot;순우리말&quot;, &quot;한자어&quot;, &quot;외래어&quot; 중 하나입니다. (엑셀에서 CSV로 저장 시 UTF-8 선택 권장)
        </p>
        <a
          href="data:text/csv;charset=utf-8,%EF%BB%BFword%2Cmeaning%2Cexample%2Ctype%0A%EA%BE%B8%EC%A4%80%ED%9E%88%2C%EC%9E%A0%EC%8B%9C%EB%8F%84%20%EC%89%AC%EC%A7%80%20%EC%95%8A%EA%B3%A0%20%EA%B3%84%EC%86%8D%2C%EA%BE%B8%EC%A4%80%ED%9E%88%20%EC%97%B0%EC%8A%B5%ED%95%98%EB%A9%B4%20%EC%8B%A4%EB%A0%A5%EC%9D%B4%20%EB%8A%98%EC%96%B4%EC%9A%94.%2C%EC%88%9C%EC%9A%B0%EB%A6%AC%EB%A7%90"
          download="today-words-sample.csv"
          className="text-sm text-[#ff5700] font-medium hover:underline mb-2 inline-block"
        >
          샘플 CSV 다운로드
        </a>
        <br />
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
                    <th className="px-3 py-2 text-left font-semibold">word</th>
                    <th className="px-3 py-2 text-left font-semibold">type</th>
                    <th className="px-3 py-2 text-left font-semibold">meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="px-3 py-2">{r.word}</td>
                      <td className="px-3 py-2">{r.type}</td>
                      <td className="px-3 py-2 max-w-xs truncate">{r.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 20 && <p className="p-2 text-xs text-gray-500">… 외 {rows.length - 20}건</p>}
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
      <Link href="/dashboard/today-words" className="inline-block text-[#ff5700] font-medium hover:underline">
        ← 목록으로
      </Link>
    </div>
  );
}
