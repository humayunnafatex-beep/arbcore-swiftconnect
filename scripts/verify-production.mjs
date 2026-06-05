import { existsSync, readFileSync } from "node:fs";

loadDotEnvFile();

const defaultUrl = "https://arbcore-swiftconnect.vercel.app";

const baseUrl = (process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_APP_URL || defaultUrl)
  .replace(/\/+$/, "");

const checks = [
  "/",
  "/dashboard",
  "/channels",
  "/inbox",
  "/message-logs",
  "/saved-replies",
  "/activity-logs",
  "/campaigns",
  "/products",
  "/orders",
  "/billing",
  "/exports",
  "/settings",
  "/license",
  "/api/dashboard/statistics",
  "/api/channels/status",
  "/api/channels/diagnostics",
  "/api/campaigns",
  "/api/billing/summary",
  "/api/billing/usage",
  "/api/auth/me",
  "/api/auth/permissions",
];

const pendingDeploymentPaths = new Set([
  "/exports",
  "/orders",
  "/products",
]);

const timeoutMs = 15000;
const safeFalseFlags = [
  "AUTH_ENFORCED",
  "PERMISSIONS_ENFORCED",
  "TENANT_MEMBERSHIP_ENFORCED",
  "STRICT_PROVIDER_WEBHOOK_ROUTING",
];

const authEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

const providerEnv = [
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_BUSINESS_ACCOUNT_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET",
  "MESSENGER_VERIFY_TOKEN",
];

const optionalEnv = [
  "NEXT_PUBLIC_APP_URL",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "WHATSAPP_API_VERSION",
  "MESSENGER_API_VERSION",
  "PRODUCTION_URL",
];

const billingEnvPatterns = [
  /^BILLING_/,
  /^PAYMENT_/,
  /^STRIPE_/,
  /^BKASH_/,
  /^NAGAD_/,
  /^SSLCOMMERZ_/,
];

const monitoringEnvPatterns = [
  /^SENTRY_/,
  /^NEXT_PUBLIC_SENTRY_/,
  /^ANALYTICS_/,
  /^NEXT_PUBLIC_ANALYTICS_/,
  /^MONITORING_/,
  /^NEXT_PUBLIC_VERCEL_ANALYTICS/,
  /^UPTIME_MONITOR_/,
];

function loadDotEnvFile() {
  const envPath = ".env";

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const name = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();

    if (!name || process.env[name] !== undefined) {
      continue;
    }

    process.env[name] = stripEnvQuotes(rawValue);
  }
}

function stripEnvQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function withTimeout(promise, label) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

function safeStatus(path, status) {
  if (status >= 200 && status < 400) return "PASS";
  if (status === 401 || status === 403) return "AUTH";
  if (status === 404 && pendingDeploymentPaths.has(path)) return "PEND";
  return "FAIL";
}

function hasValue(name) {
  return Boolean(process.env[name]?.trim());
}

function flagValue(name) {
  const raw = process.env[name];
  if (!raw) return "false";
  return raw.trim().toLowerCase();
}

function visibleValue(name) {
  return hasValue(name) ? "present" : "missing";
}

function classifyDatabaseUrl(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    return {
      present: false,
      classification: "missing",
      reasons: [],
    };
  }

  if (value.startsWith("file:")) {
    return {
      present: true,
      classification: "sqlite/local",
      reasons: ["uses file: scheme"],
    };
  }

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const port = url.port;
    const query = url.search.toLowerCase();
    const reasons = [];
    let pooledScore = 0;
    let directScore = 0;

    if (host.includes("pooler.supabase.com")) {
      pooledScore += 2;
      reasons.push("host matches Supabase pooler");
    }

    if (port === "6543") {
      pooledScore += 1;
      reasons.push("port 6543");
    }

    if (query.includes("pgbouncer") || query.includes("pool")) {
      pooledScore += 1;
      reasons.push("pool-related query option");
    }

    if (host.startsWith("db.") && host.includes("supabase.co")) {
      directScore += 2;
      reasons.push("host matches direct Supabase database");
    }

    if (port === "5432") {
      directScore += 1;
      reasons.push("port 5432");
    }

    let classification = "unknown";
    if (pooledScore > directScore && pooledScore > 0) {
      classification = "likely pooled";
    } else if (directScore > pooledScore && directScore > 0) {
      classification = "likely direct";
    }

    return {
      present: true,
      classification,
      reasons,
    };
  } catch {
    return {
      present: true,
      classification: "unknown",
      reasons: ["could not parse URL"],
    };
  }
}

function formatDbClassification(name) {
  const result = classifyDatabaseUrl(name);
  const detail = result.reasons.length ? ` (${result.reasons.join(", ")})` : "";
  return `${visibleValue(name)}; ${result.classification}${detail}`;
}

function collectPatternEnv(patterns) {
  return Object.keys(process.env)
    .filter((name) => patterns.some((pattern) => pattern.test(name)))
    .sort();
}

function addEnvCheck(checks, level, name, message) {
  checks.push({ level, name, message });
}

function auditEnvironment() {
  const checks = [];

  addEnvCheck(
    checks,
    baseUrl.startsWith("https://") ? "OK" : "WARN",
    "PRODUCTION_URL/NEXT_PUBLIC_APP_URL",
    baseUrl.startsWith("https://")
      ? "Production verification target uses HTTPS."
      : `Verification target is ${baseUrl}. Use HTTPS for production readiness checks.`,
  );

  const databaseUrl = classifyDatabaseUrl("DATABASE_URL");
  const directUrl = classifyDatabaseUrl("DIRECT_URL");

  addEnvCheck(
    checks,
    databaseUrl.present
      ? databaseUrl.classification === "likely direct" ? "WARN" : "OK"
      : "BLOCK",
    "DATABASE_URL",
    databaseUrl.present
      ? `DATABASE_URL is ${formatDbClassification("DATABASE_URL")}. Runtime should usually use the pooled Supabase connection.`
      : "DATABASE_URL is missing. Production runtime cannot safely use Prisma without it.",
  );

  if (databaseUrl.classification === "sqlite/local") {
    addEnvCheck(
      checks,
      "BLOCK",
      "DATABASE_URL",
      "DATABASE_URL appears to use SQLite. Production should use Supabase PostgreSQL.",
    );
  }

  addEnvCheck(
    checks,
    directUrl.present
      ? directUrl.classification === "likely pooled" ? "WARN" : "OK"
      : "WARN",
    "DIRECT_URL",
    directUrl.present
      ? `DIRECT_URL is ${formatDbClassification("DIRECT_URL")}. Prisma production migrations should use the direct Supabase connection.`
      : "DIRECT_URL is missing. Build/runtime may still work, but production migrations need a direct Supabase connection.",
  );

  if (directUrl.classification === "sqlite/local") {
    addEnvCheck(
      checks,
      "WARN",
      "DIRECT_URL",
      "DIRECT_URL appears to use SQLite/local file storage. Production migrations need the direct Supabase PostgreSQL URL.",
    );
  }

  addEnvCheck(
    checks,
    hasValue("SESSION_SECRET") ? "OK" : "WARN",
    "SESSION_SECRET",
    hasValue("SESSION_SECRET")
      ? "SESSION_SECRET is present in the local verification environment."
      : "SESSION_SECRET is missing locally. Confirm it exists in Vercel before production deployment.",
  );

  if (hasValue("SESSION_SECRET") && process.env.SESSION_SECRET.trim().length < 32) {
    addEnvCheck(
      checks,
      "WARN",
      "SESSION_SECRET",
      "SESSION_SECRET is present but short. Use a long random secret for production.",
    );
  }

  for (const name of safeFalseFlags) {
    const value = flagValue(name);
    const level = value === "true" ? "BLOCK" : value === "false" ? "OK" : "WARN";
    const message = value === "true"
      ? `${name}=true. Keep this false for Beta v1.0 production unless staging approval is complete.`
      : value === "false"
        ? `${name}=false safe beta default is active.`
        : `${name} has non-standard value "${value}". Use exactly true or false.`;

    addEnvCheck(checks, level, name, message);
  }

  const supabaseUrlPresent = hasValue("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonPresent = hasValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supabaseLevel = supabaseUrlPresent && supabaseAnonPresent
    ? "OK"
    : supabaseUrlPresent === supabaseAnonPresent
      ? "INFO"
      : "WARN";
  addEnvCheck(
    checks,
    supabaseLevel,
    "Supabase Auth",
    `NEXT_PUBLIC_SUPABASE_URL is ${visibleValue("NEXT_PUBLIC_SUPABASE_URL")}; NEXT_PUBLIC_SUPABASE_ANON_KEY is ${visibleValue("NEXT_PUBLIC_SUPABASE_ANON_KEY")}. Both are needed together for login/session testing.`,
  );

  for (const name of authEnv) {
    addEnvCheck(
      checks,
      hasValue(name) ? "INFO" : "INFO",
      name,
      `${name} is ${visibleValue(name)}. This value is public anon/browser configuration, not a service-role secret.`,
    );
  }

  const whatsappOutboundReady = hasValue("WHATSAPP_ACCESS_TOKEN") && hasValue("WHATSAPP_PHONE_NUMBER_ID");
  const whatsappWebhookReady = hasValue("WHATSAPP_VERIFY_TOKEN");
  addEnvCheck(
    checks,
    whatsappOutboundReady ? "OK" : "INFO",
    "WhatsApp outbound env",
    whatsappOutboundReady
      ? "WhatsApp env fallback has Phone Number ID and Access Token present."
      : "WhatsApp real sending should use saved Settings or env fallback with Phone Number ID and Access Token present.",
  );
  addEnvCheck(
    checks,
    whatsappWebhookReady ? "OK" : "INFO",
    "WhatsApp webhook env",
    whatsappWebhookReady
      ? "WhatsApp Verify Token env fallback is present."
      : "WhatsApp webhook verification can use saved Settings; env fallback Verify Token is not present locally.",
  );

  const messengerWebhookReady = hasValue("MESSENGER_VERIFY_TOKEN");
  addEnvCheck(
    checks,
    messengerWebhookReady ? "OK" : "INFO",
    "Messenger webhook env",
    messengerWebhookReady
      ? "Messenger Verify Token env fallback is present."
      : "Messenger webhook verification can use saved Settings; env fallback Verify Token is not present locally.",
  );

  for (const name of providerEnv) {
    addEnvCheck(checks, hasValue(name) ? "INFO" : "INFO", name, `${name} is ${visibleValue(name)}. Value is not printed.`);
  }

  for (const name of optionalEnv) {
    addEnvCheck(checks, "INFO", name, `${name} is ${visibleValue(name)}.`);
  }

  const billingEnv = collectPatternEnv(billingEnvPatterns);
  addEnvCheck(
    checks,
    "INFO",
    "Billing env",
    billingEnv.length
      ? `Detected billing/payment env names: ${billingEnv.join(", ")}. Values are not printed.`
      : "No billing/payment gateway env names detected. Manual billing remains expected for Beta v1.0.",
  );

  const monitoringEnv = collectPatternEnv(monitoringEnvPatterns);
  addEnvCheck(
    checks,
    "INFO",
    "Monitoring env",
    monitoringEnv.length
      ? `Detected monitoring/analytics env names: ${monitoringEnv.join(", ")}. Values are not printed.`
      : "No monitoring/analytics env names detected locally.",
  );

  return checks;
}

async function checkPath(path) {
  const url = `${baseUrl}${path}`;
  try {
    const response = await withTimeout(
      fetch(url, {
        method: "GET",
        headers: {
          Accept: path.startsWith("/api/") ? "application/json" : "text/html,application/json",
        },
      }),
      path,
    );

    return {
      path,
      status: response.status,
      result: safeStatus(path, response.status),
    };
  } catch (error) {
    return {
      path,
      status: null,
      result: "FAIL",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

console.log(`ARBCore SwiftConnect production verification`);
console.log(`Base URL: ${baseUrl}`);
console.log("Mode: read-only GET checks; no send, webhook POST, or mutation endpoints are called.");
console.log("");

console.log("Environment readiness audit");
console.log("Secrets/tokens are checked by presence only and never printed.");
const envChecks = auditEnvironment();
for (const item of envChecks) {
  console.log(`${item.level.padEnd(5)} ${item.name} - ${item.message}`);
}
console.log("");

const results = [];
for (const path of checks) {
  const result = await checkPath(path);
  results.push(result);

  const status = result.status === null ? "n/a" : result.status;
  const error = result.error ? ` - ${result.error}` : "";
  console.log(`${result.result.padEnd(4)} ${String(status).padEnd(3)} ${result.path}${error}`);
}

const passCount = results.filter((item) => item.result === "PASS" || item.result === "AUTH" || item.result === "PEND").length;
const failCount = results.length - passCount;
const envBlockCount = envChecks.filter((item) => item.level === "BLOCK").length;
const envWarnCount = envChecks.filter((item) => item.level === "WARN").length;

console.log("");
console.log(`Summary: ${passCount}/${results.length} checks passed, returned expected auth gating, or are pending deployment.`);
console.log(`Environment audit: ${envBlockCount} blocker(s), ${envWarnCount} warning(s).`);

if (failCount > 0 || envBlockCount > 0) {
  if (failCount > 0) {
    console.log(`${failCount} route check(s) failed. Review Vercel deployment, environment variables, and route health.`);
  }
  if (envBlockCount > 0) {
    console.log(`${envBlockCount} environment blocker(s) found. Restore safe Beta v1.0 production defaults before deployment.`);
  }
  process.exitCode = 1;
}
