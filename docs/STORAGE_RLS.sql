-- Supabase Storage RLS: thumbnails 버킷 업로드/조회 허용
-- "new row violates row-level security policy" 에러 시 SQL Editor에서 실행하세요.
-- 버킷 이름이 다르면 'thumbnails'를 해당 버킷 이름으로 바꾸세요.
-- 이미 정책이 있으면 아래 DROP 줄의 주석을 해제한 뒤 먼저 실행하세요.

-- DROP POLICY IF EXISTS "Allow authenticated upload to thumbnails" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public read thumbnails" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated update thumbnails" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated delete thumbnails" ON storage.objects;

-- 업로드 허용 (로그인한 사용자)
CREATE POLICY "Allow authenticated upload to thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

-- 공개 조회 (이미지 URL로 접근)
CREATE POLICY "Allow public read thumbnails"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'thumbnails');

-- 수정/삭제 허용 (선택)
CREATE POLICY "Allow authenticated update thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'thumbnails');

CREATE POLICY "Allow authenticated delete thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'thumbnails');
