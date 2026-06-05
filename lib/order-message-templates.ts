import { getOrderStatusLabel, getPaymentStatusLabel } from "./order-status";

export const ORDER_MESSAGE_TEMPLATE_IDS = [
  "ORDER_CONFIRMATION",
  "PAYMENT_REMINDER",
  "PACKED_UPDATE",
  "SHIPPED_UPDATE",
  "DELIVERED_FOLLOWUP",
  "CANCELLED_NOTICE"
] as const;

export type OrderMessageTemplateId = (typeof ORDER_MESSAGE_TEMPLATE_IDS)[number];

type OrderMessageTemplate = {
  id: OrderMessageTemplateId;
  label: string;
};

type OrderMessageInput = {
  customerName?: string | null;
  orderNumber?: string | null;
  modelName?: string | null;
  size?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  deliveryCharge?: number | null;
  totalAmount?: number | null;
  paymentStatus?: string | null;
  orderStatus?: string | null;
  deliveryAddress?: string | null;
};

const templates: OrderMessageTemplate[] = [
  { id: "ORDER_CONFIRMATION", label: "Order Confirmation" },
  { id: "PAYMENT_REMINDER", label: "Payment Reminder" },
  { id: "PACKED_UPDATE", label: "Packed Update" },
  { id: "SHIPPED_UPDATE", label: "Shipped Update" },
  { id: "DELIVERED_FOLLOWUP", label: "Delivered Follow-up" },
  { id: "CANCELLED_NOTICE", label: "Cancelled Notice" }
];

export function getOrderMessageTemplates() {
  return templates;
}

export function getOrderMessageTemplateLabel(templateId: string | null | undefined) {
  return templates.find((template) => template.id === templateId)?.label ?? "Order Message";
}

export function normalizeOrderMessageTemplateId(templateId: string | null | undefined): OrderMessageTemplateId {
  return ORDER_MESSAGE_TEMPLATE_IDS.includes(templateId as OrderMessageTemplateId)
    ? templateId as OrderMessageTemplateId
    : "ORDER_CONFIRMATION";
}

export function renderOrderMessage(templateId: string | null | undefined, order: OrderMessageInput) {
  const safeTemplateId = normalizeOrderMessageTemplateId(templateId);
  const fields = toMessageFields(order);

  switch (safeTemplateId) {
    case "PAYMENT_REMINDER":
      return [
        `Hello ${fields.customerName}, this is a reminder for your order ${fields.orderNumber}.`,
        `Product: ${fields.modelName}`,
        `Size: ${fields.size}`,
        `Qty: ${fields.quantity}`,
        `Total: Tk ${fields.totalAmount}`,
        `Payment status: ${fields.paymentStatus}`,
        "Please confirm payment or let us know if you need help."
      ].join("\n");
    case "PACKED_UPDATE":
      return [
        `Hello ${fields.customerName}, your order ${fields.orderNumber} is now packed.`,
        `Product: ${fields.modelName}`,
        `Size: ${fields.size}`,
        `Qty: ${fields.quantity}`,
        `Total: Tk ${fields.totalAmount}`,
        "We will update you again when it is shipped."
      ].join("\n");
    case "SHIPPED_UPDATE":
      return [
        `Hello ${fields.customerName}, your order ${fields.orderNumber} has been shipped.`,
        `Product: ${fields.modelName}`,
        `Size: ${fields.size}`,
        `Qty: ${fields.quantity}`,
        `Delivery address: ${fields.deliveryAddress}`,
        "Please keep your phone available for delivery contact."
      ].join("\n");
    case "DELIVERED_FOLLOWUP":
      return [
        `Hello ${fields.customerName}, we hope your order ${fields.orderNumber} was delivered safely.`,
        `Product: ${fields.modelName}`,
        `Size: ${fields.size}`,
        "Please let us know if everything is okay. Thank you for shopping with us."
      ].join("\n");
    case "CANCELLED_NOTICE":
      return [
        `Hello ${fields.customerName}, your order ${fields.orderNumber} has been cancelled.`,
        `Product: ${fields.modelName}`,
        `Size: ${fields.size}`,
        `Order status: ${fields.orderStatus}`,
        "Please contact us if you need any help or want to place a new order."
      ].join("\n");
    case "ORDER_CONFIRMATION":
    default:
      return [
        `Hello ${fields.customerName}, your order ${fields.orderNumber} has been confirmed.`,
        `Product: ${fields.modelName}`,
        `Size: ${fields.size}`,
        `Qty: ${fields.quantity}`,
        `Unit price: Tk ${fields.unitPrice}`,
        `Delivery charge: Tk ${fields.deliveryCharge}`,
        `Total: Tk ${fields.totalAmount}`,
        `Delivery address: ${fields.deliveryAddress}`,
        "Thank you for shopping with us."
      ].join("\n");
  }
}

function toMessageFields(order: OrderMessageInput) {
  return {
    customerName: text(order.customerName, "Customer"),
    orderNumber: text(order.orderNumber),
    modelName: text(order.modelName),
    size: text(order.size),
    quantity: String(order.quantity ?? "N/A"),
    unitPrice: money(order.unitPrice),
    deliveryCharge: money(order.deliveryCharge),
    totalAmount: money(order.totalAmount),
    paymentStatus: getPaymentStatusLabel(order.paymentStatus),
    orderStatus: getOrderStatusLabel(order.orderStatus),
    deliveryAddress: text(order.deliveryAddress)
  };
}

function text(value: string | null | undefined, fallback = "N/A") {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function money(value: number | null | undefined) {
  return Number.isFinite(value) ? String(value) : "N/A";
}
