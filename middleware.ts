import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, DEMO_SESSION_VALUE } from "@/lib/auth-constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const isAuthenticated = request.cookies.get(AUTH_COOKIE_NAME)?.value === DEMO_SESSION_VALUE;

  if (isLogin && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isLogin && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
