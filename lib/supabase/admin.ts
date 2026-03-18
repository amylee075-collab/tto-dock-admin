import { createClient } from "@supabase/supabase-js";

/**
 * RLS를 우회하는 서버 전용 클라이언트.
 * 방문자 추적(visitor_logs, reading_activity_daily), 활동 완료(content_stats) 등
 * API 라우트에서만 사용하고, 환경 변수 SUPABASE_SERVICE_ROLE_KEY 필요.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase 서비스 역할 키가 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 추가하세요."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}
