import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 방문자 추적: 같은 요청에서 한 번만 호출하고, API 경로는 제외 */
function triggerVisitorTrack(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/")) return;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "";
  const ua = request.headers.get("user-agent") ?? "";
  const origin = request.nextUrl.origin;
  fetch(`${origin}/api/track-visitor`, {
    method: "POST",
    headers: {
      "x-visitor-ip": ip,
      "user-agent": ua,
    },
  }).catch(() => {});
}

export async function updateSession(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    triggerVisitorTrack(request);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const path = request.nextUrl.pathname;
  const isLoginPage = path === "/login";
  const isAuthCallback = path === "/auth/callback";
  const isForgotPassword = path === "/forgot-password";
  const isResetPassword = path === "/reset-password";
  const isDashboard = path.startsWith("/dashboard");
  const isRoot = path === "/";

  if (!url || !anonKey) {
    if ((isDashboard || isRoot) && !isLoginPage) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next({ request });
  }

  if (isAuthCallback) {
    return NextResponse.next({ request });
  }

  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    user = null;
  }

  if (user && isLoginPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && (isDashboard || isRoot || isResetPassword) && !isForgotPassword) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
