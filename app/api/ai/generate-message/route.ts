import { created, handleApiError, parseJson } from "@/lib/api";
import { getCurrentAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aiGenerateMessageSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerationType =
  | "campaign_message"
  | "product_offer"
  | "follow_up"
  | "auto_reply"
  | "bangla_english_rewrite"
  | "short_professional_rewrite";

type AiOutput = {
  generatedMessage: string;
  suggestedTitle: string;
  language: string;
  tone: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    model: string;
    provider: "openai" | "mock";
    usedFallback: boolean;
  };
};

const generationLabels: Record<GenerationType, string> = {
  campaign_message: "Campaign Message",
  product_offer: "Product Offer",
  follow_up: "Follow-up Message",
  auto_reply: "Auto-reply Suggestion",
  bangla_english_rewrite: "Bangla-English Rewrite",
  short_professional_rewrite: "Short Professional Rewrite"
};

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, aiGenerateMessageSchema);
    const { company } = await getCurrentAuthContext();
    const generationType = input.generationType ?? inferGenerationType(input.context);
    const language = input.language ?? inferLanguage(input.context);
    const tone = input.tone ?? "professional";
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    let provider: "openai" | "mock" = "mock";
    let usedFallback = !process.env.OPENAI_API_KEY;
    let fallbackError: string | undefined;
    let result: AiOutput;

    if (process.env.OPENAI_API_KEY) {
      try {
        result = await generateWithOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          model,
          generationType,
          language,
          tone,
          input
        });
        provider = "openai";
        usedFallback = false;
      } catch (error) {
        fallbackError = error instanceof Error ? error.message : "OpenAI request failed.";
        result = generateMockMessage({ generationType, language, tone, input, model, fallbackError });
        usedFallback = true;
      }
    } else {
      result = generateMockMessage({ generationType, language, tone, input, model });
    }

    const generation = await prisma.aiGeneration.create({
      data: {
        companyId: company.id,
        prompt: buildUserPrompt(generationType, input),
        context: input.context ?? generationLabels[generationType],
        output: result.generatedMessage,
        model: provider === "openai" ? model : "mock-arbcore-ai"
      }
    });

    const usage = await prisma.aIUsage.create({
      data: {
        companyId: company.id,
        generationType,
        model: result.usage?.model ?? model,
        provider,
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens,
        totalTokens: result.usage?.totalTokens,
        usedFallback,
        errorMessage: fallbackError
      }
    });

    return created({
      ...generation,
      generatedMessage: result.generatedMessage,
      suggestedTitle: result.suggestedTitle,
      language: result.language,
      tone: result.tone,
      output: result.generatedMessage,
      usage: {
        ...(result.usage ?? {}),
        id: usage.id,
        model: result.usage?.model ?? model,
        provider,
        usedFallback,
        errorMessage: fallbackError
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function generateWithOpenAI({
  apiKey,
  model,
  generationType,
  language,
  tone,
  input
}: {
  apiKey: string;
  model: string;
  generationType: GenerationType;
  language: string;
  tone: string;
  input: ReturnType<typeof aiGenerateMessageSchema.parse>;
}): Promise<AiOutput> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You generate safe WhatsApp business messages for ARBCore SwiftConnect. " +
                "Do not generate spammy, deceptive, or misleading messages. Respect opt-out/STOP instructions. " +
                "Keep messages short, professional, and suitable for opted-in customers. " +
                "Support English, Bangla, and Banglish. Return only valid JSON."
            }
          ]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: buildUserPrompt(generationType, input) }]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "arbcore_ai_message",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              generatedMessage: { type: "string" },
              suggestedTitle: { type: "string" },
              language: { type: "string" },
              tone: { type: "string" }
            },
            required: ["generatedMessage", "suggestedTitle", "language", "tone"]
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API returned ${response.status}: ${errorBody.slice(0, 180)}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ text?: string; type?: string }>;
    }>;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
    };
  };
  const outputText = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).find((item) => typeof item.text === "string")?.text;
  const parsed = safeParseAiOutput(outputText, language, tone);

  return {
    generatedMessage: parsed.generatedMessage,
    suggestedTitle: parsed.suggestedTitle,
    language: parsed.language || language,
    tone: parsed.tone || tone,
    usage: {
      promptTokens: payload.usage?.input_tokens,
      completionTokens: payload.usage?.output_tokens,
      totalTokens: payload.usage?.total_tokens,
      model,
      provider: "openai",
      usedFallback: false
    }
  };
}

function safeParseAiOutput(outputText: string | undefined, language: string, tone: string): Omit<AiOutput, "usage"> {
  if (!outputText) {
    return {
      generatedMessage: "Thanks for reaching out. Our team will help shortly. Reply STOP to opt out.",
      suggestedTitle: "Generated WhatsApp Message",
      language,
      tone
    };
  }

  try {
    const parsed = JSON.parse(outputText) as Partial<Omit<AiOutput, "usage">>;
    return {
      generatedMessage: parsed.generatedMessage || outputText,
      suggestedTitle: parsed.suggestedTitle || "Generated WhatsApp Message",
      language: parsed.language || language,
      tone: parsed.tone || tone
    };
  } catch {
    return {
      generatedMessage: outputText,
      suggestedTitle: "Generated WhatsApp Message",
      language,
      tone
    };
  }
}

function buildUserPrompt(generationType: GenerationType, input: ReturnType<typeof aiGenerateMessageSchema.parse>) {
  return [
    `Generation type: ${generationLabels[generationType]}`,
    `Business name: ${input.businessName ?? "ARBCore SwiftConnect"}`,
    `Product or service: ${input.productOrService ?? input.context ?? "WhatsApp automation"}`,
    `Offer: ${input.offer ?? "No specific offer"}`,
    `Tone: ${input.tone ?? "professional"}`,
    `Language: ${input.language ?? "English"}`,
    `Target audience: ${input.targetAudience ?? input.customerName ?? "opted-in customers"}`,
    `Original message or prompt: ${input.originalMessage ?? input.prompt ?? "Create a helpful WhatsApp message."}`,
    "Return a concise WhatsApp-ready message and a short internal title."
  ].join("\n");
}

function generateMockMessage({
  generationType,
  language,
  tone,
  input,
  model,
  fallbackError
}: {
  generationType: GenerationType;
  language: string;
  tone: string;
  input: ReturnType<typeof aiGenerateMessageSchema.parse>;
  model: string;
  fallbackError?: string;
}): AiOutput {
  const audience = input.targetAudience ?? input.customerName ?? "there";
  const business = input.businessName ?? "ARBCore SwiftConnect";
  const product = input.productOrService ?? input.context ?? "WhatsApp automation";
  const offer = input.offer ? ` ${input.offer}` : "";
  const original = input.originalMessage ?? input.prompt ?? "";
  const generatedMessage =
    generationType === "bangla_english_rewrite"
      ? `Hi ${audience}, ${business} theke ${product} niye short update:${offer || " apnar jonno helpful option ache"}. Reply korle amra details pathabo. STOP likhle message bondho hobe.`
      : generationType === "short_professional_rewrite"
        ? `Hi ${audience}, ${original || `thanks for your interest in ${product}`}. We will help you shortly. Reply STOP to opt out.`
        : `Hi ${audience}, thanks for your interest in ${product}.${offer} Our team at ${business} can help with the next step. Reply STOP to opt out.`;

  return {
    generatedMessage,
    suggestedTitle: generationLabels[generationType],
    language,
    tone,
    usage: {
      model: fallbackError ? model : "mock-arbcore-ai",
      provider: "mock",
      usedFallback: true
    }
  };
}

function inferGenerationType(context?: string | null): GenerationType {
  const normalized = (context ?? "").toLowerCase();
  if (normalized.includes("offer")) return "product_offer";
  if (normalized.includes("follow")) return "follow_up";
  if (normalized.includes("auto")) return "auto_reply";
  if (normalized.includes("bangla") || normalized.includes("banglish")) return "bangla_english_rewrite";
  if (normalized.includes("rewrite")) return "short_professional_rewrite";
  return "campaign_message";
}

function inferLanguage(context?: string | null) {
  const normalized = (context ?? "").toLowerCase();
  if (normalized.includes("banglish")) return "Banglish";
  if (normalized.includes("bangla")) return "Bangla";
  return "English";
}
