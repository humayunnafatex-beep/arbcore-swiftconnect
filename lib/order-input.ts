import { z } from "zod";

export const orderInputSchema = z.object({
  contactId: z.string().trim().optional().nullable(),
  channel: z.enum(["WHATSAPP", "MESSENGER"]).optional(),
  customerKey: z.string().trim().max(120).optional(),
  orderNumber: z.string().trim().max(80).optional(),
  modelName: z.string().trim().max(160).optional(),
  size: z.string().trim().max(60).optional(),
  quantity: z.coerce.number().int().min(1).max(100000).optional(),
  unitPrice: z.coerce.number().int().min(0).max(100000000).optional(),
  deliveryCharge: z.coerce.number().int().min(0).max(100000000).optional(),
  customerName: z.string().trim().max(160).optional(),
  customerPhone: z.string().trim().max(40).optional(),
  deliveryAddress: z.string().trim().max(1000).optional(),
  paymentStatus: z.string().trim().optional(),
  orderStatus: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional()
});

export function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ARB-${date}-${suffix}`;
}
