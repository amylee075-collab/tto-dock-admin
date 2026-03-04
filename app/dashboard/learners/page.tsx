import { createClient } from "@/lib/supabase/server";
import LearnerDashboardClient from "@/components/learners/LearnerDashboardClient";

export default async function LearnersPage() {
  const supabase = await createClient();

  let statsRows: unknown[] = [];
  let activityRows: unknown[] = [];
  try {
    const r1 = await supabase.from("learners").select("*").limit(100);
    if (!r1.error) statsRows = r1.data ?? [];
    const r2 = await supabase
      .from("reading_activity_daily")
      .select("date, count, minutes")
      .order("date", { ascending: true })
      .limit(90);
    if (!r2.error) activityRows = r2.data ?? [];
  } catch {
    // 테이블 없음 시 빈 배열 유지
  }

  const learnerStats = statsRows as Array<{
    id: string;
    name?: string;
    email?: string;
    total_reading_count?: number;
    total_reading_minutes?: number;
    last_activity_at?: string | null;
  }>;
  const dailyActivity = activityRows as Array<{ date: string; count: number; minutes: number }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#212529]">학습자 데이터</h1>
        <p className="mt-1 text-gray-600">학습 현황과 활동 추이를 확인하세요.</p>
      </div>
      <LearnerDashboardClient
        learnerStats={learnerStats}
        dailyActivity={dailyActivity}
      />
    </div>
  );
}
