# 또독(TTO-DOCK) 관리자

TTO-DOCK2 서비스의 관리자 대시보드입니다. Next.js 15와 Tailwind CSS로 구성되어 있으며, Supabase Auth로 관리자 전용 로그인과 미들웨어 기반 접근 제어를 사용합니다.

## 기능

- **보안**: Supabase Auth 로그인, 미들웨어로 비인가 접근 차단
- **콘텐츠 CRUD**: 읽기 콘텐츠 등록·수정·삭제, 섬네일 업로드 (Supabase Storage)
- **오늘의 단어**: 메인 화면 &#39;오늘의 단어&#39; 단어 목록 관리 (TTO-DOCK2 연동)
- **문해력 기초 훈련**: 핵심 단어 찾기 퀴즈 문항 관리 (TTO-DOCK2 /practice/core-word 연동)
- **학습자 데이터**: 학습자 수·읽기 횟수·학습 시간 요약, 일별 차트 (Recharts)

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
3. **테이블 (선택)**  
- **contents** (콘텐츠 관리용, TTO-DOCK2 읽기와 연동):  
  `id`, `title`, `description`, `thumbnail_url`, `type`, `content`, `vocabulary` (jsonb, nullable), `section` (text, nullable — 분야별 글: 과학|역사|사회), `badges` (jsonb, nullable — 칩 라벨 배열 예: `["과학","쉬움"]`, `["디지털","신문기사"]`), `created_at`, `updated_at`  
  - 이미 contents 테이블이 있다면 Supabase SQL에서 칩용 컬럼 추가:  
    `alter table public.contents add column if not exists section text;`  
    `alter table public.contents add column if not exists badges jsonb;`
   - **learners** (학습자 대시보드용):  
     `id`, `name`, `email`, `total_reading_count`, `total_reading_minutes`, `last_activity_at`  
   - **reading_activity_daily** (일별 차트용):  
     `date` (date), `count` (int), `minutes` (int)  
   - **today_words** (오늘의 단어):  
     `id` (uuid), `word` (text), `meaning` (text), `example` (text), `type` (text: 순우리말 | 한자어 | 외래어), `created_at` (timestamptz)  
   - **core_word_quiz** (문해력 기초 훈련):  
     `id` (uuid), `sentence` (text), `correct_answer` (text), `selectable_words` (jsonb 배열, 기본값 `'[]'::jsonb`), `feedback_by_word` (jsonb 객체, 기본값 `'{}'::jsonb`), `sort_order` (int, nullable), `created_at` (timestamptz)  
     - 퀴즈 저장이 안 되면: Supabase SQL에서 `alter table public.core_word_quiz alter column selectable_words set default '[]'::jsonb;` / `feedback_by_word set default '{}'::jsonb;` 실행

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
| `/dashboard` | 대시보드 홈 |
| `/dashboard/contents` | 콘텐츠 목록 |
| `/dashboard/contents/new` | 새 콘텐츠 등록 (섬네일 업로드 포함) |
| `/dashboard/contents/[id]/edit` | 콘텐츠 수정 |
| `/dashboard/today-words` | 오늘의 단어 목록 |
| `/dashboard/today-words/new` | 오늘의 단어 추가 |
| `/dashboard/today-words/[id]/edit` | 오늘의 단어 수정 |
| `/dashboard/core-word-quiz` | 문해력 기초 훈련(핵심 단어 퀴즈) 문항 목록 |
| `/dashboard/core-word-quiz/new` | 퀴즈 문항 추가 |
| `/dashboard/core-word-quiz/[id]/edit` | 퀴즈 문항 수정 |
| `/dashboard/learners` | 학습자 데이터·차트 |

## UI

TTO-DOCK2 서비스와 동일한 디자인 톤(오렌지 포인트 `#ff5700`, Pretendard, 연한 오렌지 배경)을 사용한 대시보드 레이아웃입니다.
