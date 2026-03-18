/**
 * Asia/Seoul 기준 날짜/주간 범위.
 * 서버(UTC) 때문에 오전 9시 전에 '오늘'이 꼬이지 않도록 모든 대시보드·API에서 사용.
 */
const TZ = "Asia/Seoul";

/** 오늘 날짜 문자열 (YYYY-MM-DD), Asia/Seoul 기준 */
export function getTodaySeoul(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** 오늘 00:00 ~ 내일 00:00 Asia/Seoul을 ISO 문자열로 (created_at 등 범위 쿼리용) */
export function getTodaySeoulStartEnd(): { start: string; end: string } {
  const today = getTodaySeoul();
  const [y, m, d] = today.split("-").map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  const tomorrowStr = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, "0")}-${String(tomorrow.getUTCDate()).padStart(2, "0")}`;
  return {
    start: `${today}T00:00:00+09:00`,
    end: `${tomorrowStr}T00:00:00+09:00`,
  };
}

/** 이번 주 월~일 범위 및 오늘, Asia/Seoul 기준 (월=0, 일=6) */
export function getThisWeekRangeSeoul(): {
  start: string;
  end: string;
  today: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const m = parseInt(parts.find((p) => p.type === "month")!.value, 10);
  const d = parseInt(parts.find((p) => p.type === "day")!.value, 10);
  const weekday = parts.find((p) => p.type === "weekday")!.value;
  const weekdayNum: number = (() => {
    const map: Record<string, number> = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6,
    };
    return map[weekday] ?? 0;
  })();
  const todayStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const mondayUTC = new Date(Date.UTC(y, m - 1, d - weekdayNum));
  const sundayUTC = new Date(Date.UTC(y, m - 1, d - weekdayNum + 6));
  const toStr = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  return {
    start: toStr(mondayUTC),
    end: toStr(sundayUTC),
    today: todayStr,
  };
}
