# Git 올리기 & Vercel 배포

## 1. GitHub에 저장소 만들고 푸시

1. [GitHub](https://github.com) 로그인 후 **New repository** 생성
   - Repository name: 예) `tto-dock-admin`
   - Public 선택, **Create repository** (README 추가 안 해도 됨)

2. 터미널에서 원격 저장소 연결 후 푸시 (아래 `YOUR_USERNAME/YOUR_REPO`를 본인 저장소로 변경):

```bash
cd c:\Users\IM_0624\Desktop\tto-dock-admin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

- 이미 `origin`이 있으면 `git remote set-url origin https://github.com/...` 로 주소만 수정
- 기본 브랜치가 `master`면 `git push -u origin master` 로 푸시 (이 프로젝트는 `master` 사용)

---

## 2. Vercel에 배포

1. [Vercel](https://vercel.com) 로그인 (GitHub 계정으로 연동 권장)

2. **Add New** → **Project** → **Import Git Repository**  
   방금 푸시한 `tto-dock-admin` 저장소 선택

3. **Configure Project**  
   - Framework: Next.js (자동 감지)
   - Root Directory: `./` (그대로)
   - Build Command: `npm run build` (기본값)
   - Output Directory: (비움, Next 기본값)

4. **Environment Variables** 에 아래 추가 (반드시 설정):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL (예: https://xxxx.supabase.co) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

   - Supabase 대시보드 → **Project Settings** → **API** 에서 확인
   - Storage 버킷 이름을 바꿨다면 `NEXT_PUBLIC_SUPABASE_THUMBNAILS_BUCKET` 도 추가

5. **Deploy** 클릭

6. 배포가 끝나면 `https://프로젝트이름.vercel.app` 로 접속  
   - 로그인 페이지가 나오면 Supabase Auth에 등록한 관리자 이메일/비밀번호로 로그인

---

## 3. 배포 후 확인

- **Supabase Auth**  
  로그인 시 리다이렉트 URL에 Vercel 도메인이 포함되어야 합니다.  
  Supabase 대시보드 → **Authentication** → **URL Configuration** → **Redirect URLs**에  
  `https://프로젝트이름.vercel.app/**` 를 추가하세요.

- **Storage**  
  콘텐츠 섬네일을 쓰는 경우 Supabase Storage `thumbnails` 버킷이 **Public** 인지 확인하세요.

- 이후 코드 수정 후 `git add` → `git commit` → `git push origin master` 하면 Vercel이 자동으로 다시 배포합니다. (브랜치가 main이면 `git push origin main`)
