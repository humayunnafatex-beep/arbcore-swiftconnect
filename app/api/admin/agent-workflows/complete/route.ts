import { z } from "zod";
import { handleApiError, ok, parseJson } from "@/lib/api";
import { requireAgentInternalToken } from "@/lib/agent-internal-auth";
import { sendAgentCompletionNotification } from "@/lib/agent-notification";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  idempotencyKey: z.string().trim().min(8).max(128),
  task: z.string().trim().min(2).max(200),
  summary: z.string().trim().max(800).optional(),
  nextJob: z.string().trim().max(400).optional(),
  notify: z.boolean().optional().default(true)
});

export async function POST(request: Request) {
  try {
    const companyId = requireAgentInternalToken(request);
    const input = await parseJson(request, schema);

    const existing = await prisma.activityLog.findFirst({
      where: {
        companyId,
        action: "AGENT_TASK_COMPLETED",
        entityType: "AGENT_WORKFLOW",
        entityId: input.idempotencyKey
      },
      select: { id: true }
    });

    if (existing) {
      return ok({
        duplicate: true,
        completionRecorded: true,
        notificationAttempted: false,
        nextJobQueued: Boolean(input.nextJob)
      });
    }

    await prisma.activityLog.create({
      data: {
        companyId,
        actorUserId: "",
        actorName: "ARBCore Agent",
        actorEmail: "",
        actorRole: "SYSTEM",
        action: "AGENT_TASK_COMPLETED",
        entityType: "AGENT_WORKFLOW",
        entityId: input.idempotencyKey,
        entityLabel: input.task.slice(0, 180),
        summary: (input.summary || "Agent task completed.").slice(0, 240),
        metadataSummary: input.nextJob ? "A next job was supplied for continuation." : "No next job supplied."
      }
    });

    if (input.nextJob) {
      await prisma.activityLog.create({
        data: {
          companyId,
          actorUserId: "",
          actorName: "ARBCore Agent",
          actorEmail: "",
          actorRole: "SYSTEM",
          action: "AGENT_NEXT_JOB_QUEUED",
          entityType: "AGENT_WORKFLOW",
          entityId: input.idempotencyKey,
          entityLabel: input.nextJob.slice(0, 180),
          summary: "Next approved job is queued for the orchestrator.",
          metadataSummary: `Previous task: ${input.task}`.slice(0, 300)
        }
      });
    }

    let notificationAttempted = false;
    let notificationSent = false;

    if (input.notify) {
      notificationAttempted = true;
      const recipient = (process.env.AGENT_COMPLETION_WHATSAPP_TO || "").replace(/[^\d]/g, "");

      if (recipient) {
        const result = await sendAgentCompletionNotification({
          companyId,
          recipient,
          task: input.task,
          status: "COMPLETED",
          summary: input.summary,
          nextJob: input.nextJob
        });
        notificationSent = result.success;
      }
    }

    return ok({
      duplicate: false,
      completionRecorded: true,
      notificationAttempted,
      notificationSent,
      nextJobQueued: Boolean(input.nextJob),
      nextJob: input.nextJob || null
    });
  } catch (error) {
    return handleApiError(error);
  }
}
