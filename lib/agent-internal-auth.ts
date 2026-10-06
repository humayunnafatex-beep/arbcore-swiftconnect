import crypto from "node:crypto";
import { ApiError } from "@/lib/api";
import { DEFAULT_COMPANY_ID } from "@/lib/auth-constants";
import { requirePlatformAdmin } from "@/lib/platform-access";

export async function resolveAgentAuthorizedCompanyId(request: Request) {
  if (hasValidAgentInternalToken(request)) {
    return DEFAULT_COMPANY_ID;
  }

  const context = await requirePlatformAdmin();
  return context.company.id;
}

export function requireAgentInternalToken(request: Request) {
  if (!hasValidAgentInternalToken(request)) {
    throw new ApiError(401, "AGENT_INTERNAL_UNAUTHORIZED", "Valid internal agent authorization is required.");
  }

  return DEFAULT_COMPANY_ID;
}

function hasValidAgentInternalToken(request: Request) {
  const configured = process.env.AGENT_INTERNAL_TOKEN || "";
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!configured || !supplied) return false;

  const configuredBuffer = Buffer.from(configured);
  const suppliedBuffer = Buffer.from(supplied);

  if (configuredBuffer.length !== suppliedBuffer.length) return false;
  return crypto.timingSafeEqual(configuredBuffer, suppliedBuffer);
}
