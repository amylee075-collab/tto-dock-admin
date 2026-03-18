import { NextRequest, NextResponse } from "next/server";
import { getTodaySeoul } from "@/lib/datetime";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

/**
 * 읽기 시작/완료 로그 (완독률·DAU 집계용).
 * TTO-DOCK2에서 읽기 시작 시 event_type: 'started', 완료 시 'completed' 호출하거나
 * 완료는 /api/track-activity-complete만 써도 됨.
 */
export async function POST(request: NextRequest) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 }
    );
  }

  let body: { user_key?: string; event_type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const userKey = body.user_key?.trim() ?? "anonymous";
  const eventType = body.event_type === "started" || body.event_type === "completed" ? body.event_type : null;
  if (!eventType) {
    return NextResponse.json(
      { error: "event_type must be 'started' or 'completed'" },
      { status: 400 }
    );
  }

  const today = getTodaySeoul();
  const supabase = createServiceRoleClient();

  await supabase.from("activity_logs").insert({
    user_key: userKey,
    event_date: today,
    event_type: eventType,
  });

  return NextResponse.json({ ok: true });
}
