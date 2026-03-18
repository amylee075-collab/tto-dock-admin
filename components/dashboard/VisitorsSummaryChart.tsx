"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { date: string; count: number };

type Props = {
  data: Point[];
};

export default function VisitorsSummaryChart({ data }: Props) {
  const raw = Array.isArray(data) ? data : [];
  const items: Point[] = raw.map((p) => ({
    date: typeof p?.date === "string" && p.date.length >= 5 ? p.date.slice(5, 10) : String(p?.date ?? ""),
    count: typeof p?.count === "number" ? p.count : 0,
  }));

  if (items.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100">
        <p className="text-sm text-gray-500">이번 주 방문자 데이터가 없습니다. reading_activity_daily 테이블에 데이터를 넣으면 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={items}
          margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
        >
          <defs>
            <linearGradient id="visitorsColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff5700" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#ff5700" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            width={30}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #eee",
              fontSize: 12,
            }}
            formatter={(value: number | undefined) => [
              value ?? 0,
              "방문자 수",
            ]}
            labelFormatter={(label) => `날짜: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#ff5700"
            strokeWidth={2}
            fill="url(#visitorsColor)"
            name="방문자 수"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

