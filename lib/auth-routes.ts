export const PUBLIC_API_ROUTES = [
  "/api/whatsapp/webhook",
  "/api/webhooks/whatsapp"
] as const;

export const PUBLIC_APP_ROUTES = [
  "/login",
  "/auth/callback",
  "/auth/logout"
] as const;

export const FUTURE_PUBLIC_API_ROUTES = [
  "/api/messenger/webhook"
] as const;

export const PROTECTED_APP_ROUTES = [
  "/",
  "/dashboard",
  "/contacts",
  "/send-messages",
  "/auto-reply",
  "/whatsapp-logs",
  "/settings",
  "/license"
] as const;

export const FUTURE_PROTECTED_APP_ROUTES = PROTECTED_APP_ROUTES;

export const FUTURE_PROTECTED_API_PREFIXES = [
  "/api/contacts",
  "/api/auto-reply",
  "/api/settings",
  "/api/team",
  "/api/whatsapp/logs",
  "/api/whatsapp/test-send",
  "/api/dashboard"
] as const;

export function isPublicApiRoute(pathname: string) {
  return PUBLIC_API_ROUTES.some((route) => pathname === route);
}

export function isPublicAppRoute(pathname: string) {
  return PUBLIC_APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isFutureProtectedAppRoute(pathname: string) {
  return PROTECTED_APP_ROUTES.some((route) => route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`));
}

export function isFutureProtectedApiRoute(pathname: string) {
  return FUTURE_PROTECTED_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
