import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VisitorsSummaryChart from "@/components/dashboard/VisitorsSummaryChart";
import {
  getThisWeekRangeSeoul,
  getTodaySeoulStartEnd,
} from "@/lib/datetime";

type VisitorsPoint = { date: string; count: number };

export default async function DashboardPage() {
  const supabase = await createClient();

  let contentsCount = 0;
  let todayWordsCount = 0;
  let quizCount = 0;
  let totalUsers = 0;
  let todayNewUsers = 0;
  let visitorsThisWeek: VisitorsPoint[] = [];
  let popularContents: { id: string; title: string; type?: string | null; clicks?: number; pageviews?: number; completed_count?: number }[] = [];

  const { start, end, today } = getThisWeekRangeSeoul();
  const { start: todayStart, end: todayEnd } = getTodaySeoulStartEnd();

  try {
    const [c1, c2, c3, cUsers] = await Promise.all([
      supabase.from("contents").select("*", { count: "exact", head: true }),
      supabase.from("today_words").select("*", { count: "exact", head: true }),
      supabase.from("core_word_quiz").select("*", { count: "exact", head: true }),
      supabase.from("learners").select("*", { count: "exact", head: true }),
    ]);
    contentsCount = c1.count ?? 0;
    todayWordsCount = c2.count ?? 0;
    quizCount = c3.count ?? 0;
    totalUsers = cUsers.error ? 0 : (cUsers.count ?? 0);
  } catch {
    // Supabase 미설정 또는 테이블 없음 시 0 유지
  }

  try {
    const { data, error } = await supabase
      .from("reading_activity_daily")
      .select("date, count")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });
    if (!error && data) {
      visitorsThisWeek = (data as { date: string; count: number }[]).map((d) => ({
        date: d.date,
        count: d.count ?? 0,
      }));
    }
  } catch {
    // 테이블 없으면 빈 배열 유지
  }

  try {
    // created_at이 있는 경우에만 오늘 신규 회원 수 집계 (Asia/Seoul 기준 오늘)
    const { count, error } = await supabase
      .from("learners")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart)
      .lt("created_at", todayEnd);
    if (!error && typeof count === "number") {
      todayNewUsers = count;
    }
  } catch {
    // created_at 컬럼이 없으면 무시
  }

  try {
    const { data: statsRows } = await supabase
      .from("content_stats")
      .select("content_id, clicks, pageviews, completed_count")
      .eq("stat_date", today)
      .order("completed_count", { ascending: false })
      .limit(5);
    if (statsRows && statsRows.length > 0) {
      const ids = (statsRows as { content_id: string }[]).map((r) => r.content_id);
      const { data: contentsRows } = await supabase
        .from("contents")
        .select("id, title, type")
        .in("id", ids);
      if (contentsRows && contentsRows.length > 0) {
        const byId = new Map(contentsRows.map((c: { id: string }) => [c.id, c]));
        popularContents = statsRows.map((s: { content_id: string; clicks?: number; pageviews?: number; completed_count?: number }) => {
          const c = byId.get(s.content_id) as { id: string; title: string; type?: string | null } | undefined;
          return c
            ? { ...c, clicks: s.clicks ?? 0, pageviews: s.pageviews ?? 0, completed_count: s.completed_count ?? 0 }
            : { id: s.content_id, title: "(삭제된 콘텐츠)", clicks: s.clicks ?? 0, pageviews: s.pageviews ?? 0, completed_count: s.completed_count ?? 0 };
        });
      }
    }
    if (popularContents.length === 0) {
      const { data, error } = await supabase
        .from("contents")
        .select("id, title, type")
        .order("updated_at", { ascending: false })
        .limit(5);
      if (!error && data) {
        popularContents = data as { id: string; title: string; type?: string | null }[];
      }
    }
  } catch {
    // 테이블 없으면 빈 목록 유지
  }

  const totalVisitsWeek = visitorsThisWeek.reduce((sum, d) => sum + (d.count ?? 0), 0);
  const todayVisitors =
    visitorsThisWeek.find((d) => d.date === today)?.count ?? 0;
  const avgVisitors =
    visitorsThisWeek.length > 0
      ? Math.round(totalVisitsWeek / visitorsThisWeek.length)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">대시보드</h1>
        <p className="mt-1 text-gray-600">
          주요 콘텐츠 현황, 방문자 요약, 이용자 통계를 한눈에 확인하세요.
        </p>
      </div>

      {/* 1줄: 콘텐츠 관리 현황 3개 카드 */}
      <section aria-labelledby="content-summary-heading">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2
            id="content-summary-heading"
            className="text-lg font-bold text-[#212529]"
          >
            콘텐츠 관리 현황
          </h2>
          <div className="hidden sm:flex gap-2 text-xs text-gray-500">
            <span>콘텐츠 · 오늘의 단어 · 문해력 기초 훈련</span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/contents"
            className="rounded-2xl border-[3px] border-[#ff5700] bg-[#fff5f0] p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-600">
                읽기 콘텐츠 현황
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#212529]">
                {contentsCount.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  건
                </span>
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              짧은 글·긴 글·분야별·디지털 콘텐츠 전체 개수입니다.
            </p>
          </Link>

          <Link
            href="/dashboard/today-words"
            className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-600">
                오늘의 단어 콘텐츠 현황
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#212529]">
                {todayWordsCount.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  건
                </span>
                <span className="text-xs font-normal text-gray-400 ml-1">(기준 50건)</span>
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              메인 화면 &quot;오늘의 단어&quot;에 노출되는 단어 수입니다. 마이그레이션 기준 50건입니다.
            </p>
            {todayWordsCount > 50 && (
              <p className="mt-1 text-xs text-amber-600">
                50건을 초과하면 중복 등록일 수 있습니다. today_words 테이블에 word 유일 제약을 추가한 뒤 마이그레이션을 다시 실행하세요.
              </p>
            )}
          </Link>

          <Link
            href="/dashboard/core-word-quiz"
            className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-600">
                문해력 기초 훈련 콘텐츠 현황
              </p>
              <p className="mt-2 text-3xl font-extrabold text-[#212529]">
                {quizCount.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  건
                </span>
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              핵심 단어 찾기 퀴즈 문항 개수입니다.
            </p>
          </Link>
        </div>
      </section>

      {/* 2줄: 방문자 요약 섹션 */}
      <section aria-labelledby="visitors-summary-heading">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2
            id="visitors-summary-heading"
            className="text-lg font-bold text-[#212529]"
          >
            방문자 요약 (이번 주 월–일)
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
            <VisitorsSummaryChart data={visitorsThisWeek} />
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-600">
                오늘 신규 회원
              </p>
              <p className="mt-2 text-2xl font-bold text-[#212529]">
                {todayNewUsers.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  명
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                learners 테이블의 created_at 기준입니다.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-600">
                오늘 방문자
              </p>
              <p className="mt-2 text-2xl font-bold text-[#212529]">
                {todayVisitors.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  명
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                reading_activity_daily.count 중 오늘 날짜 집계입니다.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-600">
                주간 평균 방문자
              </p>
              <p className="mt-2 text-2xl font-bold text-[#212529]">
                {avgVisitors.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  명
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                이번 주 월–일 방문자 수의 평균입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3줄: 사용자 요약 섹션 */}
      <section aria-labelledby="users-summary-heading">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2
            id="users-summary-heading"
            className="text-lg font-bold text-[#212529]"
          >
            사용자 요약
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div className="rounded-2xl border-[3px] border-[#ff5700] bg-[#fff5f0] p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 이용자</p>
              <p className="mt-3 text-4xl font-extrabold text-[#212529]">
                {totalUsers.toLocaleString()}{" "}
                <span className="text-sm font-semibold text-gray-500">
                  명
                </span>
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-600">
              learners 테이블의 전체 행 수입니다. 학습자 대시보드에서 더
              자세한 정보를 확인할 수 있습니다.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/learners"
                className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-sm font-semibold text-[#ff5700] bg-white hover:bg-orange-50 border border-[#ff5700]/40 transition"
              >
                학습자 데이터 보러가기
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#212529]">
                  오늘 인기 콘텐츠
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  클릭수·페이지뷰 통계 테이블이 없다면 최근 수정 기준으로
                  노출됩니다.
                </p>
              </div>
              <Link
                href="/dashboard/contents"
                className="text-xs font-medium text-[#ff5700] hover:underline"
              >
                콘텐츠 관리
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {popularContents.length === 0 && (
                <p className="px-5 py-6 text-sm text-gray-500">
                  인기 콘텐츠 데이터가 없습니다. Supabase에 contents 테이블을
                  만들고 콘텐츠를 등록하면 최근 수정 기준으로 표시됩니다.
                </p>
              )}
              {popularContents.map((item, index) => (
                <div
                  key={item.id}
                  className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-orange-50/40 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 text-xs font-semibold text-gray-400">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#212529] truncate">
                        {item.title}
                      </p>
                      {item.type && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          유형: {item.type}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-gray-400">
                      클릭 / 조회 / 완료
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.clicks != null && item.pageviews != null
                        ? `${item.clicks.toLocaleString()} / ${item.pageviews.toLocaleString()}${item.completed_count != null ? ` / ${item.completed_count.toLocaleString()}` : ""}`
                        : "연동 대기"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

