import { prisma } from "@/lib/prisma";
import {
  AI_AUTO_REPLY_INSTRUCTIONS,
  AI_HANDOFF_NOTICE,
  buildAiAutoReplyPrompt,
  detectAiEscalation,
  interpretAiReply,
  isAiAutoReplyEnabled,
  type AiAutoReplyFacts
} from "@/lib/ai-auto-reply";

export type AiAutoReplySendResult = { success: true; providerMessageId?: string } | { success: false; error: string };

export async function runAiAutoReply({
  companyId,
  channel,
  customerKey,
  contactId,
  inboundText,
  canSend,
  send
}: {
  companyId: string;
  channel: "WHATSAPP" | "MESSENGER";
  customerKey: string;
  contactId?: string | null;
  inboundText: string;
  canSend: boolean;
  send: (body: string) => Promise<AiAutoReplySendResult>;
}) {
  if (!canSend || !isAiAutoReplyEnabled()) {
    return;
  }

  // Messenger non-text events (reactions, stickers) arrive as a placeholder, not a question.
  if (!inboundText.trim() || inboundText === "[messenger event]") {
    return;
  }

  const escalation = detectAiEscalation(inboundText);

  if (escalation.escalate) {
    await prisma.autoReplyEvent.create({
      data: {
        companyId,
        ruleName: `AI Escalation: ${escalation.reason}`,
        channel,
        customerKey,
        inboundTextPreview: previewText(inboundText),
        status: "ESCALATED"
      }
    });

    await sendAndRecord({ companyId, channel, contactId, body: AI_HANDOFF_NOTICE, send });
    return;
  }

  const facts = await loadAiAutoReplyFacts({ companyId, channel, customerKey, contactId, latestMessage: inboundText });
  const prompt = buildAiAutoReplyPrompt(channel, inboundText, facts);
  const event = await prisma.autoReplyEvent.create({
    data: {
      companyId,
      ruleName: "AI Auto Reply",
      channel,
      customerKey,
      inboundTextPreview: previewText(inboundText),
      status: "ATTEMPTED"
    }
  });

  let rawReply: string;

  try {
    rawReply = await requestOpenAiReply(prompt);
  } catch (error) {
    console.error("AI auto reply generation failed:", error instanceof Error ? error.message : "Unknown error");
    await prisma.autoReplyEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", errorMessage: "AI reply could not be generated." }
    });
    return;
  }

  await prisma.aiGeneration.create({
    data: {
      companyId,
      prompt,
      context: `AI auto reply for ${channel}`,
      output: rawReply,
      model: getOpenAiModel()
    }
  });

  const decision = interpretAiReply(rawReply);

  if (decision.action === "handoff") {
    await prisma.autoReplyEvent.update({
      where: { id: event.id },
      data: { status: "ESCALATED", errorMessage: "AI could not answer from saved data; sent to staff." }
    });
    await sendAndRecord({ companyId, channel, contactId, body: AI_HANDOFF_NOTICE, send });
    return;
  }

  await prisma.autoReplyEvent.update({
    where: { id: event.id },
    data: { replyPreview: previewText(decision.text) }
  });
  await sendAndRecord({ companyId, channel, contactId, eventId: event.id, body: decision.text, send });
}

async function sendAndRecord({
  companyId,
  channel,
  contactId,
  eventId,
  body,
  send
}: {
  companyId: string;
  channel: "WHATSAPP" | "MESSENGER";
  contactId?: string | null;
  eventId?: string;
  body: string;
  send: (body: string) => Promise<AiAutoReplySendResult>;
}) {
  const result = await send(body);
  const safeError = result.success ? "" : previewText(result.error || "Provider rejected the auto reply.", 280);

  if (eventId) {
    await prisma.autoReplyEvent.update({
      where: { id: eventId },
      data: {
        status: result.success ? "SENT" : "FAILED",
        providerMessageId: result.success ? result.providerMessageId ?? "" : "",
        errorMessage: safeError
      }
    });
  }

  await prisma.messageLog.create({
    data: {
      companyId,
      contactId: contactId ?? undefined,
      channel,
      body,
      direction: "OUTBOUND",
      status: result.success ? "SENT" : "FAILED",
      providerMessageId: result.success ? result.providerMessageId : undefined,
      errorMessage: result.success ? undefined : safeError,
      sentAt: result.success ? new Date() : undefined
    }
  });
}

async function loadAiAutoReplyFacts({
  companyId,
  channel,
  customerKey,
  contactId,
  latestMessage
}: {
  companyId: string;
  channel: string;
  customerKey: string;
  contactId?: string | null;
  latestMessage: string;
}): Promise<AiAutoReplyFacts> {
  const [knowledgeFacts, products, customerOrders, recentLogs] = await Promise.all([
    prisma.businessKnowledgeFact.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 20,
      select: { category: true, title: true, content: true }
    }),
    prisma.product.findMany({
      where: { companyId, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: { name: true, price: true, availableSizes: true, stockNote: true }
    }),
    prisma.order.findMany({
      where: {
        companyId,
        OR: [{ channel, customerKey }, ...(contactId ? [{ contactId }] : [])]
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        orderNumber: true,
        modelName: true,
        size: true,
        quantity: true,
        totalAmount: true,
        paymentStatus: true,
        orderStatus: true
      }
    }),
    contactId
      ? prisma.messageLog.findMany({
          where: { companyId, contactId, channel },
          orderBy: { createdAt: "desc" },
          take: 7,
          select: { direction: true, body: true }
        })
      : Promise.resolve([])
  ]);

  // The inbound message is logged before auto reply runs, so drop it from history.
  const [newest, ...older] = recentLogs;
  const previousLogs = newest && newest.direction === "INBOUND" && newest.body === latestMessage ? older : recentLogs;

  return {
    knowledgeFacts,
    products,
    customerOrders,
    history: previousLogs.reverse()
  };
}

async function requestOpenAiReply(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? "";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      instructions: AI_AUTO_REPLY_INSTRUCTIONS,
      input: prompt
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  return payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => typeof item.text === "string")?.text ?? "";
}

function getOpenAiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function previewText(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}
