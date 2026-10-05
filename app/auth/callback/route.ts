import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PendingCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = getEmailOtpType(requestUrl.searchParams.get("type"));
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const pendingCookies: PendingCookie[] = [];
  let error: Error | null = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    error = new Error("Supabase Auth is not configured.");
  } else {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options });
          });
        }
      }
    });

    if (tokenHash && type) {
      const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      error = result.error;
    } else if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      error = result.error;
    } else {
      error = new Error("No supported authentication credential was provided.");
    }
  }

  const destination = error
    ? new URL("/login?error=auth_callback_failed", requestUrl.origin)
    : new URL(next, requestUrl.origin);
  const response = NextResponse.redirect(destination);

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/auth/status";
  }

  return value;
}

function getEmailOtpType(value: string | null): EmailOtpType | null {
  const supportedTypes: EmailOtpType[] = [
    "email",
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change"
  ];

  return supportedTypes.includes(value as EmailOtpType) ? value as EmailOtpType : null;
}
