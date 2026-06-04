export function parseTags(value: string | string[] | null | undefined) {
  if (!value) return [];
  const rawTags = Array.isArray(value) ? value : value.split(",");
  return normalizeTags(rawTags);
}

export function stringifyTags(tags: string[] | string | null | undefined) {
  const normalized = parseTags(tags);
  return normalized.length ? normalized.join(",") : undefined;
}

export function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, "-").toLowerCase();
}

export function normalizeTags(tags: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const value = normalizeTag(tag);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export function tagsMatchSearch(tags: string | string[] | null | undefined, search: string) {
  const normalizedSearch = normalizeTag(search);
  if (!normalizedSearch) return true;
  return parseTags(tags).some((tag) => tag.includes(normalizedSearch));
}
