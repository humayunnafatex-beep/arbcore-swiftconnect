import { ApiError } from "@/lib/api";
import { evaluateAutoReplyPreflight } from "@/lib/auto-reply-matcher";

type AuthorizedCompany = {
  id: string;
};

type MessengerAutoReplyPreflightDeps = {
  authorize: (request: Request) => Promise<AuthorizedCompany>;
  evaluate?: typeof evaluateAutoReplyPreflight;
  now?: () => Date;
};

const MAX_SYNTHETIC_TEXT_LENGTH = 280;

export function createMessengerAutoReplyPreflightGetHandler(deps: MessengerAutoReplyPreflightDeps) {
  return async function GET(request: Request) {
    const context = await deps.authorize(request);
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");

    if (text === null) {
      throw new ApiError(422, "INVALID_PREFLIGHT_TEXT", "Synthetic text is required.");
    }

    const boundedText = text.trim();
    if (!boundedText || boundedText.length > MAX_SYNTHETIC_TEXT_LENGTH) {
      throw new ApiError(422, "INVALID_PREFLIGHT_TEXT", "Synthetic text must be between 1 and 280 characters.");
    }

    const evaluatedAt = deps.now?.() ?? new Date();
    const evaluation = await (deps.evaluate ?? evaluateAutoReplyPreflight)({
      companyId: context.id,
      text: boundedText
    });

    return Response.json(
      {
        success: true,
        data: {
          evaluationSucceeded: true,
          activeRuleCount: evaluation.activeRuleCount,
          wouldMatch: evaluation.wouldMatch,
          configurationEvaluatedAt: evaluatedAt.toISOString(),
          limitations: [
            "Preflight evaluates current saved configuration only.",
            "A false result is not a guarantee because rules can change before the real Messenger event.",
            "Use synthetic text only; query text may appear in platform access logs.",
            "This endpoint does not send replies, write AutoReplyEvent, call Meta, or modify records."
          ]
        }
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache"
        }
      }
    );
  };
}
