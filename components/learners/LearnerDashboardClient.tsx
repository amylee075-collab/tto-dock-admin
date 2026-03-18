"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

type LearnerStat = {
  id: string;
  name?: string;
  email?: string;
  total_reading_count?: number;
  total_reading_minutes?: number;
  last_activity_at?: string | null;
};

type DailyPoint = {
  date: string;
  count: number;
  minutes: number;
  total_reading_count?: number;
};

type Props = {
  learnerStats: LearnerStat[];
  dailyActivity: DailyPoint[];
  todayVisitorCount: number;
  completionRate: number | null;
  dau: number;
};

export default function LearnerDashboardClient({
  learnerStats,
  dailyActivity,
  todayVisitorCount,
  completionRate,
  dau,
}: Props) {
  const stats = Array.isArray(learnerStats) ? learnerStats : [];
  const daily = Array.isArray(dailyActivity) ? dailyActivity : [];

  const totalReadings = stats.reduce((s, l) => s + (l.total_reading_count ?? 0), 0);
  const totalMinutes = stats.reduce((s, l) => s + (l.total_reading_minutes ?? 0), 0);

  const uniqueVisitors = Math.max(todayVisitorCount, 1);
  const avgReadingPerUser = Math.round((totalReadings / uniqueVisitors) * 10) / 10;
  const avgSessionDuration = Math.round((totalMinutes / uniqueVisitors) * 10) / 10;

  const dailyPerUser = daily.map((d) => {
    const visitors = d.count > 0 ? d.count : 1;
    return {
      date: d.date,
      avgReads: Math.round((d.total_reading_count ?? 0) / visitors * 10) / 10,
      avgMinutes: Math.round((d.minutes / visitors) * 10) / 10,
    };
  });

  const safeDateTick = (v: unknown) =>
    typeof v === "string" && v.length >= 5 ? v.slice(5) : String(v ?? "");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border-[3px] border-[#ff5700] bg-[#fff5f0] p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">학습자 수</p>
          <p className="mt-1 text-2xl font-bold text-[#212529]">{stats.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">인당 평균 읽기</p>
          <p className="mt-1 text-2xl font-bold text-[#212529]">
            {todayVisitorCount > 0 ? avgReadingPerUser.toLocaleString() : "—"}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">총 읽기 / 오늘 방문자</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">인당 평균 세션 시간</p>
          <p className="mt-1 text-2xl font-bold text-[#212529]">
            {todayVisitorCount > 0 ? `${avgSessionDuration}분` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">총 학습 시간 / 유니크 방문자</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">완독률</p>
          <p className="mt-1 text-2xl font-bold text-[#212529]">
            {completionRate != null ? `${completionRate}%` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">completed / started</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">DAU</p>
          <p className="mt-1 text-2xl font-bold text-[#212529]">{dau}</p>
          <p className="mt-0.5 text-xs text-gray-500">오늘 학습 로그 1건 이상</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#212529] mb-4">일별 인당 평균 읽기 횟수</h2>
        <div className="h-72 w-full">
          {dailyPerUser.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPerUser} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={safeDateTick} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #eee" }}
                  formatter={(value: number | undefined) => [value ?? 0, "인당 평균"]}
                  labelFormatter={(label) => `날짜: ${label}`}
                />
                <Bar dataKey="avgReads" fill="#ff5700" radius={[4, 4, 0, 0]} name="인당 평균 읽기" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-500">일별 데이터가 없습니다. reading_activity_daily에 count·total_reading_count를 넣으면 인당 평균 추이가 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#212529] mb-4">일별 인당 평균 학습 시간 (분)</h2>
        <div className="h-72 w-full">
          {dailyPerUser.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyPerUser} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={safeDateTick} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #eee" }}
                  formatter={(value: number | undefined) => [value ?? 0, "분"]}
                  labelFormatter={(label) => `날짜: ${label}`}
                />
                <Line type="monotone" dataKey="avgMinutes" stroke="#ff5700" strokeWidth={2} dot={{ fill: "#ff5700" }} name="인당 평균 분" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-500">일별 데이터가 없습니다. reading_activity_daily에 데이터를 넣으면 인당 평균 추이가 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#212529]">학습자 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-sm font-semibold text-gray-600">
                <th className="px-6 py-3">이름</th>
                <th className="px-6 py-3">이메일</th>
                <th className="px-6 py-3">읽기 횟수</th>
                <th className="px-6 py-3">학습 시간(분)</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((l, idx) => (
                <tr key={l?.id != null ? String(l.id) : `row-${idx}`} className="border-t border-gray-100 hover:bg-orange-50/30">
                  <td className="px-6 py-3 font-medium text-[#212529]">{l.name ?? "—"}</td>
                  <td className="px-6 py-3 text-gray-600">{l.email ?? "—"}</td>
                  <td className="px-6 py-3">{l.total_reading_count ?? 0}</td>
                  <td className="px-6 py-3">{l.total_reading_minutes ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stats.length === 0 && (
          <p className="px-6 py-8 text-center text-gray-500">Supabase에 learners, reading_activity_daily 테이블을 만들면 실제 데이터가 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}
