# 또독(TTO-DOCK) 관리자

TTO-DOCK2 서비스의 관리자 대시보드입니다. Next.js 15와 Tailwind CSS로 구성되어 있으며, Supabase Auth로 관리자 전용 로그인과 미들웨어 기반 접근 제어를 사용합니다.

## 기능

- **보안**: Supabase Auth 로그인, 미들웨어로 비인가 접근 차단
- **콘텐츠 CRUD**: 읽기 콘텐츠 등록·수정·삭제, 유형별 탭(전체/짧은 글/긴 글/분야별/디지털), 칩(분야·난이도), 썸네일 업로드 (Supabase Storage). 신규 등록 시 `id` 자동 생성(제목 기반 slug + 타임스탬프 + 랜덤)
- **오늘의 단어**: 메인 화면 '오늘의 단어' 단어 목록 관리 (TTO-DOCK2 연동). 목록 테이블에 **단어·유형·뜻·예문** 노출, CSV 일괄 업로드 시 **중복 단어는 기존 행 수정·신규만 insert**
- **문해력 기초 훈련**: 핵심 단어 찾기 퀴즈 문항 관리 (TTO-DOCK2 /practice/core-word 연동). 일괄 업로드용 **샘플 CSV** 제공(`/samplescore-word-quiz-sample.csv`), 일괄·신규 등록 시 `id` 자동 생성
- **학습자 데이터 (KPI)**: 학습자 수, **인당 평균 읽기**·**인당 평균 세션 시간**, **완독률**(completed/started), **DAU**, 일별 **인당 평균** 학습 추이 차트 (Recharts). 오늘의 단어는 **기준 50건** 안내

## 시작하기

### 1. 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 Supabase 값을 채우세요.

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key
- `SUPABASE_SERVICE_ROLE_KEY`: (선택) 방문자 추적·활동 완료 API용. 있으면 미들웨어에서 `visitor_logs`/`reading_activity_daily`에 자동 기록되고, TTO-DOCK2에서 읽기 완료 시 `content_stats.completed_count` 증가 API 호출 가능.

### 2. 관리자 계정 생성 (Supabase Auth)

Supabase 대시보드에서 로그인에 쓸 계정을 만듭니다.

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속 → 사용 중인 **프로젝트** 선택
2. 왼쪽 메뉴 **Authentication** → **Users**
3. **Add user** → **Create new user** 선택
4. **Email**과 **Password** 입력 (예: 관리자 이메일, 비밀번호 8자 이상)
5. **Create user** 클릭

생성된 이메일/비밀번호로 관리자 페이지(http://localhost:3002) 로그인 화면에서 로그인하면 됩니다.

> 회원가입(Sign up)을 막고 관리자만 쓰려면: **Authentication** → **Providers** → **Email**에서 **Confirm email**을 켜두고, 위처럼 대시보드에서만 사용자 추가하면 됩니다. (이메일 확인이 필요하면 생성 시 이메일 인증 링크가 발송됩니다.)

**로그인이 안 될 때**

1. **Supabase에서 사용자 '이메일 확인' 처리**  
   **Authentication** → **Users** → 해당 사용자 행 클릭 → **Confirm email** 버튼 클릭(또는 **Email confirmed** 체크). 대시보드에서 추가한 사용자는 인증 메일을 받지 않으므로 수동으로 확인 처리해야 합니다.
2. **Vercel 등 외부 도메인에서 로그인하는 경우**  
   **Authentication** → **URL Configuration**에서 아래처럼 설정합니다. (자세한 값은 아래 **Supabase URL 설정** 참고.)
3. **이메일/비밀번호** 띄어쓰기·대소문자 확인. 비밀번호는 8자 이상 권장.

**비밀번호 재설정**

- 로그인 화면에서 **비밀번호를 잊으셨나요?** → `/forgot-password`에서 이메일 입력 후 **재설정 링크 받기**.
- 이메일 링크 클릭 시 `/auth/callback?type=recovery&code=...`로 들어와 세션이 확립된 뒤 `/reset-password`로 리다이렉트됩니다.
- `/reset-password`에서 새 비밀번호 입력 후 **비밀번호 변경** 시 `supabase.auth.updateUser({ password })`로 반영됩니다. 재설정 링크 없이 직접 접속하면 세션이 없어 로그인 페이지로 보내집니다.

**Supabase URL 설정 (배포 도메인 / Vercel)**

비밀번호 재설정 메일 링크 및 로그인 리다이렉트가 배포 환경에서 동작하려면 Supabase에 배포 URL을 등록해야 합니다.

1. [Supabase Dashboard](https://supabase.com/dashboard) → 사용 중인 **프로젝트** 선택  
2. 왼쪽 **Authentication** → **URL Configuration**  
3. 다음 두 값을 설정합니다.

| 항목 | 넣을 값 | 예 (Vercel) |
|------|--------|-------------|
| **Site URL** | 배포된 앱의 메인 주소 (프로토콜 포함, 경로 없음) | `https://your-app.vercel.app` |
| **Redirect URLs** | 허용할 리다이렉트 URL 목록 (한 줄에 하나씩) | `https://your-app.vercel.app/**`<br>`https://your-app.vercel.app/auth/callback` |

- **Site URL**: 이메일 템플릿 등에서 사용하는 기본 도메인. 반드시 **배포 도메인**으로 설정 (로컬만 쓸 때는 `http://localhost:3002`).
- **Redirect URLs**: 로그인/비밀번호 재설정 후 돌아올 수 있는 URL만 허용합니다.  
  - `https://your-app.vercel.app/**` 로 전체 경로 허용하거나,  
  - `https://your-app.vercel.app/auth/callback` 만 넣어도 됩니다 (콜백만 허용).  
- 로컬 개발 시에는 `http://localhost:3002/**` 또는 `http://localhost:3002/auth/callback` 을 Redirect URLs에 추가해 두면 됩니다.

### 3. Supabase 설정 (Storage·테이블)

1. **Storage**: Storage에서 `thumbnails` 버킷을 생성하고 **Public**으로 설정. 콘텐츠 등록 시 이미지 파일이 이 버킷에 업로드되고, 생성된 Public URL이 `contents.thumbnail_url`(text)에 저장됨  
   - **섬네일 업로드 시 "new row violates row-level security policy" 에러가 나면**: Supabase 대시보드 → **SQL Editor**에서 아래 정책을 실행하세요. (Storage는 기본적으로 RLS가 켜져 있어, 업로드/조회를 허용하는 정책이 필요합니다.)
   ```sql
   -- thumbnails 버킷 업로드 허용 (로그인한 관리자)
   CREATE POLICY "Allow authenticated upload to thumbnails"
   ON storage.objects FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'thumbnails');

   -- thumbnails 버킷 공개 조회 (이미지 노출)
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
   ```

2. **테이블 (선택)**

   - **contents** (콘텐츠 관리용, TTO-DOCK2 읽기와 연동):  
     `id`, `title`, `description`, `thumbnail_url`, `type`, `content`, `vocabulary` (jsonb, nullable), `section` (text, nullable), `badges` (jsonb, nullable), `core_quiz` (jsonb, nullable), `read_quizzes` (jsonb, nullable), `summary_quiz` (jsonb, nullable), `created_at`, `updated_at`  
     - 칩용: `alter table public.contents add column if not exists section text;` / `alter table public.contents add column if not exists badges jsonb;`  
     - 퀴즈용: `alter table public.contents add column if not exists core_quiz jsonb;` / `alter table public.contents add column if not exists read_quizzes jsonb;` / `alter table public.contents add column if not exists summary_quiz jsonb;`

   - **today_words** (오늘의 단어):  
     `id` (uuid), `word` (text, **unique**), `meaning` (text), `example` (text), `type` (text: 순우리말 | 한자어 | 외래어), `created_at` (timestamptz)  
     - `word`에 unique 제약이 있으면 CSV 일괄 업로드 시 **이미 있는 단어는 수정**, 없는 단어만 **신규 insert** 되도록 앱에서 처리합니다.

   - **core_word_quiz** (문해력 기초 훈련):  
     `id` (uuid), `sentence` (text), `correct_answer` (text), `selectable_words` (jsonb 배열), `feedback_by_word` (jsonb 객체), `sort_order` (int, nullable), `created_at` (timestamptz)  
     - 필요 시: `alter table public.core_word_quiz alter column selectable_words set default '[]'::jsonb;` / `feedback_by_word set default '{}'::jsonb;`

   - **learners** (학습자 대시보드용): `id`, `name`, `email`, `total_reading_count`, `total_reading_minutes`, `last_activity_at` (선택: `created_at` — 있으면 대시보드 &quot;오늘 신규 회원&quot; 집계). RLS가 켜져 있으면 관리자(authenticated)가 SELECT할 수 있도록 정책을 추가하세요.  
   - **reading_activity_daily** (일별 차트·방문자용): `date`, `count` (유니크 방문자), `minutes`, `total_reading_count`. RLS 사용 시 SELECT 허용 정책 필요.  
   - **content_stats** (오늘 인기 콘텐츠용, 선택): `content_id`, `stat_date`, `clicks`, `pageviews`, `completed_count`. 있으면 대시보드 &quot;오늘 인기 콘텐츠&quot;에 클릭/조회/완료가 표시되고, 없으면 최근 수정 콘텐츠 5건만 &quot;연동 대기&quot;로 표시됩니다.
   - **visitor_logs** (방문자 추적): `visitor_id`, `visit_date`. 미들웨어/API에서 사용.  
   - **activity_logs** (완독률·DAU): `user_key`, `event_date`, `event_type` (started|completed). `docs/DASHBOARD_DATA.sql` 참고.

   **대시보드 숫자가 0으로만 나올 때**  
   방문자 요약·오늘 방문자·주간 평균·오늘 신규 회원·오늘 인기 콘텐츠(클릭/조회/완료)를 채우려면 Supabase **SQL Editor**에서 `docs/DASHBOARD_DATA.sql` 내용을 실행하세요. 테이블 생성(`visitor_logs`, `content_stats.completed_count` 포함), RLS 정책, 시드가 포함되어 있습니다.

   **방문자 추적·시간대**
   - 모든 페이지 접속 시 미들웨어가 `/api/track-visitor`를 호출해 IP+User-Agent 기반 고유 ID를 `visitor_logs`에 기록하고, **오늘 첫 방문인 경우에만** `reading_activity_daily.count`를 1 증가시킵니다.
   - 읽기 활동 완료(Result 페이지) 시 TTO-DOCK2에서 `POST /api/track-activity-complete` body `{ "content_id": "...", "user_key": "..." }`를 호출하면 `content_stats.completed_count`·`activity_logs`(completed)·`reading_activity_daily.total_reading_count`가 오늘(Asia/Seoul) 기준으로 반영됩니다.
   - 읽기 **시작** 시 `POST /api/track-activity` body `{ "user_key": "...", "event_type": "started" }`를 호출하면 `activity_logs`에 기록되어 **완독률(completed/started)**·**DAU**(오늘 학습 로그 1건 이상 유저 수)가 집계됩니다.
   - 대시보드의 "오늘"·"이번 주"는 모두 **Asia/Seoul** 기준으로 동작합니다.

테이블이 없어도 앱은 동작하며, 해당 메뉴에서 안내 메시지가 표시되거나 TTO-DOCK2는 기존 로컬 데이터를 사용합니다.

### 4. 실행

```bash
npm install
npm run dev
```

브라우저에서 **http://localhost:3002** 접속 후 로그인하면 `/dashboard`로 이동합니다. (TTO-DOCK2가 3000 포트를 사용하므로 관리자는 3002 포트 사용)

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 로그인 시 `/dashboard`, 비로그인 시 `/login`으로 리다이렉트 |
| `/login` | 관리자 로그인 |
| `/forgot-password` | 비밀번호 찾기 (이메일로 재설정 링크 발송) |
| `/reset-password` | 새 비밀번호 입력 (재설정 링크로 들어온 세션에서만 접근) |
| `/auth/callback` | Supabase 인증 콜백 (이메일 링크·비밀번호 재설정 등, `type=recovery` 시 `/reset-password`로 리다이렉트) |
| `/dashboard` | 대시보드 홈 (오늘의 단어 기준 50건 등 안내) |
| `/dashboard/contents` | 콘텐츠 목록 (유형별 탭·칩) |
| `/dashboard/contents/new` | 새 콘텐츠 등록 (섬네일 업로드, id 자동 생성) |
| `/dashboard/contents/[id]/edit` | 콘텐츠 수정 |
| `/dashboard/today-words` | 오늘의 단어 목록 (단어·유형·뜻·예문) |
| `/dashboard/today-words/new` | 오늘의 단어 추가 (중복 시 안내 메시지) |
| `/dashboard/today-words/[id]/edit` | 오늘의 단어 수정 |
| `/dashboard/today-words/upload` | 오늘의 단어 CSV 일괄 업로드 (중복 시 기존 수정·신규만 추가) |
| `/dashboard/core-word-quiz` | 문해력 기초 훈련(핵심 단어 퀴즈) 문항 목록 |
| `/dashboard/core-word-quiz/new` | 퀴즈 문항 추가 |
| `/dashboard/core-word-quiz/[id]/edit` | 퀴즈 문항 수정 |
| `/dashboard/core-word-quiz/upload` | 퀴즈 CSV 일괄 업로드 (샘플 CSV 다운로드 가능) |
| `/dashboard/learners` | 학습자 데이터·KPI(인당 평균 읽기/세션, 완독률, DAU)·인당 평균 추이 차트 |

## 동작 개요 (알고리즘·비즈니스 로직)

- **오늘의 단어 CSV 일괄 업로드**  
  1) 업로드 전 `today_words`에서 기존 `word` 목록 조회  
  2) CSV 행을 **신규**(DB에 없는 단어) / **기존**(이미 있는 단어)으로 분리  
  3) 신규: `id`를 `randomUUID()`로 부여 후 `insert`  
  4) 기존: 해당 `word`에 대해 `meaning`, `example`, `type`만 `update`  
  5) 결과 메시지: "N건 신규 등록, M건 기존 수정되었습니다."

- **오늘의 단어 신규 등록(폼)**  
  - `id`는 `crypto.randomUUID()`로 생성 후 insert.  
  - `word` unique 위반(이미 등록된 단어) 시 "이미 등록된 단어입니다. 목록에서 해당 단어를 선택해 수정해 주세요." 안내.

- **문해력 기초 퀴즈**  
  - 일괄 업로드·신규 문항 모두 insert 시 `id`를 서버/클라이언트에서 `randomUUID()`·`crypto.randomUUID()`로 부여.  
  - 샘플 CSV: `public/samples/core-word-quiz-sample.csv` (헤더: sentence, correct_answer, selectable_words, feedback_by_word, sort_order / 선택지는 `|` 구분).

- **콘텐츠 신규 등록**  
  - `id`는 제목 기반 slug(소문자·하이픈, 80자 제한) + `Date.now()` + 랜덤 6자로 생성해 insert. 저장 실패 시 Supabase 에러 메시지를 그대로 노출.

## UI

TTO-DOCK2 서비스와 동일한 디자인 톤(오렌지 포인트 `#ff5700`, Pretendard, 연한 오렌지 배경)을 사용한 대시보드 레이아웃입니다.
