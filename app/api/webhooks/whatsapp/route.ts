export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Legacy compatibility route.
// Reuse the canonical tenant-aware WhatsApp webhook implementation so both
// endpoints enforce the same signature checks, provider routing, tenant
// isolation, contact collision handling, logging, and auto-reply behavior.
export { GET, POST } from "@/app/api/whatsapp/webhook/route";
