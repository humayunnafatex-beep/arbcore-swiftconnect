import { reviewSpecialistResult } from "@/lib/agent-specialists";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sendAgentCompletionNotification } from "@/lib/agent-notification";
import { runApprovedAgentJob, type ApprovedAgentJobType, type AgentJobResult, isApprovedAgentJobType } from "@/lib/agent-job-registry";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [250, 1000];

export async function runAgentJobWithRetry(input: {
  companyId: string;
  jobType: ApprovedAgentJobType;
  idempotencyKey: string;
  notify?: boolean;
}) {
  if (!isApprovedAgentJobType(input.jobType) || !input.companyId.trim() ||
      !input.idempotencyKey.trim() || input.idempotencyKey.length > 160) {
    throw new ApiError(400, "INVALID_AGENT_JOB", "A valid approved job and scoped idempotency key are required.");
  }
  const rawId = `${input.jobType}:${input.idempotencyKey}`;
  const entityId = rawId.length <= 128 ? rawId : `sha256:${createHash("sha256").update(rawId).digest("hex")}`;
  const lockKey = createHash("sha256").update(JSON.stringify([input.companyId, entityId])).digest().readBigInt64BE();
  const outcome = await prisma.$transaction(async (tx) => {
    const locks = await tx.$queryRaw<{ acquired: boolean }[]>`SELECT pg_try_advisory_xact_lock(${lockKey}) AS acquired`;
    if (!locks[0]?.acquired) {
      throw new ApiError(409, "AGENT_JOB_IN_PROGRESS", "This scoped job is already running. Retry with the same key later.");
    }
    return executeJob(input, entityId, tx);
  }, { maxWait: 5000, timeout: 30000 });
  // Notifications happen after commit and never cause job retries.
  if (!outcome.duplicate && input.notify !== false) {
    await notify({ companyId: input.companyId, jobType: input.jobType,
      status: outcome.completed ? "COMPLETED" : "FAILED",
      summary: outcome.result?.summary ?? ("error" in outcome ? outcome.error : undefined) ?? "Agent job failed." });
  }
  return outcome;
}

async function executeJob(input: {
  companyId: string; jobType: ApprovedAgentJobType; idempotencyKey: string; notify?: boolean;
}, entityId: string, tx: Prisma.TransactionClient) {

  const existing = await tx.activityLog.findFirst({
    where: {
      companyId: input.companyId,
      action: { in: ["AGENT_JOB_COMPLETED", "AGENT_JOB_FAILED"] },
      entityType: "AGENT_JOB",
      entityId
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, action: true, summary: true, metadataSummary: true }
  });

  if (existing) {
    let result: AgentJobResult | null = null;
    try {
      const cached = JSON.parse(existing.metadataSummary);
      if (cached.jobType === input.jobType && cached.ok === true &&
          typeof cached.summary === "string" && cached.details && typeof cached.details === "object" &&
          reviewSpecialistResult(input.jobType, { completed: true, result: cached }).passed) result = cached;
    } catch { /* Legacy completion without verifiable evidence fails closed. */ }
    return { duplicate: true, completed: existing.action === "AGENT_JOB_COMPLETED" && result !== null,
      attempts: 0, result, error: result ? undefined : "Previous failure or missing completion evidence; use a new run ID after review." };
  }

  let lastError = "Unknown agent job failure.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await logEvent(tx, {
      companyId: input.companyId,
      action: attempt === 1 ? "AGENT_JOB_STARTED" : "AGENT_JOB_RETRYING",
      entityId,
      entityLabel: input.jobType,
      summary: `Attempt ${attempt} of ${MAX_ATTEMPTS}.`
    });

    try {
      const result = await runApprovedAgentJob(input.jobType, tx);

      if (!reviewSpecialistResult(input.jobType, { completed: true, result }).passed) {
        throw new Error(result.summary);
      }

      await logEvent(tx, {
        companyId: input.companyId,
        action: "AGENT_JOB_COMPLETED",
        entityId,
        entityLabel: input.jobType,
        summary: result.summary,
        metadataSummary: JSON.stringify(result)
      });

      return {
        duplicate: false,
        completed: true,
        attempts: attempt,
        result
      };
    } catch {
      lastError = "Agent job execution failed; review server diagnostics before retrying.";

      await logEvent(tx, {
        companyId: input.companyId,
        action: attempt < MAX_ATTEMPTS ? "AGENT_JOB_ATTEMPT_FAILED" : "AGENT_JOB_FAILED",
        entityId,
        entityLabel: input.jobType,
        summary: lastError
      });

      if (attempt < MAX_ATTEMPTS) {
        await delay(RETRY_DELAYS_MS[attempt - 1] ?? 1000);
      }
    }
  }

  return {
    duplicate: false,
    completed: false,
    attempts: MAX_ATTEMPTS,
    result: null as AgentJobResult | null,
    error: lastError
  };
}

async function notify(input: {
  companyId: string;
  jobType: ApprovedAgentJobType;
  status: "COMPLETED" | "FAILED";
  summary: string;
}) {
  const recipient = (process.env.AGENT_COMPLETION_WHATSAPP_TO || "").replace(/[^\d]/g, "");
  if (!recipient) return;

  await sendAgentCompletionNotification({
    companyId: input.companyId,
    recipient,
    task: input.jobType,
    status: input.status,
    summary: input.summary
  }).catch(() => undefined);
}

async function logEvent(tx: Prisma.TransactionClient, input: {
  companyId: string;
  action: string;
  entityId: string;
  entityLabel: string;
  summary: string;
  metadataSummary?: string;
}) {
  await tx.activityLog.create({
    data: {
      companyId: input.companyId,
      actorUserId: "",
      actorName: "ARBCore Orchestrator",
      actorEmail: "",
      actorRole: "SYSTEM",
      action: input.action,
      entityType: "AGENT_JOB",
      entityId: input.entityId.slice(0, 128),
      entityLabel: input.entityLabel.slice(0, 180),
      summary: input.summary.slice(0, 240),
      metadataSummary: input.metadataSummary || ""
    }
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
