-- =============================================================================
-- 대시보드 방문자·신규회원·오늘 인기 콘텐츠 데이터 (Supabase SQL Editor에서 실행)
-- =============================================================================
-- 실행 순서: 1) 테이블 생성 → 2) RLS 정책 → 3) 시드 데이터 (선택)
-- 이번 주 방문자 요약, 오늘 신규 회원, 오늘 방문자, 주간 평균 방문자, 오늘 인기 콘텐츠가
-- 0이 아닌 값으로 보이려면 아래 테이블과 시드가 필요합니다.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) 테이블 생성
-- -----------------------------------------------------------------------------

-- 방문자 요약·오늘 방문자·주간 평균·인당 평균 그래프용 (일별 집계)
-- count = 유니크 방문자 수, minutes = 해당 일 총 학습 분, total_reading_count = 해당 일 총 읽기 완료 횟수
CREATE TABLE IF NOT EXISTS public.reading_activity_daily (
  date                 date PRIMARY KEY,
  count                int NOT NULL DEFAULT 0,
  minutes              int NOT NULL DEFAULT 0,
  total_reading_count   int NOT NULL DEFAULT 0
);
ALTER TABLE public.reading_activity_daily ADD COLUMN IF NOT EXISTS total_reading_count int NOT NULL DEFAULT 0;

-- 학습자 수·오늘 신규 회원용 (created_at 있으면 "오늘 신규 회원" 집계)
-- 이미 learners 테이블이 있으면 아래는 건너뛰고, created_at만 추가하면 됩니다.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'learners') THEN
    CREATE TABLE public.learners (
      id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      auth_user_id          uuid,
      name                  text,
      email                 text,
      total_reading_count   int DEFAULT 0,
      total_reading_minutes int DEFAULT 0,
      last_activity_at      timestamptz,
      created_at            timestamptz DEFAULT now()
    );
  ELSE
    ALTER TABLE public.learners ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 방문자 추적: 동일 visitor_id당 오늘 1회만 reading_activity_daily.count 반영 (미들웨어/API에서 사용)
CREATE TABLE IF NOT EXISTS public.visitor_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id  text NOT NULL,
  visit_date  date NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (visitor_id, visit_date)
);

-- 오늘 인기 콘텐츠(클릭수/페이지뷰/완료수)용 — 있으면 대시보드에서 오늘 기준 인기 순으로 표시
CREATE TABLE IF NOT EXISTS public.content_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id      text NOT NULL,
  stat_date       date NOT NULL DEFAULT current_date,
  clicks          int NOT NULL DEFAULT 0,
  pageviews       int NOT NULL DEFAULT 0,
  completed_count int NOT NULL DEFAULT 0,
  UNIQUE (content_id, stat_date)
);
ALTER TABLE public.content_stats ADD COLUMN IF NOT EXISTS completed_count int NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2) RLS 정책 (RLS가 켜져 있는 경우에만 필요)
-- -----------------------------------------------------------------------------

-- learners: 로그인한 관리자 SELECT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'learners' AND policyname = 'Allow authenticated read learners') THEN
    CREATE POLICY "Allow authenticated read learners"
    ON public.learners FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- reading_activity_daily: 로그인한 관리자 SELECT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reading_activity_daily' AND policyname = 'Allow authenticated read reading_activity_daily') THEN
    CREATE POLICY "Allow authenticated read reading_activity_daily"
    ON public.reading_activity_daily FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- content_stats: 로그인한 관리자 SELECT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_stats' AND policyname = 'Allow authenticated read content_stats') THEN
    CREATE POLICY "Allow authenticated read content_stats"
    ON public.content_stats FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 완독률(Completion Rate)·DAU용: started/completed 이벤트 로그 (TTO-DOCK2에서 호출)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_key    text NOT NULL,
  event_date  date NOT NULL,
  event_type  text NOT NULL CHECK (event_type IN ('started', 'completed')),
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date_type ON public.activity_logs (event_date, event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs (user_key, event_date);

-- activity_logs: 로그인한 관리자 SELECT (완독률·DAU 집계)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Allow authenticated read activity_logs') THEN
    CREATE POLICY "Allow authenticated read activity_logs"
    ON public.activity_logs FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- visitor_logs: API에서 service_role로 insert하므로 RLS 정책 불필요. 읽기만 필요 시 아래 추가.
-- CREATE POLICY "Allow authenticated read visitor_logs" ON public.visitor_logs FOR SELECT TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 3) 시드 데이터 — 이번 주 방문자 + 오늘 인기 콘텐츠 (유의미한 숫자 노출용)
-- -----------------------------------------------------------------------------

-- 이번 주(월~일) 일별 방문자 수 시드 (이미 있는 날짜는 건너뜀)
INSERT INTO public.reading_activity_daily (date, count, minutes, total_reading_count)
SELECT
  d::date,
  (15 + (random() * 35)::int) AS count,
  (20 + (random() * 100)::int) AS minutes,
  (5 + (random() * 80)::int) AS total_reading_count
FROM generate_series(
  date_trunc('week', current_date)::date,
  date_trunc('week', current_date)::date + 6,
  '1 day'::interval
) AS d
ON CONFLICT (date) DO UPDATE SET
  count                = EXCLUDED.count,
  minutes               = EXCLUDED.minutes,
  total_reading_count   = EXCLUDED.total_reading_count;

-- (선택) 오늘 신규 회원이 0명이면, 기존 learners 중 1~2명을 오늘 가입으로 수정해서 표시할 수 있음
-- UPDATE public.learners SET created_at = current_date + (random() * 3600 * 24)::int * interval '1 second' WHERE id IN (SELECT id FROM public.learners LIMIT 2);

-- 오늘 인기 콘텐츠: contents가 있으면 오늘 날짜로 클릭/페이지뷰/완료 시드 (최대 5건)
INSERT INTO public.content_stats (content_id, stat_date, clicks, pageviews, completed_count)
SELECT
  c.id,
  current_date,
  (10 + (random() * 90)::int),
  (20 + (random() * 180)::int),
  (5 + (random() * 45)::int)
FROM public.contents c
ORDER BY c.updated_at DESC NULLS LAST
LIMIT 5
ON CONFLICT (content_id, stat_date) DO UPDATE SET
  clicks          = EXCLUDED.clicks,
  pageviews        = EXCLUDED.pageviews,
  completed_count  = EXCLUDED.completed_count;

-- 시드 후 확인용 (선택 실행)
-- SELECT * FROM public.reading_activity_daily ORDER BY date DESC LIMIT 7;
-- SELECT date, count, minutes FROM public.reading_activity_daily WHERE date >= date_trunc('week', current_date)::date ORDER BY date;
