export const AUTH_COOKIE_NAME = "arbcore_demo_session";
export const DEMO_EMAIL = "admin@arbcore.ai";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_SESSION_VALUE = "arbcore-local-demo-session";
export const DEFAULT_COMPANY_ID = "default-company";
export const DEFAULT_USER_ID = "demo-admin-user";

export function isDemoSession(value?: string | null) {
  return value === DEMO_SESSION_VALUE;
}
