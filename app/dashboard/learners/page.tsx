import { createClient } from "@/lib/supabase/server";
import LearnerDashboardClient from "@/components/learners/LearnerDashboardClient";
import { getTodaySeoul } from "@/lib/datetime";

export default async function LearnersPage() {
  const supabase = await createClient();
  const today = getTodaySeoul();

  let statsRows: unknown[] = [];
  let activityRows: unknown[] = [];
  let todayVisitorCount = 0;
  let completionRate: number | null = null;
  let dau = 0;
  let learnersError: string | null = null;
  let activityError: string | null = null;

  const r1 = await supabase.from("learners").select("*").limit(100);
  if (r1.error) {
    learnersError = r1.error.message;
  } else {
    statsRows = r1.data ?? [];
  }

  const r2 = await supabase
    .from("reading_activity_daily")
    .select("date, count, minutes, total_reading_count")
    .order("date", { ascending: true })
    .limit(90);
  if (r2.error) {
    activityError = r2.error.message;
  } else {
    activityRows = r2.data ?? [];
    const todayRow = (activityRows as Array<{ date: string; count: number }>).find((r) => r.date === today);
    todayVisitorCount = todayRow?.count ?? 0;
  }

  const r3 = await supabase
    .from("activity_logs")
    .select("event_type, user_key")
    .eq("event_date", today);
  if (!r3.error && r3.data) {
    const rows = r3.data as { event_type: string; user_key: string }[];
    const started = rows.filter((r) => r.event_type === "started").length;
    const completed = rows.filter((r) => r.event_type === "completed").length;
    if (started > 0) {
      completionRate = Math.round((completed / started) * 1000) / 10;
    }
    dau = new Set(rows.map((r) => r.user_key)).size;
  }

  const learnerStats = statsRows as Array<{
    id: string;
    name?: string;
    email?: string;
    total_reading_count?: number;
    total_reading_minutes?: number;
    last_activity_at?: string | null;
  }>;
  const dailyActivity = activityRows as Array<{
    date: string;
    count: number;
    minutes: number;
    total_reading_count?: number;
  }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">학습자 데이터</h1>
        <p className="mt-1 text-gray-600">학습 현황과 핵심 지표(KPI)를 확인하세요.</p>
      </div>
      {(learnersError || activityError) && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm" role="alert">
          <p className="font-medium">데이터를 불러오지 못했습니다.</p>
          {learnersError && <p className="mt-1">learners: {learnersError}</p>}
          {activityError && <p className="mt-1">reading_activity_daily: {activityError}</p>}
          <p className="mt-2 text-xs">
            Supabase에 <strong>learners</strong>, <strong>reading_activity_daily</strong> 테이블을 만들었는지 확인하세요. RLS가 켜져 있으면 &quot;정책 추가&quot; 또는 &quot;authenticated / service_role SELECT 허용&quot;이 필요합니다.
          </p>
        </div>
      )}
      <LearnerDashboardClient
        learnerStats={learnerStats}
        dailyActivity={dailyActivity}
        todayVisitorCount={todayVisitorCount}
        completionRate={completionRate}
        dau={dau}
      />
    </div>
  );
}
