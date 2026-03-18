import { NextRequest, NextResponse } from "next/server";
import { getTodaySeoul } from "@/lib/datetime";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

/**
 * 읽기 활동 완료 시 호출: content_stats의 completed_count를 1 증가 (오늘, Asia/Seoul 기준).
 * TTO-DOCK2 Result 페이지 도달 시 이 API를 호출하면 됨.
 */
export async function POST(request: NextRequest) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 }
    );
  }

  let body: { content_id?: string; user_key?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const contentId = body.content_id?.trim();
  if (!contentId) {
    return NextResponse.json(
      { error: "content_id required" },
      { status: 400 }
    );
  }

  const userKey = body.user_key?.trim() ?? "anonymous";
  const today = getTodaySeoul();
  const supabase = createServiceRoleClient();

  const { data: existing } = await supabase
    .from("content_stats")
    .select("content_id, stat_date, completed_count, clicks, pageviews")
    .eq("content_id", contentId)
    .eq("stat_date", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("content_stats")
      .update({
        completed_count: (existing.completed_count ?? 0) + 1,
      })
      .eq("content_id", contentId)
      .eq("stat_date", today);
  } else {
    await supabase.from("content_stats").insert({
      content_id: contentId,
      stat_date: today,
      clicks: 0,
      pageviews: 0,
      completed_count: 1,
    });
  }

  await supabase.from("activity_logs").insert({
    user_key: userKey,
    event_date: today,
    event_type: "completed",
  });

  const { data: dailyRow } = await supabase
    .from("reading_activity_daily")
    .select("date, total_reading_count")
    .eq("date", today)
    .maybeSingle();

  if (dailyRow) {
    await supabase
      .from("reading_activity_daily")
      .update({
        total_reading_count: (dailyRow.total_reading_count ?? 0) + 1,
      })
      .eq("date", today);
  } else {
    await supabase.from("reading_activity_daily").insert({
      date: today,
      count: 0,
      minutes: 0,
      total_reading_count: 1,
    });
  }

  return NextResponse.json({ ok: true });
}
