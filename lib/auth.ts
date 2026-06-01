import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import type { User } from "@supabase/supabase-js";
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
  const mappedUser = await getMappedPrismaUserForSupabaseSession();

  if (mappedUser) {
    return mappedUser;
  }

  if (isAuthEnforced()) {
    throw new ApiError(401, "UNAUTHENTICATED", "You must be logged in to access this resource.");
  }

  // Phase 4 foundation: keep beta/default owner fallback while auth is not enforced.
  return (await ensureDefaultWorkspace()).user;
}

export async function getCurrentUserRole() {
  return (await getCurrentUser()).role;
}

export async function requireCurrentUser() {
  // Phase 4 foundation: blocks only when AUTH_ENFORCED=true and no mapped user exists.
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
  const mappedUser = await getMappedPrismaUserForSupabaseSession({ includeCompany: true });

  if (mappedUser?.company) {
    return { user: mappedUser, company: mappedUser.company };
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

async function getMappedPrismaUserForSupabaseSession(options?: { includeCompany?: false }): Promise<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
async function getMappedPrismaUserForSupabaseSession(options: { includeCompany: true }): Promise<Awaited<ReturnType<typeof prisma.user.findUnique<{ where: { id: string }; include: { company: true } }>>>>;
async function getMappedPrismaUserForSupabaseSession(options?: { includeCompany?: boolean }) {
  const supabaseUser = await getSupabaseAuthUser();

  if (!supabaseUser) {
    return null;
  }

  const mappedUser = await findOrAttachSupabaseUser(supabaseUser);

  if (!mappedUser) {
    return null;
  }

  if (options?.includeCompany) {
    return prisma.user.findUnique({
      where: { id: mappedUser.id },
      include: { company: true }
    });
  }

  return mappedUser;
}

async function findOrAttachSupabaseUser(supabaseUser: User) {
  const byAuthId = await prisma.user.findUnique({
    where: { supabaseAuthId: supabaseUser.id }
  });

  if (byAuthId) {
    return byAuthId;
  }

  const email = supabaseUser.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });

  if (!byEmail) {
    return null;
  }

  if (byEmail.supabaseAuthId && byEmail.supabaseAuthId !== supabaseUser.id) {
    return byEmail;
  }

  if (byEmail.supabaseAuthId === supabaseUser.id) {
    return byEmail;
  }

  return prisma.user.update({
    where: { id: byEmail.id },
    data: { supabaseAuthId: supabaseUser.id }
  });
}
