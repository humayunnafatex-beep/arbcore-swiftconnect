import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { DEMO_EMAIL, DEMO_PASSWORD, DEFAULT_COMPANY_ID, DEFAULT_USER_ID, AUTH_COOKIE_NAME, isDemoSession } from "@/lib/auth-constants";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthContext = Awaited<ReturnType<typeof ensureDefaultWorkspace>>;
export type AppModule = "dashboard" | "connect" | "contacts" | "campaigns" | "inbox" | "ai-studio" | "auto-reply" | "crm" | "analytics" | "settings" | "license";

const modulePermissions: Record<UserRole, AppModule[]> = {
  OWNER: ["dashboard", "connect", "contacts", "campaigns", "inbox", "ai-studio", "auto-reply", "crm", "analytics", "settings", "license"],
  ADMIN: ["dashboard", "connect", "contacts", "campaigns", "inbox", "ai-studio", "auto-reply", "crm", "analytics", "settings", "license"],
  MANAGER: ["dashboard", "contacts", "campaigns", "inbox", "crm", "analytics"],
  AGENT: ["inbox", "contacts", "crm"]
};

export function canAccessModule(role: UserRole, module: AppModule) {
  return modulePermissions[role]?.includes(module) ?? false;
}

export function assertCanAccessModule(context: AuthContext, module: AppModule) {
  if (!context.user.isActive) {
    throw new ApiError(403, "USER_INACTIVE", "This user account is inactive.");
  }

  if (!canAccessModule(context.user.role, module)) {
    throw new ApiError(403, "FORBIDDEN", "Your role does not have access to this module.");
  }
}

export function assertRole(context: AuthContext, roles: UserRole[]) {
  if (!context.user.isActive) {
    throw new ApiError(403, "USER_INACTIVE", "This user account is inactive.");
  }

  if (!roles.includes(context.user.role)) {
    throw new ApiError(403, "FORBIDDEN", "Your role does not have permission for this action.");
  }
}

export function isAuthEnforced() {
  // Phase 3 controlled switch. Default is false to protect current Enterprise Beta behavior.
  // TODO: Enable in production only after a real admin Supabase user is created and tested.
  return process.env.AUTH_ENFORCED === "true";
}

export async function getCurrentUser() {
  const supabaseUser = await getSupabaseAuthUser();

  if (supabaseUser?.email) {
    const user = await prisma.user.findUnique({ where: { email: supabaseUser.email.toLowerCase() } });
    if (user) return user;
  }

  // Phase 2 foundation only: return the existing beta/default owner when auth is not enforced.
  // TODO: Resolve the current user from Supabase Auth session cookies.
  return (await ensureDefaultWorkspace()).user;
}

export async function getCurrentUserRole() {
  return (await getCurrentUser()).role;
}

export async function requireCurrentUser() {
  // Phase 2 foundation only: do not block access beyond the existing beta flow.
  // TODO: Throw UNAUTHENTICATED when real auth enforcement is enabled.
  return getCurrentUser();
}

export async function ensureDefaultWorkspace() {
  const company = await prisma.company.upsert({
    where: { id: DEFAULT_COMPANY_ID },
    update: {
      name: "ARBCore AI",
      slug: "arbcore-ai",
      plan: "Enterprise"
    },
    create: {
      id: DEFAULT_COMPANY_ID,
      name: "ARBCore AI",
      slug: "arbcore-ai",
      plan: "Enterprise"
    }
  });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      id: DEFAULT_USER_ID,
      name: "Rasel Ahmed",
      role: "OWNER",
      isActive: true,
      companyId: company.id
    },
    create: {
      id: DEFAULT_USER_ID,
      email: DEMO_EMAIL,
      name: "Rasel Ahmed",
      role: "OWNER",
      isActive: true,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      companyId: company.id
    }
  });

  if (!user.passwordHash || !user.passwordHash.startsWith("$2")) {
    return {
      company,
      user: await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
          role: "OWNER",
          isActive: true
        }
      })
    };
  }

  return { user, company };
}

export async function getCurrentAuthContext() {
  const supabaseUser = await getSupabaseAuthUser();

  if (supabaseUser?.email) {
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email.toLowerCase() },
      include: { company: true }
    });

    if (user?.company) {
      return { user, company: user.company };
    }
  }

  const session = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!isDemoSession(session) && isAuthEnforced()) {
    throw new ApiError(401, "UNAUTHENTICATED", "You must be logged in to access this resource.");
  }

  return ensureDefaultWorkspace();
}

async function getSupabaseAuthUser() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  return data.user;
}
