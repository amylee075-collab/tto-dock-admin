# 또독(TTO-DOCK) 관리자

TTO-DOCK2 서비스의 관리자 대시보드입니다. Next.js 15와 Tailwind CSS로 구성되어 있으며, Supabase Auth로 관리자 전용 로그인과 미들웨어 기반 접근 제어를 사용합니다.

## 기능

- **보안**: Supabase Auth 로그인, 미들웨어로 비인가 접근 차단
- **콘텐츠 CRUD**: 읽기 콘텐츠 등록·수정·삭제, 유형별 탭(전체/짧은 글/긴 글/분야별/디지털), 칩(분야·난이도), 썸네일 업로드 (Supabase Storage). 신규 등록 시 `id` 자동 생성(제목 기반 slug + 타임스탬프 + 랜덤)
- **오늘의 단어**: 메인 화면 '오늘의 단어' 단어 목록 관리 (TTO-DOCK2 연동). 목록 테이블에 **단어·유형·뜻·예문** 노출, CSV 일괄 업로드 시 **중복 단어는 기존 행 수정·신규만 insert**
- **문해력 기초 훈련**: 핵심 단어 찾기 퀴즈 문항 관리 (TTO-DOCK2 /practice/core-word 연동). 일괄 업로드용 **샘플 CSV** 제공(`/samples/core-word-quiz-sample.csv`), 일괄·신규 등록 시 `id` 자동 생성
- **학습자 데이터**: 학습자 수·읽기 횟수·학습 시간 요약, 일별 차트 (Recharts). 오늘의 단어는 **기준 50건** 안내

## 시작하기

### 1. 환경 변수

`.env.example`을 복사해 `.env.local`을 만들고 Supabase 값을 채우세요.

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key

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
   **Authentication** → **URL Configuration** → **Redirect URLs**에 배포 URL 추가 (예: `https://프로젝트.vercel.app/**`). **Site URL**도 배포 URL로 맞추면 좋습니다.
3. **이메일/비밀번호** 띄어쓰기·대소문자 확인. 비밀번호는 8자 이상 권장.

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

   - **learners** (학습자 대시보드용): `id`, `name`, `email`, `total_reading_count`, `total_reading_minutes`, `last_activity_at`  
   - **reading_activity_daily** (일별 차트용): `date` (date), `count` (int), `minutes` (int)

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
| `/dashboard/learners` | 학습자 데이터·차트 |

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
