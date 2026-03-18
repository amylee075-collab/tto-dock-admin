import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Supabase 인증 콜백 (이메일 링크 로그인, 비밀번호 재설정 링크 등).
 * type=recovery 이면 세션 확립 후 /reset-password로 리다이렉트.
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const nextPath = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code&message=인증 코드가 없습니다.", request.url)
    );
  }

  const successRedirectUrl =
    type === "recovery"
      ? new URL("/reset-password", request.url)
      : new URL(nextPath, request.url);
  const response = NextResponse.redirect(successRedirectUrl);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=auth&message=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }

  return response;
}
