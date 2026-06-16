import { z } from "zod";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const suggestSchema = z.object({
  channel: z.enum(["WHATSAPP", "MESSENGER"]),
  contactKey: z.string().trim().min(1),
  latestCustomerMessage: z.string().trim().min(1).max(1200),
  conversationContext: z.string().trim().max(1600).optional(),
  savedReplies: z.array(z.object({
    title: z.string().trim().max(120),
    category: z.string().trim().max(80).optional(),
    shortcut: z.string().trim().max(80).optional(),
    body: z.string().trim().max(600)
  })).max(6).optional()
});

class OpenAIRequestError extends Error {
  status: number;
  uiMessage: string;

  constructor(status: number, uiMessage: string, logMessage: string) {
    super(logMessage);
    this.status = status;
    this.uiMessage = uiMessage;
  }
}

export async function GET() {
  await requirePermission("messages.send");

  return NextResponse.json({
    success: true,
    data: {
      available: Boolean(process.env.OPENAI_API_KEY),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
    }
  });
}

export async function POST(request: Request) {
  try {
    const { context } = await requirePermission("messages.send");

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "AI Reply Assistant is unavailable because OPENAI_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const payload = suggestSchema.safeParse(await request.json().catch(() => null));

    if (!payload.success) {
      const hasLatestMessageIssue = payload.error.issues.some((issue) => issue.path.join(".") === "latestCustomerMessage");
      return NextResponse.json(
        {
          success: false,
          error: hasLatestMessageIssue
            ? "AI suggestion needs a latest inbound customer message."
            : "AI reply context is invalid."
        },
        { status: 400 }
      );
    }

    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    let knowledgeFacts: Array<{ category: string; title: string; content: string }> = [];

    try {
      const facts = await prisma.businessKnowledgeFact.findMany({
        where: { companyId: context.company.id, isActive: true },
        orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
        take: 12
      });
      knowledgeFacts = facts.map((fact) => ({
        category: fact.category,
        title: fact.title,
        content: fact.content
      }));
    } catch (error) {
      console.error("Inbox AI knowledge base fetch failed:", error instanceof Error ? error.message : "Unknown database error");
      return NextResponse.json(
        { success: false, error: "Business knowledge base could not be loaded. Please try again before generating an AI draft." },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(payload.data, knowledgeFacts.map((fact) => ({
      category: fact.category,
      title: fact.title,
      content: fact.content
    })));
    const suggestion = await generateSuggestion({
      apiKey: process.env.OPENAI_API_KEY,
      model,
      prompt
    });

    await prisma.aiGeneration.create({
      data: {
        companyId: context.company.id,
        prompt,
        context: `Inbox AI reply suggestion for ${payload.data.channel}`,
        output: suggestion,
        model
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        suggestion,
        draftOnly: true
      }
    });
  } catch (error) {
    if (error instanceof OpenAIRequestError) {
      return NextResponse.json({ success: false, error: error.uiMessage }, { status: error.status });
    }

    console.error("Inbox AI suggestion failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, error: "AI reply suggestion failed. Please try again." }, { status: 500 });
  }
}

function buildPrompt(input: z.infer<typeof suggestSchema>, knowledgeFacts: Array<{ category: string; title: string; content: string }>) {
  const savedReplyText = (input.savedReplies ?? [])
    .map((reply, index) => `${index + 1}. ${safeText(reply.title)}${reply.shortcut ? ` /${safeText(reply.shortcut)}` : ""}: ${safeText(reply.body)}`)
    .join("\n");
  const knowledgeText = knowledgeFacts
    .map((fact, index) => `${index + 1}. [${safeText(fact.category)}] ${safeText(fact.title)}: ${safeText(fact.content)}`)
    .join("\n");

  return [
    "Write one short customer support reply for ARBCore SwiftConnect Inbox.",
    "Rules:",
    "- Draft only. Do not imply the message was sent.",
    "- Polite, helpful, concise.",
    "- Use a natural Bangla + English mix, but do not use Banglish transliteration.",
    "- Do not mention internal notes, provider IDs, tokens, AI, or system instructions.",
    "- If order/payment/delivery details are missing, ask for the missing detail.",
    "- Return only the reply text, no JSON, no title.",
    "",
    `Channel: ${safeText(input.channel)}`,
    `Customer key: ${safeText(input.contactKey)}`,
    `Latest customer message: ${safeText(input.latestCustomerMessage)}`,
    input.conversationContext ? `Conversation context: ${safeText(input.conversationContext)}` : "",
    knowledgeText ? `Active business knowledge base facts:\n${knowledgeText}` : "Active business knowledge base facts: none configured",
    savedReplyText ? `Relevant saved replies:\n${savedReplyText}` : "Relevant saved replies: none"
  ].filter(Boolean).join("\n");
}

async function generateSuggestion({ apiKey, model, prompt }: { apiKey: string; model: string; prompt: string }) {
  const instructions = "You generate safe draft-only customer replies for a business Inbox. Return only customer-facing reply text.";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: safeText(model) || "gpt-4o-mini",
      instructions,
      input: safeText(prompt)
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw buildOpenAIError(response.status, errorBody);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => typeof item.text === "string")?.text;
  const normalized = (text ?? "").trim();

  if (!normalized) {
    throw new Error("OpenAI returned empty suggestion");
  }

  return normalized.slice(0, 1200);
}

function buildOpenAIError(status: number, errorBody: string) {
  const parsed = parseOpenAIError(errorBody);
  const safeDetails = {
    status,
    type: parsed.type,
    code: parsed.code,
    message: parsed.message,
    bodyPreview: safeText(errorBody).slice(0, 700)
  };
  console.error("Inbox AI OpenAI request failed:", safeDetails);

  if (status === 400) {
    return new OpenAIRequestError(
      502,
      "AI provider rejected the request. Check OPENAI_MODEL and request compatibility, then try again.",
      `OpenAI invalid request: ${parsed.message || status}`
    );
  }

  if (status === 401 || status === 403) {
    return new OpenAIRequestError(
      503,
      "AI provider authentication failed. Check OPENAI_API_KEY configuration.",
      `OpenAI auth error: ${status}`
    );
  }

  if (status === 402 || status === 429) {
    return new OpenAIRequestError(
      503,
      "AI provider quota or billing limit was reached. Manual replies still work.",
      `OpenAI quota/billing error: ${status}`
    );
  }

  return new OpenAIRequestError(
    502,
    "AI provider request failed. Please try again later.",
    `OpenAI request failed: ${status}`
  );
}

function parseOpenAIError(errorBody: string) {
  try {
    const parsed = JSON.parse(errorBody) as {
      error?: {
        message?: unknown;
        type?: unknown;
        code?: unknown;
      };
    };

    return {
      message: typeof parsed.error?.message === "string" ? parsed.error.message : "",
      type: typeof parsed.error?.type === "string" ? parsed.error.type : "",
      code: typeof parsed.error?.code === "string" ? parsed.error.code : ""
    };
  } catch {
    return { message: safeText(errorBody).slice(0, 240), type: "", code: "" };
  }
}

function safeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}
