import { prisma } from "@/lib/prisma";
import { sendAgentCompletionNotification } from "@/lib/agent-notification";
import { runApprovedAgentJob, type ApprovedAgentJobType, type AgentJobResult } from "@/lib/agent-job-registry";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [250, 1000];

export async function runAgentJobWithRetry(input: {
  companyId: string;
  jobType: ApprovedAgentJobType;
  idempotencyKey: string;
  notify?: boolean;
}) {
  const entityId = `${input.jobType}:${input.idempotencyKey}`;

  const existing = await prisma.activityLog.findFirst({
    where: {
      companyId: input.companyId,
      action: "AGENT_JOB_COMPLETED",
      entityType: "AGENT_JOB",
      entityId
    },
    select: { id: true, summary: true }
  });

  if (existing) {
    return {
      duplicate: true,
      completed: true,
      attempts: 0,
      result: null as AgentJobResult | null
    };
  }

  let lastError = "Unknown agent job failure.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await logEvent({
      companyId: input.companyId,
      action: attempt === 1 ? "AGENT_JOB_STARTED" : "AGENT_JOB_RETRYING",
      entityId,
      entityLabel: input.jobType,
      summary: `Attempt ${attempt} of ${MAX_ATTEMPTS}.`
    });

    try {
      const result = await runApprovedAgentJob(input.jobType);

      if (!result.ok) {
        throw new Error(result.summary);
      }

      await logEvent({
        companyId: input.companyId,
        action: "AGENT_JOB_COMPLETED",
        entityId,
        entityLabel: input.jobType,
        summary: result.summary,
        metadataSummary: compactDetails(result.details)
      });

      if (input.notify !== false) {
        await notify({
          companyId: input.companyId,
          jobType: input.jobType,
          status: "COMPLETED",
          summary: result.summary
        });
      }

      return {
        duplicate: false,
        completed: true,
        attempts: attempt,
        result
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Agent job failed.";

      await logEvent({
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

  if (input.notify !== false) {
    await notify({
      companyId: input.companyId,
      jobType: input.jobType,
      status: "FAILED",
      summary: lastError
    });
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

async function logEvent(input: {
  companyId: string;
  action: string;
  entityId: string;
  entityLabel: string;
  summary: string;
  metadataSummary?: string;
}) {
  await prisma.activityLog.create({
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
      metadataSummary: (input.metadataSummary || "").slice(0, 300)
    }
  });
}

function compactDetails(details: Record<string, string | number | boolean>) {
  return Object.entries(details)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join("; ")
    .slice(0, 300);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
