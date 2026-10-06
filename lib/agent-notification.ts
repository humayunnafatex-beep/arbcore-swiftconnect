import { prisma } from "@/lib/prisma";
import { getSafeWhatsAppProviderErrorSummary, sendWhatsAppTextMessage } from "@/lib/whatsapp-service";

export type AgentCompletionNotificationInput = {
  companyId: string;
  recipient: string;
  task: string;
  status?: "COMPLETED" | "FAILED" | "NEEDS_ATTENTION";
  summary?: string;
  nextJob?: string;
};

export async function sendAgentCompletionNotification(input: AgentCompletionNotificationInput) {
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    select: {
      id: true,
      whatsappPhoneNumberId: true,
      whatsappAccessToken: true
    }
  });

  if (!company?.whatsappPhoneNumberId || !company.whatsappAccessToken) {
    return { success: false as const, reason: "not_configured" as const };
  }

  const recipient = input.recipient.replace(/[^\d]/g, "");
  const body = buildCompletionMessage(input);

  const result = await sendWhatsAppTextMessage({
    phoneNumberId: company.whatsappPhoneNumberId,
    accessToken: company.whatsappAccessToken,
    to: recipient,
    body
  });

  if (!result.success) {
    const safeError = getSafeWhatsAppProviderErrorSummary(result.providerError);

    await prisma.messageLog.create({
      data: {
        companyId: company.id,
        channel: "WHATSAPP",
        body,
        direction: "OUTBOUND",
        status: "FAILED",
        errorMessage: safeError || result.error
      }
    }).catch(() => undefined);

    return {
      success: false as const,
      reason: "provider_error" as const,
      providerStatus: result.providerStatus,
      providerError: safeError
    };
  }

  await prisma.messageLog.create({
    data: {
      companyId: company.id,
      channel: "WHATSAPP",
      body,
      direction: "OUTBOUND",
      status: "SENT",
      providerMessageId: result.providerMessageId,
      sentAt: new Date()
    }
  }).catch(() => undefined);

  return {
    success: true as const,
    providerMessageId: result.providerMessageId,
    body
  };
}

function buildCompletionMessage(input: AgentCompletionNotificationInput) {
  const status = input.status ?? "COMPLETED";
  const marker = status === "COMPLETED" ? "✅" : status === "FAILED" ? "❌" : "⚠️";
  const lines = [
    `${marker} ARBCore SwiftConnect Agent Update`,
    `Task: ${input.task.trim()}`,
    `Status: ${status}`
  ];

  if (input.summary?.trim()) lines.push(`Summary: ${input.summary.trim()}`);
  if (input.nextJob?.trim()) lines.push(`Next: ${input.nextJob.trim()}`);

  return lines.join("\n");
}
