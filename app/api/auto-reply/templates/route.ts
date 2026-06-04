import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/api-guard";
import { autoReplyTemplateCategories, autoReplyTemplates } from "@/lib/auto-reply-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requirePermission("autoReply.view");

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim().toLowerCase();
    const channel = searchParams.get("channel")?.trim().toUpperCase();
    const search = searchParams.get("search")?.trim().toLowerCase();

    const templates = autoReplyTemplates.filter((template) => {
      const matchesCategory = !category || template.category.toLowerCase() === category;
      const matchesChannel = !channel || channel === "ALL" || template.channelSuggestion === "BOTH" || template.channelSuggestion === channel;
      const matchesSearch =
        !search ||
        [
          template.title,
          template.category,
          template.description,
          template.suggestedKeyword,
          template.suggestedMatchType,
          template.channelSuggestion,
          template.replyText
        ].join(" ").toLowerCase().includes(search);

      return matchesCategory && matchesChannel && matchesSearch;
    });

    return ok({
      categories: autoReplyTemplateCategories,
      templates
    });
  } catch (error) {
    return handleApiError(error);
  }
}
