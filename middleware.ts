import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, DEMO_SESSION_VALUE } from "@/lib/auth-constants";
import { isFutureProtectedAppRoute, isPublicAppRoute } from "@/lib/auth-routes";

const AUTH_ENFORCED = process.env.AUTH_ENFORCED === "true";

type PendingCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const hasDemoSession = request.cookies.get(AUTH_COOKIE_NAME)?.value === DEMO_SESSION_VALUE;
  const { isAuthenticated: hasVerifiedSupabaseSession, pendingCookies } = await verifySupabaseSession(request);
  const isAuthenticated = hasVerifiedSupabaseSession || (!AUTH_ENFORCED && hasDemoSession);
  const isProtectedRoute = isFutureProtectedAppRoute(pathname);

  if (isLogin && isAuthenticated) {
    return redirectWithCookies(new URL("/", request.url), pendingCookies);
  }

  if (AUTH_ENFORCED && isProtectedRoute && !isPublicAppRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(loginUrl, pendingCookies);
  }

  const response = NextResponse.next();
  applyCookies(response, pendingCookies);
  return response;
}

async function verifySupabaseSession(request: NextRequest) {
  if (!hasSupabaseSessionCookie(request)) {
    return { isAuthenticated: false, pendingCookies: [] as PendingCookie[] };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAuthenticated: false, pendingCookies: [] as PendingCookie[] };
  }

  const pendingCookies: PendingCookie[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          pendingCookies.push({ name, value, options });
        });
      }
    }
  });

  try {
    const { data, error } = await supabase.auth.getUser();
    return {
      isAuthenticated: !error && Boolean(data.user),
      pendingCookies
    };
  } catch {
    return { isAuthenticated: false, pendingCookies };
  }
}

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) =>
    cookie.name.includes("auth-token") && (cookie.name.startsWith("sb-") || cookie.name.startsWith("supabase-"))
  );
}

function redirectWithCookies(url: URL, cookies: PendingCookie[]) {
  const response = NextResponse.redirect(url);
  applyCookies(response, cookies);
  return response;
}

function applyCookies(response: NextResponse, cookies: PendingCookie[]) {
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
