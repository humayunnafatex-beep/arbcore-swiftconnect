# Grandfather Agent QA hardening

Scope: approved read-only security, tenant, and provider readiness jobs. No new paid
services, schema changes, credentials, or business-data writes.

QA_SPECIALIST validates result identity, completion and each mandatory detail before
continuation. Provider readiness now requires strict webhook routing as well as zero
duplicate identifiers. Plans aggregate passed/failed/skipped steps and stop on the
first failed result, absent evidence or unavailable specialist.

Idempotency is scoped by company and job, with plan included in Grandfather keys.
A PostgreSQL transaction-scoped advisory lock prevents concurrent execution of the
same key. A conflicting request returns 409. Read checks and audit inserts share the
transaction connection. Notifications happen only after commit and cannot trigger
job retries. Long keys use SHA-256 rather than truncation.

Successful results are persisted as JSON in the existing metadataSummary text field.
Replays validate cached evidence; failures stay stopped for the same key. Historical
logs without valid evidence block continuation. A new run ID after review initiates
a fresh check. Cached success describes its original run, not current readiness.

Authenticated GET /api/admin/grandfather-agent/run?plan=FULL_READINESS is a fresh
read-only readiness path: no audit writes, notification, retries, or chaining.
POST still writes normal agent audit logs and may notify. Do not invoke POST during
a no-production-data-change verification session.

Run isolated tests with node --test tests/agent-hardening.cjs. They load actual TS
modules with mocked storage, locking, job handlers and notifications, without
production connectivity. Concurrency tests validate orchestration protocol; real
PostgreSQL locking and authenticated execution are not proven by these mocks.

Production smoke: verify deployment commit and READY status, health/database GET,
logged-out dashboard redirect and unauthenticated GET/POST runner rejection. These
do not validate authenticated specialist outcomes. Do not expand into mutating jobs
until separately approved. Crash recovery is safe to replay for the currently approved
read-only jobs; this design does not promise exactly-once external effects.
