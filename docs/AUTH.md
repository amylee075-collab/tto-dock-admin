# 인증·비밀번호 재설정

## Auth 콜백 (`/auth/callback`)

- Supabase 이메일 링크(비밀번호 재설정·매직 링크 등) 클릭 시 `?code=...&type=...` 로 이 경로에 도달합니다.
- `exchangeCodeForSession(code)` 로 세션을 확립하고, **`type=recovery`** 이면 `/reset-password`로, 아니면 `next` 파라미터 또는 `/dashboard`로 리다이렉트합니다.
- 쿠키는 동일한 response에 설정한 뒤 리다이렉트하므로, 비밀번호 재설정 후 실제 변경이 반영되도록 합니다.

## 비밀번호 재설정 플로우

1. **비밀번호 찾기**: `/forgot-password` → 이메일 입력 → `resetPasswordForEmail(email, { redirectTo: origin + '/auth/callback?type=recovery' })`
2. **이메일 링크**: 사용자가 클릭 → Supabase가 `redirectTo` 주소로 `code`와 함께 리다이렉트.
3. **콜백**: `/auth/callback` 에서 `code` 교환 → 세션 쿠키 설정 → `/reset-password` 리다이렉트.
4. **비밀번호 변경**: `/reset-password` 에서 세션 여부 확인 후, `updateUser({ password })` 로 새 비밀번호 저장.

## Supabase URL 설정

- **Authentication** → **URL Configuration**
- **Site URL**: 배포 도메인 (예: `https://your-app.vercel.app`)
- **Redirect URLs**: `https://your-app.vercel.app/**` 또는 `https://your-app.vercel.app/auth/callback` 추가.

자세한 값은 README의 **Supabase URL 설정 (배포 도메인 / Vercel)** 섹션을 참고하세요.
