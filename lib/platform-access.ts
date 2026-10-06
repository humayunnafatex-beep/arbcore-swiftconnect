import { ApiError } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { DEFAULT_COMPANY_ID } from "@/lib/auth-constants";

export async function requirePlatformAdmin() {
  const context = await getCurrentAuthContext();
  const isPlatformCompany = context.user.companyId === DEFAULT_COMPANY_ID;
  const isPlatformRole = context.user.role === "OWNER" || context.user.role === "ADMIN";

  if (!context.user.isActive || !isPlatformCompany || !isPlatformRole) {
    throw new ApiError(
      403,
      "PLATFORM_ADMIN_REQUIRED",
      "This action is restricted to the ARBCore platform administration workspace."
    );
  }

  return context;
}
