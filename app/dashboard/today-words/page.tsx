import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { TodayWord } from "@/lib/types";

const PAGE_SIZE = 50;

type PageProps = { searchParams?: Promise<{ page?: string }> };

export default async function TodayWordsPage(props: PageProps) {
  const searchParams = await (props.searchParams ?? Promise.resolve({}));
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  const [{ count }, { data: rows, error }] = await Promise.all([
    supabase.from("today_words").select("*", { count: "exact", head: true }),
    supabase
      .from("today_words")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to),
  ]);

  const total = count ?? 0;
  const words = (rows ?? []) as TodayWord[];
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showPagination = total > PAGE_SIZE;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#212529]">오늘의 단어</h1>
          <p className="mt-1 text-gray-600">메인 화면 &apos;오늘의 단어&apos;에 노출되는 단어 목록입니다.</p>
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
        <>
          <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-hidden">
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full text-left border-collapse" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "4%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "33%" }} />
                  <col style={{ width: "33%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-gray-50 text-sm font-semibold text-gray-600 border-b-2 border-gray-200 shadow-sm">
                  <tr>
                    <th className="px-3 py-3 text-center">NO.</th>
                    <th className="px-3 py-3">단어</th>
                    <th className="px-3 py-3">유형</th>
                    <th className="px-3 py-3">뜻</th>
                    <th className="px-3 py-3">예문</th>
                    <th className="px-3 py-3 text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((w, i) => {
                    const no = from + i + 1;
                    return (
                      <tr key={w.id} className="border-b border-gray-100 hover:bg-orange-50/30 align-top">
                        <td className="px-3 py-3 text-center text-gray-500 text-sm tabular-nums">{no}</td>
                        <td className="px-3 py-3 font-bold text-[#212529] break-words leading-relaxed" style={{ wordBreak: "keep-all" }}>
                          {w.word}
                        </td>
                        <td className="px-3 py-3 text-gray-600 break-words leading-relaxed" style={{ wordBreak: "keep-all" }}>
                          {w.type}
                        </td>
                        <td className="px-3 py-3 text-gray-600 break-words leading-relaxed whitespace-normal" style={{ wordBreak: "keep-all" }}>
                          {w.meaning}
                        </td>
                        <td className="px-3 py-3 text-gray-600 break-words leading-relaxed whitespace-normal" style={{ wordBreak: "keep-all" }}>
                          {w.example ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <Link href={`/dashboard/today-words/${w.id}/edit`} className="text-[#ff5700] font-medium hover:underline">
                            수정
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {showPagination && (
            <nav className="flex items-center justify-center gap-2 py-4" aria-label="페이지 내비게이션">
              {page > 1 ? (
                <Link
                  href={`?page=${page - 1}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                  aria-label="이전 페이지"
                >
                  &lt;
                </Link>
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400 cursor-not-allowed" aria-hidden>
                  &lt;
                </span>
              )}
              <div className="flex items-center gap-1 mx-2 flex-wrap justify-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`?page=${p}`}
                    className={`inline-flex h-10 min-w-10 px-3 items-center justify-center rounded-xl font-semibold transition ${
                      p === page
                        ? "bg-[#ff5700] text-white border-2 border-[#ff5700]"
                        : "border-2 border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-[#ff5700]/50"
                    }`}
                    aria-current={p === page ? "page" : undefined}
                  >
                    {p}
                  </Link>
                ))}
              </div>
              {page < totalPages ? (
                <Link
                  href={`?page=${page + 1}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                  aria-label="다음 페이지"
                >
                  &gt;
                </Link>
              ) : (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-400 cursor-not-allowed" aria-hidden>
                  &gt;
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
