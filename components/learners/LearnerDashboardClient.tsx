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

type DailyPoint = { date: string; count: number; minutes: number };

type Props = {
  learnerStats: LearnerStat[];
  dailyActivity: DailyPoint[];
};

export default function LearnerDashboardClient({ learnerStats, dailyActivity }: Props) {
  const stats = learnerStats;
  const daily = dailyActivity;

  const totalReadings = stats.reduce((s, l) => s + (l.total_reading_count ?? 0), 0);
  const totalMinutes = stats.reduce((s, l) => s + (l.total_reading_minutes ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-[3px] border-[#ff5700] bg-[#fff5f0] p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">학습자 수</p>
          <p className="mt-1 text-2xl font-bold text-[#212529]">{stats.length}</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">총 읽기 횟수</p>
          <p className="mt-1 text-2xl font-bold text-[#212529]">{totalReadings}</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">총 학습 시간</p>
          <p className="mt-1 text-2xl font-bold text-[#212529]">{totalMinutes}분</p>
        </div>
        <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">기간</p>
          <p className="mt-1 text-lg font-bold text-[#212529]">{daily.length}일</p>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#212529] mb-4">일별 읽기 횟수</h2>
        <div className="h-72 w-full">
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #eee" }}
                  formatter={(value: number | undefined) => [value ?? 0, "횟수"]}
                  labelFormatter={(label) => `날짜: ${label}`}
                />
                <Bar dataKey="count" fill="#ff5700" radius={[4, 4, 0, 0]} name="읽기 횟수" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-500">일별 데이터가 없습니다. reading_activity_daily 테이블에 데이터를 넣으면 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#212529] mb-4">일별 학습 시간 (분)</h2>
        <div className="h-72 w-full">
          {daily.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #eee" }}
                  formatter={(value: number | undefined) => [value ?? 0, "분"]}
                  labelFormatter={(label) => `날짜: ${label}`}
                />
                <Line type="monotone" dataKey="minutes" stroke="#ff5700" strokeWidth={2} dot={{ fill: "#ff5700" }} name="학습 시간(분)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-500">일별 데이터가 없습니다. reading_activity_daily 테이블에 데이터를 넣으면 표시됩니다.</p>
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
              {stats.map((l) => (
                <tr key={l.id} className="border-t border-gray-100 hover:bg-orange-50/30">
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
