-- 학습자 데이터 조회 허용 (대시보드 / 학습자 데이터 페이지)
-- "데이터를 불러오지 못했습니다" 또는 permission denied 시 SQL Editor에서 실행하세요.

-- learners 테이블: 로그인한 관리자(authenticated)가 SELECT
CREATE POLICY "Allow authenticated read learners"
ON public.learners FOR SELECT TO authenticated
USING (true);

-- reading_activity_daily 테이블: 로그인한 관리자가 SELECT
CREATE POLICY "Allow authenticated read reading_activity_daily"
ON public.reading_activity_daily FOR SELECT TO authenticated
USING (true);
