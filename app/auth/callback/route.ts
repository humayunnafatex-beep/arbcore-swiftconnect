import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = getEmailOtpType(requestUrl.searchParams.get("type"));
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const supabase = createSupabaseServerClient();
  let error: Error | null = null;

  if (!supabase) {
    error = new Error("Supabase Auth is not configured.");
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error("No supported authentication credential was provided.");
  }

  const destination = error
    ? new URL("/login?error=auth_callback_failed", requestUrl.origin)
    : new URL(next, requestUrl.origin);
  const response = NextResponse.redirect(destination);
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
