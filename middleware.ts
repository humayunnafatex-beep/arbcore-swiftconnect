import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, DEMO_SESSION_VALUE } from "@/lib/auth-constants";
import { isFutureProtectedAppRoute, isPublicAppRoute } from "@/lib/auth-routes";

const AUTH_ENFORCED = process.env.AUTH_ENFORCED === "true";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === DEMO_SESSION_VALUE || hasSupabaseSessionCookie(request);
  const isProtectedRoute = isFutureProtectedAppRoute(pathname);

  if (isLogin && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (AUTH_ENFORCED && isProtectedRoute && !isPublicAppRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
