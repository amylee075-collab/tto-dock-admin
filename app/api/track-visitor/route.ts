import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getTodaySeoul } from "@/lib/datetime";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

/**
 * 방문자 추적: IP + User-Agent로 visitor_id 생성 후 visitor_logs에 기록.
 * 동일 visitor_id로 오늘 이미 접속한 경우 reading_activity_daily.count는 증가시키지 않음.
 * Asia/Seoul 기준 '오늘' 사용.
 */
export async function POST(request: NextRequest) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const ip =
    request.headers.get("x-visitor-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const ua = request.headers.get("user-agent") ?? "";
  const raw = `${ip}|${ua}`;
  const visitorId = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "salt")
    .update(raw)
    .digest("hex");

  const today = getTodaySeoul();
  const supabase = createServiceRoleClient();

  const { data: inserted } = await supabase
    .from("visitor_logs")
    .insert({ visitor_id: visitorId, visit_date: today })
    .select("id")
    .maybeSingle();

  if (inserted?.id) {
    const { data: existing } = await supabase
      .from("reading_activity_daily")
      .select("date, count, minutes")
      .eq("date", today)
      .maybeSingle();
    if (existing) {
      await supabase
        .from("reading_activity_daily")
        .update({
          count: (existing.count ?? 0) + 1,
        })
        .eq("date", today);
    } else {
      await supabase.from("reading_activity_daily").insert({
        date: today,
        count: 1,
        minutes: 0,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
