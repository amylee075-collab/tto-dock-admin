import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TodayWord } from "@/lib/types";

export default async function TodayWordsPage() {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("today_words")
    .select("*")
    .order("created_at", { ascending: false });

  const words = (rows ?? []) as TodayWord[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#212529]">오늘의 단어</h1>
          <p className="mt-1 text-gray-600">메인 화면 &#39;오늘의 단어&#39;에 노출되는 단어 목록입니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/today-words/upload"
            className="inline-flex items-center justify-center h-12 px-5 rounded-xl font-semibold text-[#ff5700] border-2 border-[#ff5700] bg-white hover:bg-orange-50 transition"
          >
            CSV 일괄 업로드
          </Link>
          <Link
            href="/dashboard/today-words/new"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#ff5700" }}
          >
            + 단어 추가
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800">
          <p className="font-medium">today_words 테이블이 없습니다.</p>
          <p className="text-sm mt-1">Supabase에 today_words 테이블을 만들어 주세요. (id, word, meaning, example, type, created_at)</p>
        </div>
      )}

      {!error && words.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">등록된 단어가 없습니다.</p>
          <Link href="/dashboard/today-words/new" className="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-xl font-medium text-[#ff5700] hover:bg-orange-50 transition">
            첫 단어 추가하기
          </Link>
        </div>
      )}

      {!error && words.length > 0 && (
        <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-sm font-semibold text-gray-600 border-b border-gray-100">
                <th className="px-6 py-3">단어</th>
                <th className="px-6 py-3">유형</th>
                <th className="px-6 py-3">뜻</th>
                <th className="px-6 py-3 w-20">관리</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w) => (
                <tr key={w.id} className="border-b border-gray-100 hover:bg-orange-50/30">
                  <td className="px-6 py-3 font-bold text-[#212529]">{w.word}</td>
                  <td className="px-6 py-3 text-gray-600">{w.type}</td>
                  <td className="px-6 py-3 text-gray-600 max-w-md truncate">{w.meaning}</td>
                  <td className="px-6 py-3">
                    <Link href={`/dashboard/today-words/${w.id}/edit`} className="text-[#ff5700] font-medium hover:underline">
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
