import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CoreWordQuizItem } from "@/lib/types";

export default async function CoreWordQuizPage() {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("core_word_quiz")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const items = (rows ?? []) as CoreWordQuizItem[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#212529]">문해력 기초 훈련</h1>
          <p className="mt-1 text-gray-600">핵심 단어 찾기 퀴즈 문항을 관리합니다. (TTO-DOCK2 /practice/core-word)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/core-word-quiz/upload"
            className="inline-flex items-center justify-center h-12 px-5 rounded-xl font-semibold text-[#ff5700] border-2 border-[#ff5700] bg-white hover:bg-orange-50 transition"
          >
            CSV 일괄 업로드
          </Link>
          <Link
            href="/dashboard/core-word-quiz/new"
            className="inline-flex items-center justify-center h-12 px-6 rounded-xl font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#ff5700" }}
          >
            + 문항 추가
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800">
          <p className="font-medium">core_word_quiz 테이블이 없습니다.</p>
          <p className="text-sm mt-1">Supabase에 core_word_quiz 테이블을 만들어 주세요.</p>
        </div>
      )}

      {!error && items.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600">등록된 퀴즈 문항이 없습니다.</p>
          <Link href="/dashboard/core-word-quiz/new" className="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-xl font-medium text-[#ff5700] hover:bg-orange-50 transition">
            첫 문항 추가하기
          </Link>
        </div>
      )}

      {!error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border-2 border-gray-100 bg-white p-5 hover:border-[#ff5700]/30 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-400">#{index + 1}</span>
                  <p className="mt-1 text-[#212529] font-medium line-clamp-2">{item.sentence}</p>
                  <p className="mt-1 text-sm text-[#ff5700] font-semibold">정답: {item.correct_answer}</p>
                </div>
                <Link
                  href={`/dashboard/core-word-quiz/${item.id}/edit`}
                  className="shrink-0 h-10 px-4 rounded-xl font-medium text-[#ff5700] border-2 border-[#ff5700]/30 hover:bg-orange-50 transition inline-flex items-center"
                >
                  수정
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
