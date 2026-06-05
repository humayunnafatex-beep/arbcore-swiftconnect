import { z } from "zod";

export const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

const productInputSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(160),
  sku: z.string().trim().max(80).optional(),
  price: z.coerce.number().int().min(0).max(100000000).optional(),
  availableSizes: z.string().trim().max(500).optional(),
  stockNote: z.string().trim().max(500).optional(),
  imageUrl: z.string().trim().max(1000).optional(),
  status: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional()
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function validateProductInput(input: unknown) {
  const parsed = productInputSchema.parse(input);
  const imageUrl = normalizeProductImageUrl(parsed.imageUrl);

  return {
    name: parsed.name,
    sku: parsed.sku ?? "",
    price: parsed.price ?? 0,
    availableSizes: normalizeAvailableSizes(parsed.availableSizes),
    stockNote: parsed.stockNote ?? "",
    imageUrl,
    status: normalizeProductStatus(parsed.status),
    notes: parsed.notes ?? ""
  };
}

export function normalizeProductImageUrl(value: string | null | undefined) {
  const url = value?.trim() ?? "";
  if (!url) return "";
  return isPublicProductImageUrl(url) ? url : "";
}

export function isPublicProductImageUrl(value: string | null | undefined) {
  const url = value?.trim() ?? "";
  return /^https:\/\/\S+$/i.test(url);
}

export function normalizeProductStatus(value: string | null | undefined): ProductStatus {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return PRODUCT_STATUSES.includes(normalized as ProductStatus) ? normalized as ProductStatus : "ACTIVE";
}

export function normalizeAvailableSizes(value: string | null | undefined) {
  return parseAvailableSizes(value).join(", ");
}

export function parseAvailableSizes(value: string | null | undefined) {
  return Array.from(new Set((value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)));
}
