import { cookies } from "next/headers";

export const SELECTED_WORKSPACE_COOKIE = "arbcore_selected_workspace_id";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

// Beta/admin testing only. Future production must use authenticated user/company membership.
export function getSelectedWorkspaceId() {
  return cookies().get(SELECTED_WORKSPACE_COOKIE)?.value || null;
}

// Beta/admin testing only. Future production must use authenticated user/company membership.
export function setSelectedWorkspaceId(companyId: string) {
  cookies().set(SELECTED_WORKSPACE_COOKIE, companyId, cookieOptions);
}

// Beta/admin testing only. Future production must use authenticated user/company membership.
export function clearSelectedWorkspaceId() {
  cookies().delete(SELECTED_WORKSPACE_COOKIE);
}
