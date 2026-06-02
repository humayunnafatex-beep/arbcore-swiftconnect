const defaultUrl = "https://arbcore-swiftconnect.vercel.app";

const baseUrl = (process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_APP_URL || defaultUrl)
  .replace(/\/+$/, "");

const checks = [
  "/",
  "/dashboard",
  "/channels",
  "/inbox",
  "/message-logs",
  "/campaigns",
  "/billing",
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

const timeoutMs = 15000;

function withTimeout(promise, label) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

function safeStatus(status) {
  if (status >= 200 && status < 400) return "PASS";
  if (status === 401 || status === 403) return "AUTH";
  return "FAIL";
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
      result: safeStatus(response.status),
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

const results = [];
for (const path of checks) {
  const result = await checkPath(path);
  results.push(result);

  const status = result.status === null ? "n/a" : result.status;
  const error = result.error ? ` - ${result.error}` : "";
  console.log(`${result.result.padEnd(4)} ${String(status).padEnd(3)} ${result.path}${error}`);
}

const passCount = results.filter((item) => item.result === "PASS" || item.result === "AUTH").length;
const failCount = results.length - passCount;

console.log("");
console.log(`Summary: ${passCount}/${results.length} checks passed or returned expected auth gating.`);

if (failCount > 0) {
  console.log(`${failCount} check(s) failed. Review Vercel deployment, environment variables, and route health.`);
  process.exitCode = 1;
}
