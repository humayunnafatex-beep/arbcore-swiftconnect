export const ORDER_STATUSES = ["DRAFT", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PARTIAL", "PAID", "COD"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const orderLabels: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
};

const paymentLabels: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
  COD: "COD"
};

export function normalizeOrderStatus(value: string | null | undefined): OrderStatus {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return ORDER_STATUSES.includes(normalized as OrderStatus) ? normalized as OrderStatus : "DRAFT";
}

export function normalizePaymentStatus(value: string | null | undefined): PaymentStatus {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return PAYMENT_STATUSES.includes(normalized as PaymentStatus) ? normalized as PaymentStatus : "UNPAID";
}

export function getOrderStatusLabel(value: string | null | undefined) {
  return orderLabels[normalizeOrderStatus(value)];
}

export function getPaymentStatusLabel(value: string | null | undefined) {
  return paymentLabels[normalizePaymentStatus(value)];
}

export function calculateOrderTotal({
  quantity,
  unitPrice,
  deliveryCharge
}: {
  quantity: number;
  unitPrice: number;
  deliveryCharge: number;
}) {
  return Math.max(1, Math.floor(quantity)) * Math.max(0, Math.floor(unitPrice)) + Math.max(0, Math.floor(deliveryCharge));
}
