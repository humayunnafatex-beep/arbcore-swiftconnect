import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { ensureDefaultWorkspace } from "@/lib/auth";
import { AUTH_COOKIE_NAME, DEMO_EMAIL, DEMO_SESSION_VALUE } from "@/lib/auth-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const context = await ensureDefaultWorkspace();

    const isDemoEmail = input.email.toLowerCase() === DEMO_EMAIL;
    const isValidPassword = context.user.passwordHash ? await bcrypt.compare(input.password, context.user.passwordHash) : false;

    if (!isDemoEmail || !isValidPassword || !context.user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, data: context });

    response.cookies.set(AUTH_COOKIE_NAME, DEMO_SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "LOGIN_FAILED", message: "Unable to login with the provided request." } },
      { status: 400 }
    );
  }
}
